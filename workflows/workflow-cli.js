#!/usr/bin/env node

const { PipelineOrchestrator } = require('./orchestrator');

const command = process.argv[2];
const arg = process.argv[3];

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  fgRed: '\x1b[31m',
  fgGreen: '\x1b[32m',
  fgYellow: '\x1b[33m',
  fgBlue: '\x1b[34m',
  fgMagenta: '\x1b[35m',
  fgCyan: '\x1b[36m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m'
};

const orchestrator = new PipelineOrchestrator();

function printHelp() {
  console.log(`
${colors.bright}${colors.fgCyan}AG Kit Workflow CLI${colors.reset}
Usage:
  node workflows/workflow-cli.js init <full|feature>  Initialize a development pipeline
  node workflows/workflow-cli.js status              Display active stage, deliverables & checkpoint status
  node workflows/workflow-cli.js approve <checkpoint> Approve a human-in-the-loop checkpoint
  node workflows/workflow-cli.js next                 Advance to the next pipeline stage (validates current stage)
  node workflows/workflow-cli.js force <stage>        Force jump to a stage (development bypass)
  `);
}

function printStatus() {
  const status = orchestrator.getStatus();
  
  console.log(`\n======================================================`);
  console.log(`${colors.bright}${colors.fgCyan}PROJECT DEVELOPMENT WORKFLOW STATUS${colors.reset}`);
  console.log(`======================================================`);
  console.log(`${colors.bright}Pipeline Type:${colors.reset} ${colors.fgMagenta}${status.pipeline_type.toUpperCase()}${colors.reset}`);
  console.log(`${colors.bright}Current Stage:${colors.reset} ${colors.fgYellow}${status.current_stage.toUpperCase()}${colors.reset}`);
  console.log(`${colors.bright}Stage Name:${colors.reset}    ${status.stage_name}`);
  console.log(`${colors.bright}Description:${colors.reset}   ${status.stage_description}`);
  console.log(`------------------------------------------------------`);
  
  // Progress bar / flow visualization
  console.log(`${colors.bright}Pipeline Progress:${colors.reset}`);
  const flowStr = status.flow.map(s => {
    if (s === status.current_stage) {
      return `${colors.bright}${colors.bgGreen} ${s.toUpperCase()} ${colors.reset}`;
    }
    return `${colors.dim}${s}${colors.reset}`;
  }).join(' ➔ ');
  console.log(`  ${flowStr}\n`);

  // Deliverables
  console.log(`${colors.bright}Deliverables & Requirements:${colors.reset}`);
  if (status.deliverables.length === 0) {
    console.log(`  ${colors.dim}No specific deliverables required for this stage.${colors.reset}`);
  } else {
    status.deliverables.forEach(d => {
      const existIcon = d.exists ? `${colors.fgGreen}✔ Exists${colors.reset}` : `${colors.fgRed}✘ Missing${colors.reset}`;
      console.log(`  ➔ [${existIcon}] ${colors.bright}${d.file}${colors.reset}`);
      if (d.exists) {
        const contentIcon = d.contentValid ? `${colors.fgGreen}✔ Verified${colors.reset}` : `${colors.fgRed}✘ Invalid Content${colors.reset}`;
        console.log(`     Content Validation: ${contentIcon}`);
        if (!d.contentValid && d.missingSections.length > 0) {
          console.log(`     ${colors.fgRed}Missing Required Sections:${colors.reset}`);
          d.missingSections.forEach(sec => console.log(`      - "${sec}"`));
        }
      }
    });
  }
  console.log('');

  // Checkpoint
  console.log(`${colors.bright}Checkpoint Approval:${colors.reset}`);
  if (!status.checkpoint) {
    console.log(`  ${colors.dim}No checkpoint approval required for this stage.${colors.reset}`);
  } else {
    const approvalIcon = status.checkpoint.approved 
      ? `${colors.fgGreen}✔ APPROVED${colors.reset}` 
      : `${colors.fgRed}⏳ PENDING HUMAN APPROVAL${colors.reset}`;
    console.log(`  ➔ [${approvalIcon}] ${colors.bright}${status.checkpoint.name}${colors.reset}`);
    console.log(`     ID: ${status.checkpoint.id}`);
    console.log(`     Info: ${status.checkpoint.description}`);
    if (!status.checkpoint.approved) {
      console.log(`\n     ${colors.fgYellow}To approve run: node workflows/workflow-cli.js approve ${status.checkpoint.id}${colors.reset}`);
    }
  }

  // Next Step hint
  console.log(`------------------------------------------------------`);
  const validation = orchestrator.validateCurrentStage();
  if (validation.valid) {
    if (status.current_stage !== 'completed') {
      console.log(`${colors.fgGreen}${colors.bright}✔ All requirements met for this stage. Ready to advance!${colors.reset}`);
      console.log(`Run: ${colors.fgCyan}node workflows/workflow-cli.js next${colors.reset} to advance.`);
    } else {
      console.log(`${colors.fgGreen}${colors.bright}🎉 Project successfully completed!${colors.reset}`);
    }
  } else {
    console.log(`${colors.fgRed}${colors.bright}✘ Blocked: Cannot advance yet.${colors.reset}`);
    validation.errors.forEach(err => console.log(`  - ${err}`));
  }
  console.log(`======================================================\n`);
}

switch (command) {
  case 'init':
    if (!arg || (arg !== 'full' && arg !== 'feature')) {
      console.error(`${colors.fgRed}Error: Please specify 'full' or 'feature' pipeline type.${colors.reset}`);
      printHelp();
      process.exit(1);
    }
    orchestrator.initPipeline(arg);
    console.log(`${colors.fgGreen}Pipeline successfully initialized to: ${colors.bright}${arg.toUpperCase()}${colors.reset}`);
    printStatus();
    break;

  case 'status':
    printStatus();
    break;

  case 'approve':
    if (!arg) {
      console.error(`${colors.fgRed}Error: Please specify the checkpoint to approve (e.g. checkpoint_1).${colors.reset}`);
      process.exit(1);
    }
    try {
      orchestrator.approveCheckpoint(arg);
      console.log(`${colors.fgGreen}✔ Checkpoint '${arg}' successfully approved!${colors.reset}`);
      printStatus();
    } catch (e) {
      console.error(`${colors.fgRed}Error: ${e.message}${colors.reset}`);
    }
    break;

  case 'next':
    try {
      orchestrator.transitionToNext();
      console.log(`${colors.fgGreen}✔ Advanced successfully!${colors.reset}`);
      printStatus();
    } catch (e) {
      console.error(`${colors.fgRed}Error advancing stage:${colors.reset}\n${e.message}\n`);
    }
    break;

  case 'force':
    if (!arg) {
      console.error(`${colors.fgRed}Error: Please specify the stage to force jump to.${colors.reset}`);
      process.exit(1);
    }
    if (!orchestrator.config.stages[arg]) {
      console.error(`${colors.fgRed}Error: Invalid stage name '${arg}'.${colors.reset}`);
      process.exit(1);
    }
    orchestrator.state.current_stage = arg;
    orchestrator.state.history.push({
      from: 'bypass',
      to: arg,
      timestamp: new Date().toISOString(),
      notes: `Force transition by developer.`
    });
    orchestrator.saveState();
    console.log(`${colors.fgYellow}⚠ Warning: Forced stage to '${arg}'. Deliverables and checkpoint approvals bypassed.${colors.reset}`);
    printStatus();
    break;

  default:
    printHelp();
    break;
}

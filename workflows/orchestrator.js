const fs = require('fs');
const path = require('path');

const GitHelper = require('./git-helper');

const WORKSPACE_DIR = path.resolve(__dirname, '..');
const PIPELINE_CONFIG_PATH = path.join(__dirname, 'pipeline.json');
const STATE_PATH = path.join(__dirname, 'state.json');

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file at ${filePath}:`, error.message);
    throw error;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing file to ${filePath}:`, error.message);
    throw error;
  }
}

class PipelineOrchestrator {
  constructor() {
    this.config = readJsonFile(PIPELINE_CONFIG_PATH);
    if (!this.config) {
      throw new Error('Pipeline configuration file (pipeline.json) not found.');
    }
    this.git = new GitHelper();
    this.loadState();
  }

  loadState() {
    this.state = readJsonFile(STATE_PATH);
    if (!this.state) {
      this.state = {
        pipeline_type: 'full',
        current_stage: 'idle',
        checkpoint_approvals: {
          checkpoint_1: false,
          checkpoint_2: false,
          checkpoint_3: false
        },
        history: []
      };
      this.saveState();
    }
  }

  saveState() {
    writeJsonFile(STATE_PATH, this.state);
  }

  initPipeline(type) {
    if (!this.config.pipelines[type]) {
      throw new Error(`Invalid pipeline type: ${type}. Choose 'full' or 'feature'.`);
    }
    const oldStage = this.state.current_stage;
    const firstStage = this.config.pipelines[type].flow[0];
    
    this.state.pipeline_type = type;
    this.state.current_stage = firstStage;
    this.state.checkpoint_approvals = {
      checkpoint_1: false,
      checkpoint_2: false,
      checkpoint_3: false
    };
    this.state.history.push({
      from: oldStage,
      to: firstStage,
      timestamp: new Date().toISOString(),
      notes: `Pipeline initialized to type: ${type}`
    });
    
    this.saveState();
    return this.state;
  }

  getStatus() {
    const pipelineDef = this.config.pipelines[this.state.pipeline_type];
    const flow = pipelineDef ? pipelineDef.flow : [];
    const currentIdx = flow.indexOf(this.state.current_stage);
    
    const stageDetails = this.config.stages[this.state.current_stage] || {
      name: 'Idle / Uninitialized',
      description: 'No active pipeline. Run init command.',
      required_deliverables: [],
      validations: {},
      checkpoint: null
    };

    // Calculate validation status for deliverables
    const deliverablesStatus = [];
    if (stageDetails.validations) {
      const { files_exist, content_checks } = stageDetails.validations;
      
      if (files_exist) {
        for (const relativePath of files_exist) {
          const absolutePath = path.join(WORKSPACE_DIR, relativePath);
          const exists = fs.existsSync(absolutePath);
          let contentValidation = { ok: true, missing: [] };

          if (exists && content_checks && content_checks[relativePath]) {
            const content = fs.readFileSync(absolutePath, 'utf8');
            const requiredSections = content_checks[relativePath];
            const missing = [];
            
            for (const section of requiredSections) {
              const regex = new RegExp(section, 'i');
              if (!regex.test(content)) {
                missing.push(section);
              }
            }
            if (missing.length > 0) {
              contentValidation = { ok: false, missing };
            }
          }

          deliverablesStatus.push({
            file: relativePath,
            exists,
            contentValid: contentValidation.ok,
            missingSections: contentValidation.missing
          });
        }
      }
    }

    // Checkpoint status
    let checkpointApproved = true;
    let checkpointInfo = null;
    if (stageDetails.checkpoint) {
      checkpointApproved = !!this.state.checkpoint_approvals[stageDetails.checkpoint];
      checkpointInfo = {
        id: stageDetails.checkpoint,
        name: this.config.checkpoints[stageDetails.checkpoint].name,
        description: this.config.checkpoints[stageDetails.checkpoint].description,
        approved: checkpointApproved
      };
    }

    return {
      pipeline_type: this.state.pipeline_type,
      current_stage: this.state.current_stage,
      stage_name: stageDetails.name,
      stage_description: stageDetails.description,
      deliverables: deliverablesStatus,
      checkpoint: checkpointInfo,
      history: this.state.history,
      flow
    };
  }

  approveCheckpoint(checkpointId, approvedBy = 'Human') {
    if (!this.config.checkpoints[checkpointId]) {
      throw new Error(`Invalid checkpoint ID: ${checkpointId}`);
    }
    
    this.state.checkpoint_approvals[checkpointId] = true;
    this.state.history.push({
      action: 'approval',
      checkpoint: checkpointId,
      approved_by: approvedBy,
      timestamp: new Date().toISOString()
    });
    
    this.saveState();
    return true;
  }

  validateCurrentStage() {
    if (this.state.current_stage === 'idle' || this.state.current_stage === 'completed') {
      return { valid: true };
    }

    const status = this.getStatus();
    const errors = [];

    // 1. Deliverables Checks
    for (const fileStatus of status.deliverables) {
      if (!fileStatus.exists) {
        errors.push(`Missing required file: ${fileStatus.file}`);
      } else if (!fileStatus.contentValid) {
        errors.push(`File ${fileStatus.file} is missing required sections: ${fileStatus.missingSections.join(', ')}`);
      }
    }

    // 2. Checkpoint Approval Check
    if (status.checkpoint && !status.checkpoint.approved) {
      errors.push(`Required checkpoint not approved: ${status.checkpoint.name} (${status.checkpoint.id})`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  transitionToNext() {
    const pipelineDef = this.config.pipelines[this.state.pipeline_type];
    if (!pipelineDef) {
      throw new Error('Pipeline not initialized. Run init first.');
    }

    const flow = pipelineDef.flow;
    const currentIdx = flow.indexOf(this.state.current_stage);
    
    if (currentIdx === -1) {
      throw new Error(`Current stage '${this.state.current_stage}' not found in active pipeline flow.`);
    }

    if (currentIdx === flow.length - 1) {
      throw new Error('Pipeline is already completed. No further stages.');
    }

    // Validate current stage deliverables and checkpoints
    const validation = this.validateCurrentStage();
    if (!validation.valid) {
      throw new Error(`Cannot transition. Validation failed:\n - ${validation.errors.join('\n - ')}`);
    }

    const nextStage = flow[currentIdx + 1];
    const oldStage = this.state.current_stage;

    // GIT TRANSITION LOGIC
    let gitAction = null;
    if (this.git.isRepo() || (oldStage === 'design' && nextStage === 'extraction')) {
      try {
        // 1. Initialize repo if it doesn't exist and we are advancing after design
        if (oldStage === 'design' && nextStage === 'extraction') {
          if (!this.git.isRepo()) {
            console.log('Initializing new Git repository...');
            this.git.initRepo();
          }
          // Determine branch name based on pipeline type
          const branch = this.state.pipeline_type === 'full' ? 'feature/crm-mvp' : 'feature/crm-feature';
          console.log(`Checking out branch: ${branch}`);
          this.git.checkoutOrCreateBranch(branch, 'develop');
          
          this.git.stageAndCommit(`chore: initial crm feature workspace setup on ${branch}`);
          
          gitAction = {
            type: 'push',
            branches: [branch],
            notes: 'Git repository initialized. Branches main, develop, and feature branch created.'
          };
        } 
        // 2. Commit on features and merge on completion
        else {
          const currentBranch = this.git.getCurrentBranch();
          
          if (nextStage === 'completed') {
            // Commit final MVP work on feature branch
            this.git.stageAndCommit(`feat: complete ${this.state.pipeline_type} pipeline building phase`);
            
            console.log(`GitFlow consolidation: merging ${currentBranch} into develop and main...`);
            // Switch to develop and merge feature branch
            this.git.checkoutOrCreateBranch('develop');
            this.git.merge(currentBranch, 'develop', `chore: consolidate feature branch ${currentBranch}`);
            
            // Create release branch from develop
            const releaseBranch = `release/v1.0.0-beta`;
            this.git.checkoutOrCreateBranch(releaseBranch, 'develop');
            
            // Merge release into main
            this.git.checkoutOrCreateBranch('main');
            this.git.merge(releaseBranch, 'main', `release: version v1.0.0-beta`);
            
            // Tag main
            try {
              this.git.exec('tag -a v1.0.0-beta -m "Release v1.0.0-beta"');
            } catch (e) {
              console.warn('Tag already exists or tag creation failed:', e.message);
            }
            
            // Merge main back to develop
            this.git.checkoutOrCreateBranch('develop');
            this.git.merge('main', 'develop', `chore: merge release changes back to develop`);
            
            // Delete feature and release branches locally
            try {
              this.git.exec(`branch -d ${releaseBranch}`);
              this.git.exec(`branch -d ${currentBranch}`);
            } catch (e) {
              console.warn('Failed to delete temporary branches locally:', e.message);
            }
            
            gitAction = {
              type: 'push',
              branches: ['main', 'develop'],
              notes: 'Consolidated branches merged. Release v1.0.0-beta tagged on main.'
            };
          } else {
            // Intermediate stages: Commit deliverables
            const commitMessage = `feat: complete stage ${oldStage} in ${this.state.pipeline_type} pipeline`;
            const committed = this.git.stageAndCommit(commitMessage);
            if (committed) {
              console.log(`Committed changes to branch ${currentBranch}: "${commitMessage}"`);
            }
            
            gitAction = {
              type: 'push',
              branches: [currentBranch],
              notes: `Stage ${oldStage} committed to ${currentBranch}.`
            };
          }
        }
      } catch (gitError) {
        console.error('Git integration warning (continuing transition):', gitError.message);
        this.state.history.push({
          action: 'git_error',
          error: gitError.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    this.state.current_stage = nextStage;
    this.state.history.push({
      from: oldStage,
      to: nextStage,
      timestamp: new Date().toISOString(),
      notes: `Transitioned to next stage: ${nextStage}`
    });

    this.saveState();
    return { state: this.state, gitAction };
  }
}

module.exports = { PipelineOrchestrator };

const fs = require('fs');
const path = require('path');

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
    
    this.state.current_stage = nextStage;
    this.state.history.push({
      from: oldStage,
      to: nextStage,
      timestamp: new Date().toISOString(),
      notes: `Transitioned to next stage: ${nextStage}`
    });

    this.saveState();
    return this.state;
  }
}

module.exports = { PipelineOrchestrator };

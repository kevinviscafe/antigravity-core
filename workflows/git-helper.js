const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = path.resolve(__dirname, '..');

class GitHelper {
  constructor() {
    this.cwd = WORKSPACE_DIR;
  }

  // Execute a git command and return stdout
  exec(args) {
    try {
      const output = execSync(`git ${args}`, {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8'
      });
      return output.trim();
    } catch (error) {
      // Return error message to let caller handle it
      throw new Error(error.stderr ? error.stderr.trim() : error.message);
    }
  }

  // Check if workspace is a git repository
  isRepo() {
    try {
      const res = this.exec('rev-parse --is-inside-work-tree');
      return res === 'true';
    } catch (e) {
      return false;
    }
  }

  // Initialize git repository
  initRepo() {
    try {
      // 1. Git init
      this.exec('init');
      
      // Ensure we have a default .gitignore
      const gitignorePath = path.join(this.cwd, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        const defaultGitignore = 'node_modules/\n.gemini/\n*.log\nstate.json\n';
        fs.writeFileSync(gitignorePath, defaultGitignore, 'utf8');
      }

      // Check current default branch name (usually master or main)
      let initialBranch = 'main';
      try {
        initialBranch = this.exec('branch --show-current') || 'main';
      } catch (e) {
        // Fallback
      }

      // 2. Stage and initial commit if no commit exists
      let hasCommits = false;
      try {
        this.exec('rev-parse HEAD');
        hasCommits = true;
      } catch (e) {
        hasCommits = false;
      }

      if (!hasCommits) {
        this.exec('add .');
        this.exec('commit -m "chore: initial repository setup"');
      }

      // 3. Rename current branch to main if it's master and we want main
      try {
        const current = this.exec('branch --show-current');
        if (current === 'master') {
          this.exec('branch -M main');
          initialBranch = 'main';
        }
      } catch (e) {
        // Ignore branch rename error
      }

      // 4. Create develop branch from main
      if (!this.hasBranch('develop')) {
        this.exec('branch develop');
      }

      // 5. Checkout develop
      this.exec('checkout develop');
      return true;
    } catch (error) {
      console.error('Failed to initialize Git repository:', error.message);
      throw error;
    }
  }

  // Check if branch exists locally
  hasBranch(branchName) {
    try {
      const branches = this.exec('branch --list');
      const branchList = branches.split('\n').map(b => b.replace(/[\s*]/g, ''));
      return branchList.includes(branchName);
    } catch (e) {
      return false;
    }
  }

  // Get current active branch
  getCurrentBranch() {
    try {
      return this.exec('branch --show-current');
    } catch (e) {
      return null;
    }
  }

  // Checkout existing branch or create it from parent
  checkoutOrCreateBranch(branchName, parentBranch = 'develop') {
    try {
      if (this.getCurrentBranch() === branchName) {
        return true;
      }

      if (this.hasBranch(branchName)) {
        this.exec(`checkout ${branchName}`);
      } else {
        // Ensure parent exists
        if (!this.hasBranch(parentBranch)) {
          // If parent is develop but doesn't exist, create it from main
          if (parentBranch === 'develop' && this.hasBranch('main')) {
            this.exec('branch develop main');
          } else {
            throw new Error(`Parent branch '${parentBranch}' does not exist.`);
          }
        }
        this.exec(`checkout -b ${branchName} ${parentBranch}`);
      }
      return true;
    } catch (error) {
      console.error(`Failed to checkout or create branch ${branchName}:`, error.message);
      throw error;
    }
  }

  // Stage all modifications and commit them
  stageAndCommit(message) {
    try {
      // Check if there are changes to commit
      const status = this.exec('status --porcelain');
      if (!status) {
        // No changes, skip commit
        return false;
      }
      this.exec('add .');
      this.exec(`commit -m "${message}"`);
      return true;
    } catch (error) {
      console.error('Failed to commit changes:', error.message);
      throw error;
    }
  }

  // Merge sourceBranch into targetBranch
  merge(sourceBranch, targetBranch, message = null) {
    const current = this.getCurrentBranch();
    try {
      this.exec(`checkout ${targetBranch}`);
      const msgFlag = message ? ` -m "${message}"` : ' --no-edit';
      this.exec(`merge ${sourceBranch}${msgFlag}`);
      
      // Return to original branch
      if (current && current !== targetBranch) {
        this.exec(`checkout ${current}`);
      }
      return true;
    } catch (error) {
      // In case of error, try to return to original branch
      try {
        if (current) this.exec(`checkout ${current}`);
      } catch (e) {}
      console.error(`Failed to merge ${sourceBranch} into ${targetBranch}:`, error.message);
      throw error;
    }
  }

  // Check if a remote origin is configured
  hasRemote() {
    try {
      const remotes = this.exec('remote');
      return remotes.split('\n').filter(r => r.trim().length > 0).includes('origin');
    } catch (e) {
      return false;
    }
  }

  // Return the command to push, or run push if possible
  push(branchName) {
    try {
      if (!this.hasRemote()) {
        return false;
      }
      this.exec(`push -u origin ${branchName}`);
      return true;
    } catch (error) {
      console.error(`Failed to push branch ${branchName}:`, error.message);
      throw error;
    }
  }
}

module.exports = GitHelper;

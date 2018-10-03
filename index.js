'use strict';

class ServerlessPluginSlackNotify {
  constructor(serverless, options) {
    ServerlessPluginSlackNotify.validateConfiguration(serverless);

    this.serverless = serverless;
    this.options = options;

    this.log = serverless.cli.consoleLog;

    this.debug = this.options.debug ? true : false;

    const config = serverless.service.custom['slack-notify'];

    this.webhook_url = config.webhook_url;

    this.hooks = {
      'after:package:finalize': this.deployService.bind(this),
    };
  }

  static validateConfiguration(serverless) {
    const custom = serverless.service.custom;
    if (!custom || !serverless.service.custom['slack-notify']) {
      throw new Error("Missing 'slack-notify' configuration!");
    }

    const config = serverless.service.custom['slack-notify'];

    if (!config.webhook_url) {
      throw new Error("Missing 'webhook_url' in config!");
    }
  }

  getUser() {
    return process.env.SLS_USER || process.env.USER;
  }

  async getGitCommandOutput(command) {
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);

    try {
      const { stdout } = await exec(command);
      return stdout.trim();
    } catch (err) {
      if (this.debug) {
        this.log(err.message);
      }
      return;
    }
  }

  async getGitVersion() {

    const version = {};
    version.tag = await this.getGitCommandOutput('git describe --tags');
    version.branch = await this.getGitCommandOutput('git symbolic-ref --short HEAD');
    version.commit_hash = await this.getGitCommandOutput('git rev-parse --short HEAD');

    return version;
  }

  formatGitVersion(version) {
    let message = [];
    if (version.tag || version.branch) {
      if (version.tag) {
        message.push(`version ${version.tag}`);
      } else {
        message.push(`branch ${version.branch}`);
      }
      if (version.commit_hash) {
        message.push(`(${version.commit_hash})`);
      }
    } else {
      message.push(`commit ${version.commit_hash}`);
    }

    return message.join(' ');
  }

  createMessage(options) {
    let message = `${options.user} deployed ${this.serverless.service.service} - stage: ${this.options.stage}`;
    if (options.environment) {
      message += ` to the ${this.options.environment} environment`;
    }
    if (options.git_version) {
      message += ` from ${this.formatGitVersion(options.git_version)}`;
    }
    return message;
  }

  postMessage(message) {
    this.serverless.cli.log(`POSTing to slack: ${message}`);
  }

  async deployService() {
    const user = this.getUser();
    const git_version = await this.getGitVersion();

    const message = this.createMessage({ user, git_version });

    return this.postMessage(message);
  }

}

module.exports = ServerlessPluginSlackNotify;

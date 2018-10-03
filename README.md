# Serverless Plugin Slack Notify

Serverless plugin to notify a slack channel on deployments.

## Install

Using npm:

    npm install serverless-plugin-slack-notify --save-dev

Add the plugin to your serverless.yml file:

    plugins:
    - serverless-plugin-slack-notify

## Configuration

    ```
    custom:
      slack-notify:
        webhook_url: https://hooks.slack.com/services/XXX/YYY/ZZZ
    ```

"""Workflow lint package: framework + checks for `.github/workflows/**` policies.

The CLI entrypoint is wired via the ``click:`` manifest entry in ``insightscli.yaml``;
the lazy loader resolves ``insightscli_commands.workflow_lint.cli:cmd_lint_workflows``
on demand. To run from the command line:

    bin/insightscli lint:workflows
    bin/insightscli lint:workflows --check WF001
    bin/insightscli lint:workflows --list
"""

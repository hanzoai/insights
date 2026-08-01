"""Insights-specific insightscli commands, loaded lazily by the insightscli framework.

Each command module is imported on first invoke via the ``click:`` import
strings in ``insightscli.yaml``. Boot-time registrations (prechecks, telemetry
property hooks, post-command hooks) are listed in ``config.boot_modules``.

The framework itself lives in ``tools/insightscli/``; this package is discovered
via ``config.commands_dir`` in ``insightscli.yaml``.
"""

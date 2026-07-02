#!/usr/bin/env python
"""RETIRED. Hanzo Insights' Django backend has been decommissioned.

Observability is served the ONE way by the native-Go cloud binary at
/v1/evals/* and /v1/analytics/*. This shim exists only to make the retirement
explicit: it refuses to run any Django management command.
"""

import sys

_NOTICE = """============================================================================
 Hanzo Insights' legacy Django/PostHog server is RETIRED. There is now
 exactly ONE observability way, served natively (Go) by the cloud binary:

   /v1/evals/*   datasets, dataset-items, evaluators, score-configs, scores,
                 traces, runs   (LIVE, org-scoped by IAM owner)
   /v1/analytics/*   LLM analytics lens (cloud clients/analytics)

 LLM telemetry (traces / observations / scores) is written by the AI gateway
 into the ClickHouse warehouse (hanzo.traces / hanzo.observations /
 hanzo.scores) and read back through /v1/evals + /v1/analytics.

 See LLM.md -> "Django -> Go retire map" for the full feature mapping.
 The Django web/worker are no longer built or deployed. No backwards compat.
============================================================================"""


def main() -> "int":
    sys.stderr.write(_NOTICE + "\n")
    sys.stderr.write("refused: 'manage.py %s' — the Django app is retired.\n" % " ".join(sys.argv[1:]))
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

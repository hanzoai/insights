#!/usr/bin/env python3
"""Assert this fork still contains the modules that make it a fork.

An upstream rebase deletes our files without a conflict, because upstream never
had them: taking "upstream's version" of a path we invented is a clean delete.
Nothing goes red, so the loss is invisible until something that needed the file
is finally run. `e443a4dab` did exactly that on 2026-08-01 and was found eight
days later, by which time the tree had been rebased twice more on top of it.

So this is a ratchet, not a wishlist. HELD is what must exist. LOST is what is
already gone, named with the commit that removed it, so the list shrinks as
things are restored and the build fails the moment it would grow.
"""

import subprocess
import sys
from pathlib import Path

# Ours, present, and load-bearing. Losing one of these is a silent regression.
HELD = {
    "nodejs/src/api/principal.ts": "IAM principal verifier: JWKS check, {user, org} from signed claims",
    "rust/.sqlx": "offline query cache; cyclotron-core cannot compile without it",
    "nodejs/src/plugin-scaffold.ts": "inlined v1.4.4 scaffold — 174 `~/plugin-scaffold` imports resolve here",
}

# Ours, deleted by the commit named, not yet restored. Each is a decision someone
# has to make, not a file to quietly re-add: upstream has moved underneath them.
LOST = {
    "nodejs/src/common/redis/base-adapter.ts": "e443a4dab — Base/SQLite KV strangle; 0.1.8 runs it, the tree no longer has it",
    "nodejs/src/api/team-access.ts": "e443a4dab — authorizes :team_id against the principal's org",
    "nodejs/src/api/router.ts": "e443a4dab — where the IAM gate was mounted",
}


def main() -> int:
    root = Path(
        subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
    )

    missing = [(p, why) for p, why in HELD.items() if not (root / p).exists()]
    returned = [(p, why) for p, why in LOST.items() if (root / p).exists()]

    for path, why in sorted(LOST.items()):
        if not (root / path).exists():
            print(f"  lost      {path}\n            {why}")

    for path, why in returned:
        print(f"  restored  {path}\n            {why}\n            -> move it from LOST to HELD")

    if missing:
        print("\nA module this fork owns is gone from the tree:\n")
        for path, why in missing:
            print(f"  MISSING   {path}\n            {why}")
        print(
            "\nIf an upstream merge removed it, that was a silent revert and not a\n"
            "decision — restore it, or move it to LOST with the commit that took it\n"
            "and say why it is staying gone."
        )
        return 1

    if returned:
        print("\nMove the restored entries to HELD so they are guarded from here on.")
        return 1

    print(f"  held {len(HELD)}, lost {len(LOST)} — inventory unchanged")
    return 0


if __name__ == "__main__":
    sys.exit(main())

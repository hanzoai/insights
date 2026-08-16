"""Validation utilities for insightscli manifest."""

from __future__ import annotations

import yaml

from insightscli.manifest import MANIFEST_FILE, get_manifest


def get_bin_scripts() -> set[str]:
    """Get all executable scripts in scripts_dir (excludes entry points and config)."""
    manifest = get_manifest()
    scripts_dir = manifest.scripts_dir
    if not scripts_dir.exists():
        return set()

    # Exclude files listed in config.scripts_exclude (entry points, config files, etc)
    # lint-feature-flag-sorting.mjs is registered via cmd: not bin_script:
    default_excluded = {"insightscli"}
    excluded = set(manifest.config.get("scripts_exclude", [])) | default_excluded

    scripts = set()
    for f in scripts_dir.iterdir():
        if f.name in excluded or not f.is_file() or f.is_symlink():
            continue
        # Check if executable and not a config file
        if (f.stat().st_mode & 0o111) and f.suffix not in {".yaml", ".yml", ".env"}:
            scripts.add(f.name)

    return scripts


def get_manifest_scripts() -> set[str]:
    """Get all bin_script entries from manifest."""
    manifest = get_manifest()
    scripts = set()

    for category, commands in manifest.data.items():
        if category == "metadata" or not isinstance(commands, dict):
            continue
        for cmd_config in commands.values():
            if isinstance(cmd_config, dict) and (script := cmd_config.get("bin_script")):
                scripts.add(script)

    return scripts


def find_missing_manifest_entries() -> set[str]:
    """Find bin scripts not in manifest."""
    bin_scripts = get_bin_scripts()
    manifest_scripts = get_manifest_scripts()
    return bin_scripts - manifest_scripts


def find_orphan_manifest_entries() -> set[str]:
    """Find manifest entries whose bin_script target does not exist in scripts_dir."""
    manifest = get_manifest()
    scripts_dir = manifest.scripts_dir
    if not scripts_dir.exists():
        return set()
    orphans: set[str] = set()

    for category, commands in manifest.data.items():
        if category == "metadata" or not isinstance(commands, dict):
            continue
        for cmd_name, cmd_config in commands.items():
            if not isinstance(cmd_config, dict):
                continue
            script = cmd_config.get("bin_script")
            if script and not (scripts_dir / script).exists():
                orphans.add(cmd_name)

    return orphans


def generate_missing_entries() -> dict[str, dict]:
    """Generate manifest entries for missing bin scripts.

    Auto-discovered commands are marked as hidden by default until reviewed.
    """
    missing = find_missing_manifest_entries()
    if not missing:
        return {}

    entries = {}
    for script in sorted(missing):
        # Strip common prefixes to generate command name
        cmd_name = script.replace(".py", "").replace(".sh", "").replace("-", ":")
        entries[cmd_name] = {
            "bin_script": script,
            "description": f"TODO: add description for {script}",
            "hidden": True,  # Hide auto-discovered commands until reviewed
        }

    return entries


def _section_bounds(lines: list[str], section: str) -> tuple[int, int] | None:
    """Line range of a top-level section's body, as [start, end).

    A section runs from the line after its key to the next top-level key, so an
    entry appended at `end` lands inside that section rather than the next one.
    """
    start = next((i + 1 for i, line in enumerate(lines) if line.rstrip() == f"{section}:"), None)
    if start is None:
        return None

    end = len(lines)
    for i in range(start, len(lines)):
        stripped = lines[i].strip()
        if stripped and not lines[i][0].isspace() and not stripped.startswith("#"):
            end = i
            break

    while end > start and not lines[end - 1].strip():
        end -= 1
    return start, end


def auto_update_manifest() -> set[str]:
    """Automatically add missing entries to the manifest's `tools` section.

    Returns set of newly added command names.
    """
    entries = generate_missing_entries()
    if not entries:
        return set()

    if not MANIFEST_FILE.exists():
        return set()

    with open(MANIFEST_FILE) as f:
        manifest = yaml.safe_load(f) or {}

    # A command name is taken if any section already declares it. Checking only
    # `tools` lets an entry that landed elsewhere be written a second time, which
    # yields a duplicate key rather than an error.
    taken = {
        name
        for section, commands in manifest.items()
        if section != "metadata" and isinstance(commands, dict)
        for name in commands
    }
    new_entries = {k: v for k, v in entries.items() if k not in taken}
    if not new_entries:
        return set()

    # Splice new entries as YAML text to preserve existing file formatting.
    # Round-tripping the entire file through yaml.dump() destroys indentation
    # style and line wrapping, causing the whole file to show as modified.
    lines = MANIFEST_FILE.read_text().splitlines()

    fragment = yaml.dump(new_entries, default_flow_style=False, sort_keys=False, indent=4)
    indented = ["    " + line if line.strip() else line for line in fragment.splitlines()]

    bounds = _section_bounds(lines, "tools")
    if bounds is None:
        while lines and not lines[-1].strip():
            lines.pop()
        lines += ["tools:", *indented]
    else:
        _, end = bounds
        lines[end:end] = indented

    MANIFEST_FILE.write_text("\n".join(lines) + "\n")
    return set(new_entries.keys())

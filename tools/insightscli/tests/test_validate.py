"""Tests for manifest validation utilities."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from unittest.mock import patch

import yaml
from insightscli.validate import auto_update_manifest, find_orphan_manifest_entries


def _make_manifest_stub(scripts_dir: Path, data: dict[str, Any]) -> Any:
    """Build a minimal stand-in for the Manifest singleton with the fields we use."""

    class _ManifestStub:
        def __init__(self) -> None:
            self.scripts_dir = scripts_dir
            self.data = data

    return _ManifestStub()


class TestFindOrphanManifestEntries:
    @pytest.mark.parametrize(
        "scripts_present,manifest_data,expected",
        [
            (
                ["real-script"],
                {
                    "tools": {
                        "good": {"bin_script": "real-script"},
                        "bad": {"bin_script": "missing-script"},
                    }
                },
                {"bad"},
            ),
            (
                ["a", "b"],
                {
                    "tools": {
                        "a": {"bin_script": "a"},
                        "b": {"bin_script": "b"},
                    }
                },
                set(),
            ),
            (
                [],
                {
                    "metadata": {"categories": []},
                    "tools": {"only-orphan": {"bin_script": "ghost"}},
                },
                {"only-orphan"},
            ),
            (
                ["real"],
                {
                    "tools": {
                        "noop": {"description": "no bin_script field"},
                        "good": {"bin_script": "real"},
                    }
                },
                set(),
            ),
        ],
        ids=["mixed", "all-present", "all-missing", "skip-entries-without-bin-script"],
    )
    def test_detects_orphans(
        self,
        tmp_path: Path,
        scripts_present: list[str],
        manifest_data: dict[str, Any],
        expected: set[str],
    ) -> None:
        for name in scripts_present:
            (tmp_path / name).write_text("#!/bin/sh\n")

        stub = _make_manifest_stub(tmp_path, manifest_data)
        with patch("insightscli.validate.get_manifest", return_value=stub):
            assert find_orphan_manifest_entries() == expected

    def test_returns_empty_when_scripts_dir_missing(self, tmp_path: Path) -> None:
        missing_dir = tmp_path / "does-not-exist"
        stub = _make_manifest_stub(
            missing_dir,
            {"tools": {"a": {"bin_script": "anything"}, "b": {"bin_script": "else"}}},
        )
        with patch("insightscli.validate.get_manifest", return_value=stub):
            assert find_orphan_manifest_entries() == set()


class TestAutoUpdateManifest:
    MANIFEST = "\n".join(
        [
            "tools:",
            "    existing:",
            "        bin_script: existing",
            "",
            "environment:",
            "    other:",
            "        bin_script: other",
            "",
        ]
    )

    def _run(self, tmp_path: Path, manifest_text: str, missing: set[str]) -> tuple[set[str], dict[str, Any]]:
        manifest_file = tmp_path / "insightscli.yaml"
        manifest_file.write_text(manifest_text)
        with (
            patch("insightscli.validate.MANIFEST_FILE", manifest_file),
            patch("insightscli.validate.find_missing_manifest_entries", return_value=missing),
        ):
            added = auto_update_manifest()
        return added, yaml.safe_load(manifest_file.read_text())

    def test_new_entry_lands_in_tools_not_the_last_section(self, tmp_path: Path) -> None:
        added, data = self._run(tmp_path, self.MANIFEST, {"prune-static"})

        assert added == {"prune:static"}
        assert "prune:static" in data["tools"]
        assert "prune:static" not in data["environment"]

    def test_second_run_adds_nothing(self, tmp_path: Path) -> None:
        manifest_file = tmp_path / "insightscli.yaml"
        manifest_file.write_text(self.MANIFEST)
        with (
            patch("insightscli.validate.MANIFEST_FILE", manifest_file),
            patch("insightscli.validate.find_missing_manifest_entries", return_value={"prune-static"}),
        ):
            assert auto_update_manifest() == {"prune:static"}
            assert auto_update_manifest() == set()

        # A duplicate key would make the second definition silently win.
        assert manifest_file.read_text().count("prune:static:") == 1

    def test_name_taken_by_another_section_is_not_added(self, tmp_path: Path) -> None:
        manifest = self.MANIFEST.replace("    other:", "    prune:static:")
        added, _ = self._run(tmp_path, manifest, {"prune-static"})

        assert added == set()

    def test_tools_section_is_created_when_absent(self, tmp_path: Path) -> None:
        added, data = self._run(tmp_path, "environment:\n    other:\n        bin_script: other\n", {"prune-static"})

        assert added == {"prune:static"}
        assert "prune:static" in data["tools"]

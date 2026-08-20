"""The static origin's delete path, and the claim its immutable lane rests on.

Every case here is a regression that would serve a 404 or a year-stale asset on
insights.hanzo.ai, so they are written against the two scripts' real entry points
rather than their internals.
"""

from __future__ import annotations

import hashlib
import importlib.util
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

BIN = Path(__file__).parent.parent


def load(name: str) -> Any:
    spec = importlib.util.spec_from_loader(
        name.replace("-", "_"), importlib.machinery.SourceFileLoader(name.replace("-", "_"), str(BIN / name))
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


publish = load("publish-static")
prune = load("prune-static")

NOW = datetime.now(UTC)
OLD = NOW - timedelta(days=10)


class FakeS3:
    # Enough of the S3 surface for the two scripts, with a seam for the race.

    def __init__(
        self,
        objects: dict[str, tuple[int, datetime]],
        manifests: dict[str, tuple[str, datetime]],
        deletes_fail: bool = False,
    ):
        self.objects = objects
        self.manifests = manifests
        self.deletes_fail = deletes_fail
        self.deleted: list[str] = []
        self.listings = 0
        self.on_object_listing: Callable[[], None] | None = None

    def get_paginator(self, _op: str):
        outer = self

        class Paginator:
            def paginate(self, Bucket: str, Prefix: str):  # noqa: N803 - boto3's casing
                if Prefix.endswith("-builds/"):
                    yield {
                        "Contents": [{"Key": k, "LastModified": ts} for k, (_, ts) in sorted(outer.manifests.items())]
                    }
                    return
                outer.listings += 1
                if outer.listings == 1 and outer.on_object_listing:
                    outer.on_object_listing()
                yield {"Contents": [{"Key": k, "LastModified": ts} for k, (_, ts) in sorted(outer.objects.items())]}

        return Paginator()

    def get_object(self, Bucket: str, Key: str):  # noqa: N803
        body, _ = self.manifests[Key]

        class Body:
            def read(self_inner) -> bytes:
                return body.encode()

        return {"Body": Body()}

    def delete_objects(self, Bucket: str, Delete: dict) -> dict:  # noqa: N803
        keys = [o["Key"] for o in Delete["Objects"]]
        if self.deletes_fail:
            return {"Errors": [{"Key": keys[0], "Message": "denied"}]}
        self.deleted.extend(keys)
        return {}


def run_prune(monkeypatch, fake: FakeS3, apply: bool = False) -> int:
    monkeypatch.setattr(prune.boto3, "client", lambda *a, **k: fake)
    monkeypatch.setenv("S3_ENDPOINT", "https://s3.invalid")
    monkeypatch.setenv("S3_BUCKET", "cdn")
    monkeypatch.setenv("S3_PREFIX", "insights")
    monkeypatch.setattr(prune.sys, "argv", ["prune-static"] + (["--apply"] if apply else []))
    return prune.main()


def obj(name: str, age: datetime = OLD) -> tuple[str, tuple[int, datetime]]:
    return f"insights/static/{name}", (1, age)


def test_a_publish_landing_mid_prune_is_not_deleted(monkeypatch, capsys):
    # A publish writes its objects first and its manifest last, so a build that
    # lands between the two listings looks present and unclaimed -- and would be
    # deleted moments before the pin moves to it.
    fake = FakeS3(
        objects=dict([obj("old-AAAAAAAA.js"), obj("shared-BBBBBBBB.js")]),
        manifests={"insights-builds/1.0.0-aaa.txt": ("old-AAAAAAAA.js\nshared-BBBBBBBB.js", OLD)},
    )

    def a_build_lands():
        fake.objects.update(dict([obj("brandnew-CCCCCCCC.js", NOW - timedelta(days=3))]))
        fake.manifests["insights-builds/1.0.1-bbb.txt"] = ("shared-BBBBBBBB.js\nbrandnew-CCCCCCCC.js", NOW)

    fake.on_object_listing = a_build_lands

    assert run_prune(monkeypatch, fake, apply=True) == 0
    assert "insights/static/brandnew-CCCCCCCC.js" not in fake.deleted
    assert "published while this ran" in capsys.readouterr().out


def test_young_objects_are_never_deleted(monkeypatch):
    # The backstop for any race the manifest re-read does not catch.
    fake = FakeS3(
        objects=dict([obj("unclaimed-DDDDDDDD.js", NOW - timedelta(minutes=5))]),
        manifests={"insights-builds/1.0.0-aaa.txt": ("something-else-EEEEEEEE.js", OLD)},
    )
    assert run_prune(monkeypatch, fake, apply=True) == 0
    assert fake.deleted == []


def test_a_wrong_clock_cannot_prune_below_the_floor(monkeypatch, capsys):
    # LastModified is the store's clock, now() is the runner's. A runner running
    # a horizon fast makes every manifest look expired at once.
    manifests = {
        f"insights-builds/1.0.{i}-x.txt": (f"chunk-{i:04d}AAAA.js", NOW - timedelta(days=400)) for i in range(20)
    }
    fake = FakeS3(objects={}, manifests=manifests)
    run_prune(monkeypatch, fake)
    assert f"{len(manifests)} builds on record, {prune.FLOOR} retained" in capsys.readouterr().out


def test_an_implausible_delete_is_refused(monkeypatch, capsys):
    # Deleting most of the tree is a wrong premise, not churn.
    fake = FakeS3(
        objects=dict(obj(f"orphan-{i:04d}AAAA.js") for i in range(100)),
        manifests={"insights-builds/1.0.0-aaa.txt": ("orphan-0000AAAA.js", OLD)},
    )
    assert run_prune(monkeypatch, fake, apply=True) == 1
    assert fake.deleted == []
    assert "something is wrong" in capsys.readouterr().err


def test_a_failed_delete_is_reported(monkeypatch, capsys):
    # Enough retained objects that the one orphan stays under the cap.
    kept = [f"kept-{i:04d}AAAA.js" for i in range(20)]
    fake = FakeS3(
        objects=dict([obj("gone-FFFFFFFF.js")] + [obj(k) for k in kept]),
        manifests={"insights-builds/1.0.0-aaa.txt": ("\n".join(kept), OLD)},
        deletes_fail=True,
    )
    assert run_prune(monkeypatch, fake, apply=True) == 1
    assert "delete failed" in capsys.readouterr().err


def test_a_hashed_name_that_changed_its_bytes_fails_the_build(tmp_path, monkeypatch):
    # The router sends anything shaped like a content hash to a one-year
    # immutable header. An ordinary file that happens to have the shape --
    # `logo-DARKMODE.svg` -- would be skipped forever or overwritten under
    # clients holding it for a year. Neither may happen silently.
    root = tmp_path / "staticfiles"
    root.mkdir()
    (root / "logo-DARKMODE.svg").write_bytes(b"the new bytes")

    class Mismatch:
        def head_object(self, Bucket, Key):  # noqa: N803
            return {"ETag": '"' + hashlib.md5(b"the old bytes").hexdigest() + '"', "ContentLength": 13}

        def put_object(self, **kw):
            raise AssertionError("must not overwrite a name that promised different bytes")

    monkeypatch.setattr(publish.boto3, "client", lambda *a, **k: Mismatch())
    monkeypatch.setenv("S3_ENDPOINT", "https://s3.invalid")
    monkeypatch.setenv("VERSION", "1.0.0")
    monkeypatch.setattr(publish.sys, "argv", ["publish-static", str(root)])

    with pytest.raises(SystemExit) as exc:
        publish.main()
    assert "does not keep that promise" in str(exc.value)


def test_identical_bytes_under_a_hashed_name_are_skipped(tmp_path, monkeypatch):
    root = tmp_path / "staticfiles"
    root.mkdir()
    (root / "chunk-ABCD1234.js").write_bytes(b"same bytes")
    (root / "array.js").write_bytes(b"the sdk loader")

    puts: list[str] = []

    class Store:
        def head_object(self, Bucket, Key):  # noqa: N803
            return {"ETag": '"' + hashlib.md5(b"same bytes").hexdigest() + '"', "ContentLength": 10}

        def put_object(self, **kw):
            puts.append(kw["Key"])
            return {}

    monkeypatch.setattr(publish.boto3, "client", lambda *a, **k: Store())
    monkeypatch.setenv("S3_ENDPOINT", "https://s3.invalid")
    monkeypatch.setenv("VERSION", "1.0.0")
    monkeypatch.setattr(publish.sys, "argv", ["publish-static", str(root)])

    assert publish.main() == 0
    # The hashed chunk is already published; the mutable SDK loader always is.
    assert "insights/static/chunk-ABCD1234.js" not in puts
    assert "insights/static/array.js" in puts

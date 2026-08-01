"""What routing is allowed to decide, and what it must never decide silently.

`changes` is the whole of the command's judgement: everything else reads the
app, writes the warehouse, or prints. These pin it directly, because both
failures it prevents are silent — one sends an org's events into a project that
is not theirs, the other keeps sending them there after the app has said
otherwise.
"""

from insights.management.commands.route_orgs import changes
from insights.models.event.plane import UNATTRIBUTED_PROJECT


def test_an_unrouted_org_is_routed():
    assert changes({}, {"maxpower": 7}) == {"maxpower": 7}


def test_an_org_already_routed_correctly_is_left_alone():
    """The table keeps the newest row per org, so rewriting an unchanged
    mapping is not harmless bookkeeping: it moves the version forward and makes
    every run look like a change.
    """
    assert changes({"hanzo": 1}, {"hanzo": 1}) == {}


def test_a_corrected_mapping_is_rewritten():
    assert changes({"maxpower": 1}, {"maxpower": 7}) == {"maxpower": 7}


def test_an_org_the_app_no_longer_resolves_is_unattributed_not_dropped():
    """This is the bug that started it. `admin` and `maxpower` were routed to
    project 1 — Hanzo's own — and no longer having a project of their own is
    exactly the case where leaving the stale row alone keeps a funded org's
    events landing in someone else's project. There is no delete: the newest
    row wins, so "no longer routed" has to be written.
    """
    assert changes({"admin": 1}, {}) == {"admin": UNATTRIBUTED_PROJECT}


def test_an_org_already_unattributed_is_not_rewritten_forever():
    """Without this the previous rule would republish the same 0 on every run."""
    assert changes({"admin": UNATTRIBUTED_PROJECT}, {}) == {}


def test_the_anonymous_org_is_never_routed_by_this_command():
    """`$public` is not an org anyone owns, so it resolves to no project and
    stays unattributed by falling through — not by being named anywhere.
    """
    assert "$public" not in changes({}, {"hanzo": 1})


def test_orgs_are_decided_independently():
    live = {"hanzo": 1, "admin": 1, "maxpower": 1}
    intended = {"hanzo": 1, "maxpower": 7}
    assert changes(live, intended) == {"admin": UNATTRIBUTED_PROJECT, "maxpower": 7}

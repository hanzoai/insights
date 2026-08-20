"""Make the sidebar show the products it is supposed to.

Two faults, both invisible because a sidebar with SOME products in it looks fine.

CASE. A product_path is matched against `products.json` exactly, so `Error
Tracking` and `Session Replay` name nothing and render nothing — while `Error
tracking` and `Session replay` sit in the same list and do. The user sees one
entry and carries two rows, and the dead one is indistinguishable from a product
they turned off. Rows are re-cased to the canonical spelling where one exists,
case-insensitively; a row matching no product at all is LEFT ALONE, because it
is inert and deleting somebody's sidebar preference is not this migration's call.

DEFAULTS REACHED NOBODY. `add_default_products_for_user` runs from exactly one
place — the AccessControl post-save signal, i.e. when a user GAINS access. So
adding a product to DEFAULT_PRODUCT_PATHS only ever reached accounts created
afterwards; every existing user kept the list they were seeded with. That is how
Feature flags shipped in the defaults and appeared for no one.

The backfill adds only paths a user has NO row for. A row that exists and is
disabled is a decision, and this does not re-enable it.
"""

from django.db import migrations


def _canonical_paths():
    from insights.products import Products

    return [p.path for p in Products.products()]


def fix_sidebar(apps, schema_editor):
    UserProductList = apps.get_model("insights", "UserProductList")

    canonical = _canonical_paths()
    by_lower = {p.lower(): p for p in canonical}

    # Re-case, skipping rows that already hold the canonical spelling. A row whose
    # correct spelling ALREADY exists for that (team, user) would collide with the
    # unique_together, so it is dropped instead — it is the duplicate half of the
    # pair, and the surviving row is the one the sidebar was already rendering.
    for row in UserProductList.objects.exclude(product_path__in=canonical).iterator():
        want = by_lower.get(row.product_path.lower())
        if not want:
            continue
        clash = (
            UserProductList.objects.filter(team_id=row.team_id, user_id=row.user_id, product_path=want)
            .exclude(pk=row.pk)
            .exists()
        )
        if clash:
            row.delete()
        else:
            row.product_path = want
            row.save(update_fields=["product_path"])

    # Backfill the defaults for every (user, team) that already has a sidebar.
    from insights.models.file_system.user_product_list import DEFAULT_PRODUCT_PATHS

    pairs = UserProductList.objects.values_list("team_id", "user_id").distinct()
    missing = []
    for team_id, user_id in pairs:
        have = set(
            UserProductList.objects.filter(team_id=team_id, user_id=user_id).values_list("product_path", flat=True)
        )
        for path in DEFAULT_PRODUCT_PATHS:
            if path not in have:
                missing.append(
                    UserProductList(team_id=team_id, user_id=user_id, product_path=path, enabled=True, reason="default")
                )
    if missing:
        UserProductList.objects.bulk_create(missing, ignore_conflicts=True)


def noop(apps, schema_editor):
    """Not reversible: the pre-migration casing and the absence of a default row
    are indistinguishable from a user's own choices once this has run."""


class Migration(migrations.Migration):
    dependencies = [("insights", "0010_absent_columns")]

    operations = [migrations.RunPython(fix_sidebar, noop)]

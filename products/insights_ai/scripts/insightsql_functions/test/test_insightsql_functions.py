from __future__ import annotations

from products.insights_ai.scripts.insightsql_functions import insightsql_functions


def test_returns_sorted_list() -> None:
    result = insightsql_functions()
    assert isinstance(result, list)
    assert len(result) > 100
    assert result == sorted(result, key=str.lower)


def test_excludes_underscore_prefixed() -> None:
    result = insightsql_functions()
    assert all(not name.startswith("_") for name in result)


def test_excludes_udfs() -> None:
    from insights.insightsql.functions.udfs import UDFS

    result = set(insightsql_functions())
    for udf_name in UDFS:
        assert udf_name not in result


def test_excludes_if_combinators() -> None:
    result = set(insightsql_functions())
    assert "countIf" not in result
    assert "sumIf" not in result
    assert "avgIf" not in result


def test_keeps_standalone_if_functions() -> None:
    result = set(insightsql_functions())
    assert "if" in result
    assert "multiIf" in result


def test_includes_common_functions() -> None:
    result = set(insightsql_functions())
    assert "count" in result
    assert "sum" in result
    assert "concat" in result
    assert "toDateTime" in result

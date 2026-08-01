import pandas as _pd
import requests as _requests

_BRIDGE_URL = "http://127.0.0.1:8181/_bridge/query"


def query(insightsql: str) -> _pd.DataFrame:
    """Run a InsightsQL query against Insights from inside a Streamlit sandbox."""
    resp = _requests.post(_BRIDGE_URL, json={"query": insightsql}, timeout=60)
    if resp.status_code != 200:
        try:
            err = resp.json().get("error", resp.text)
        except Exception:
            err = resp.text
        raise RuntimeError("InsightsQL query failed: " + str(err))
    data = resp.json()
    columns = data.get("columns", [])
    results = data.get("results", [])
    return _pd.DataFrame(results, columns=columns)

import sys
import subprocess


def test_schema_enums_imports_without_loading_schema():
    # insights.schema_enums exists so enum-only consumers can avoid the ~2s pydantic
    # model build in insights.schema; a reference back to schema would defeat that.
    code = "import sys, insights.schema_enums; assert 'insights.schema' not in sys.modules"
    result = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True)
    assert result.returncode == 0, f"schema_enums import pulled in insights.schema:\n{result.stderr}"

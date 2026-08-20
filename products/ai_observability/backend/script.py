from typing import Any, Literal

from insights.cdp.validation import compile_script

AIObservabilityScriptType = Literal["destination", "tagger"]


def compile_ai_observability_script(source: str, script_type: AIObservabilityScriptType) -> list[Any]:
    return compile_script(source, script_type, null_safe_comparisons=True)

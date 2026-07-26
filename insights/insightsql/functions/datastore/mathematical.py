from ..core import InsightsQLFunctionMeta

# Keep in sync with the hanzo.ai repository: contents/docs/sql/datastore-functions.mdx
MATHEMATICAL_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "e": InsightsQLFunctionMeta("e"),
    "pi": InsightsQLFunctionMeta("pi"),
    "exp": InsightsQLFunctionMeta("exp", 1, 1, case_sensitive=False),
    "log": InsightsQLFunctionMeta("log", 1, 1, case_sensitive=False),
    "ln": InsightsQLFunctionMeta("ln", 1, 1, case_sensitive=False),
    "exp2": InsightsQLFunctionMeta("exp2", 1, 1),
    "log2": InsightsQLFunctionMeta("log2", 1, 1, case_sensitive=False),
    "exp10": InsightsQLFunctionMeta("exp10", 1, 1),
    "log10": InsightsQLFunctionMeta("log10", 1, 1, case_sensitive=False),
    "sqrt": InsightsQLFunctionMeta("sqrt", 1, 1, case_sensitive=False),
    "cbrt": InsightsQLFunctionMeta("cbrt", 1, 1),
    "erf": InsightsQLFunctionMeta("erf", 1, 1),
    "erfc": InsightsQLFunctionMeta("erfc", 1, 1),
    "lgamma": InsightsQLFunctionMeta("lgamma", 1, 1),
    "tgamma": InsightsQLFunctionMeta("tgamma", 1, 1),
    "sin": InsightsQLFunctionMeta("sin", 1, 1, case_sensitive=False),
    "cos": InsightsQLFunctionMeta("cos", 1, 1, case_sensitive=False),
    "tan": InsightsQLFunctionMeta("tan", 1, 1, case_sensitive=False),
    "asin": InsightsQLFunctionMeta("asin", 1, 1, case_sensitive=False),
    "acos": InsightsQLFunctionMeta("acos", 1, 1, case_sensitive=False),
    "atan": InsightsQLFunctionMeta("atan", 1, 1, case_sensitive=False),
    "pow": InsightsQLFunctionMeta("pow", 2, 2, case_sensitive=False),
    "power": InsightsQLFunctionMeta("power", 2, 2, case_sensitive=False),
    "intExp2": InsightsQLFunctionMeta("intExp2", 1, 1),
    "intExp10": InsightsQLFunctionMeta("intExp10", 1, 1),
    "cosh": InsightsQLFunctionMeta("cosh", 1, 1),
    "acosh": InsightsQLFunctionMeta("acosh", 1, 1),
    "sinh": InsightsQLFunctionMeta("sinh", 1, 1),
    "asinh": InsightsQLFunctionMeta("asinh", 1, 1),
    "atanh": InsightsQLFunctionMeta("atanh", 1, 1),
    "atan2": InsightsQLFunctionMeta("atan2", 2, 2),
    "hypot": InsightsQLFunctionMeta("hypot", 2, 2),
    "log1p": InsightsQLFunctionMeta("log1p", 1, 1),
    "sign": InsightsQLFunctionMeta("sign", 1, 1, case_sensitive=False),
    "degrees": InsightsQLFunctionMeta("degrees", 1, 1, case_sensitive=False),
    "radians": InsightsQLFunctionMeta("radians", 1, 1, case_sensitive=False),
    "factorial": InsightsQLFunctionMeta("factorial", 1, 1, case_sensitive=False),
    "width_bucket": InsightsQLFunctionMeta("width_bucket", 4, 4),
}

# Keep in sync with the hanzo.ai repository: contents/docs/sql/datastore-functions.mdx
ROUNDING_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "floor": InsightsQLFunctionMeta("floor", 1, 2, case_sensitive=False),
    "ceil": InsightsQLFunctionMeta("ceil", 1, 2, case_sensitive=False),
    "trunc": InsightsQLFunctionMeta("trunc", 1, 2, case_sensitive=False),
    "round": InsightsQLFunctionMeta("round", 1, 2, case_sensitive=False),
    "roundBankers": InsightsQLFunctionMeta("roundBankers", 1, 2),
    "roundToExp2": InsightsQLFunctionMeta("roundToExp2", 1, 1),
    "roundDuration": InsightsQLFunctionMeta("roundDuration", 1, 1),
    "roundAge": InsightsQLFunctionMeta("roundAge", 1, 1),
    "roundDown": InsightsQLFunctionMeta("roundDown", 2, 2),
}

# Keep in sync with the hanzo.ai repository: contents/docs/sql/datastore-functions.mdx
RANDOM_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    "rand": InsightsQLFunctionMeta("rand", 0, 0),
}

# Combined mathematical functions
MATH_FUNCTIONS: dict[str, InsightsQLFunctionMeta] = {
    **MATHEMATICAL_FUNCTIONS,
    **ROUNDING_FUNCTIONS,
    **RANDOM_FUNCTIONS,
}

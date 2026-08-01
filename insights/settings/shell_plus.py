from insights.settings.utils import get_from_env, str_to_bool

# shell_plus settings
# https://django-extensions.readthedocs.io/en/latest/shell_plus.html

SHELL_PLUS_PRINT_SQL = get_from_env("PRINT_SQL", False, type_cast=str_to_bool)
SHELL_PLUS_POST_IMPORTS = [
    (
        "datetime",
        (
            "datetime",
            "timedelta",
        ),
    ),
    ("django.utils.timezone", ("now",)),
    ("infi.datastore_orm.utils", ("import_submodules",)),
    ("insights.models.filters", ("Filter",)),
    ("insights.models.property", ("Property",)),
    ("insights.datastore.client", ("sync_execute",)),
    ("insights.insightsql", ("ast")),
    ("insights.insightsql.parser", ("parse_select", "parse_expr")),
    ("insights.insightsql.query", ("execute_insightsql_query")),
]

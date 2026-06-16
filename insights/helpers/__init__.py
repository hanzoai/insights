def __getattr__(name):
    if name == "create_dashboard_from_template":
        from .dashboard_templates import create_dashboard_from_template
        return create_dashboard_from_template
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["create_dashboard_from_template"]

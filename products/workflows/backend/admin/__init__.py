# Importing these submodules fires their `@admin.register` decorators when
# `autodiscover_modules("admin")` imports this package.
from products.workflows.backend.admin import (  # noqa: F401
    insights_flow_admin,
    insights_flow_batch_job_admin,
    insights_flow_template_admin,
)

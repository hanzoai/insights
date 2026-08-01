# isort: skip_file
from insights.settings import EE_AVAILABLE

if EE_AVAILABLE:
    from ee.datastore.queries.column_optimizer import (
        EnterpriseColumnOptimizer as ColumnOptimizer,
    )
else:
    from insights.queries.column_optimizer.foss_column_optimizer import (  # type: ignore
        FOSSColumnOptimizer as ColumnOptimizer,  # noqa: F401
    )

# The enterprise edition swapped in a column optimizer that could route reads at materialized
# columns. Without it there is one optimizer, and it plans against the JSON property blob.
from insights.queries.column_optimizer.foss_column_optimizer import FOSSColumnOptimizer as ColumnOptimizer  # noqa: F401

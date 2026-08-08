"""The serializer for the experiment/saved-metric join.

Its own module because both layers need it: the presentation serializers embed it
to render an experiment, and the service writes join rows through it. It depends on
the model alone, so neither import closes a cycle — importing it from
`presentation.serializers` did, since that module reads the service.
"""

from rest_framework import serializers

from products.experiments.backend.models.experiment import ExperimentToSavedMetric


class ExperimentToSavedMetricSerializer(serializers.ModelSerializer):
    """The join between an experiment and a shared saved metric.

    `metadata` records what the experiment knew about the metric when it was attached (whether it
    is primary, for instance), which is why the join is serialized rather than the metric alone.
    `saved_metric` is written by id and read back alongside the metric's name and query, so a
    caller rendering an experiment does not have to fetch each metric separately.
    """

    query = serializers.JSONField(source="saved_metric.query", read_only=True)
    name = serializers.CharField(source="saved_metric.name", read_only=True)

    class Meta:
        model = ExperimentToSavedMetric
        fields = ["id", "experiment", "saved_metric", "metadata", "name", "query", "created_at"]
        read_only_fields = ["id", "name", "query", "created_at"]

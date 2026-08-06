from django.db import models
from django.utils import timezone

from insights.models.utils import CreatedMetaFields, UpdatedMetaFields, UUIDTModel


class DataModelingJobStatus(models.TextChoices):
    CANCELLED = "Cancelled", "Cancelled"
    COMPLETED = "Completed", "Completed"
    FAILED = "Failed", "Failed"
    RUNNING = "Running", "Running"


class DataModelingJobEngine(models.TextChoices):
    DATASTORE = "datastore", "Datastore"
    DUCKGRES = "duckgres", "Duckgres"


class DataModelingJob(CreatedMetaFields, UpdatedMetaFields, UUIDTModel):
    Status = DataModelingJobStatus
    Engine = DataModelingJobEngine

    team = models.ForeignKey("insights.Team", on_delete=models.SET_NULL, null=True)
    saved_query = models.ForeignKey("data_modeling.DataWarehouseSavedQuery", on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=400, choices=Status, default=Status.RUNNING)
    engine = models.CharField(max_length=20, choices=Engine, default=Engine.DATASTORE)
    rows_materialized = models.IntegerField(default=0)
    error = models.TextField(null=True, blank=True)
    workflow_id = models.CharField(max_length=400, null=True, blank=True)
    workflow_run_id = models.CharField(max_length=400, null=True, blank=True)
    parent_workflow_id = models.CharField(max_length=400, null=True, blank=True)
    last_run_at = models.DateTimeField(default=timezone.now)
    rows_expected = models.IntegerField(null=True, blank=True, help_text="Total rows expected to be materialized")
    storage_delta_mib = models.FloatField(null=True, blank=True, default=0)

    class Meta:
        db_table = "insights_datamodelingjob"
        indexes = [
            # serves to cut lookup times for pre-existing running jobs during the preempt stage
            models.Index(fields=["team", "status"], name="datamodelingjob_team_status"),
        ]

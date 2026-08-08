"""Evaluation-level clustering for AI observability.

Two-stage pipeline:
  Stage A (hourly): sample $ai_evaluation events per ClusteringJob, compose a short
  text representation, and enqueue embeddings via the shared document_embeddings Kafka topic.

  Stage B (daily): per ClusteringJob, fetch accumulated embeddings, cluster (HDBSCAN),
  label, compute operational + evaluation-specific aggregates, and emit $ai_evaluation_clusters events.

Import the workflows and activities from the module that defines them. This package
re-exports nothing on purpose: a re-export runs every submodule on any import of any
of them, including `constants`, which the trace-clustering metrics read for their
workflow-name labels. Stage A reaches enterprise code this fork does not carry, so
with re-exports that one submodule decides whether `insights.urls` imports at all,
and the failure surfaces as a request-path ImportError far from its cause.
"""

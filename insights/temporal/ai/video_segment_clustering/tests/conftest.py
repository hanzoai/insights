"""pytest configuration for video segment clustering tests."""

import gzip
from pathlib import Path

import pytest

import yaml
import numpy as np

# Import fixtures from temporal tests conftest
from insights.temporal.tests.conftest import aorganization, ateam

__all__ = [
    "aorganization",
    "ateam",
    "mock_embeddings",
]

EMBEDDING_DIM = 3072


@pytest.fixture
def mock_embeddings() -> np.ndarray:
    """Generate deterministic random embeddings matching the segment count in the YAML fixture.

    Uses a fixed seed so clustering results are reproducible across runs.
    The .npy file was removed to eliminate Git LFS dependency.
    """
    yaml_path = Path(__file__).parent / "mock_video_segments.yaml.gz"
    with gzip.open(yaml_path, "rt") as f:
        data = yaml.safe_load(f)

    num_segments = len(data["segments"])

    rng = np.random.default_rng(seed=42)
    embeddings = rng.standard_normal((num_segments, EMBEDDING_DIM)).astype(np.float32)

    # L2-normalize each row so cosine similarity behaves like the real embeddings
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / norms

    return embeddings

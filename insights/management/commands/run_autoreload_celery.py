from pathlib import Path
from typing import Literal

import django
from django.core.management.base import BaseCommand

from insights.tasks.utils import CeleryQueue

# ❗ needs to be called *before* importing autoreload
django.setup()

from django.utils import autoreload  # noqa: E402


class Command(BaseCommand):
    help = "Run Celery wrapped in Django's auto-reload feature"

    def add_arguments(self, parser):
        parser.add_argument("--type", type=str, choices=("worker", "beat"), help="Process type")

    def handle(self, *args, **options):
        def run_optimized_celery():
            # Optimize file watching - only watch core Insights directories instead of all 66k+ files
            # This must be called inside the reloader process
            self._setup_limited_file_watching()
            self.run_celery_worker(options["type"])

        autoreload.run_with_reloader(run_optimized_celery)

    def _setup_limited_file_watching(self):
        """Limit file watching to core Insights directories instead of all 66k+ files"""
        # Get the project root directory
        project_root = Path(__file__).parent.parent.parent.parent

        # Define directories we actually care about for Celery reloading
        watch_dirs = [
            project_root / "insights",
            project_root / "products",
        ]

        # Only watch files that exist and are directories
        watch_dirs = [d for d in watch_dirs if d.exists() and d.is_dir()]

        def limited_iter_python_files():
            """Iterator that only yields Python files from our watched directories"""
            for watch_dir in watch_dirs:
                for py_file in watch_dir.rglob("*.py"):
                    if py_file.is_file():
                        yield py_file.resolve()

        # Monkey patch Django's file discovery to only watch our specific directories
        autoreload.iter_all_python_module_files = limited_iter_python_files

        self.stdout.write(
            self.style.SUCCESS(f"📁 Optimized: Watching {len(watch_dirs)} directories instead of all Python modules")
        )

    @staticmethod
    def run_celery_worker(type: Literal["worker", "beat"]):
        from insights.celery import app as celery_app

        if type == "beat":
            args = [
                "beat",
                "--scheduler",
                "redbeat.RedBeatScheduler",
            ]
            celery_app.start(argv=args)
            return

        args = [
            "-A",
            "insights",
            "worker",
            "--pool=threads",
            f"--queues={','.join(q.value for q in CeleryQueue)}",
        ]
        celery_app.worker_main(args)

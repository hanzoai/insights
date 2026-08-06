"""Insights development quickstart command."""

from __future__ import annotations

import click


@click.command(name="quickstart", help="Show getting started with Insights development")
def quickstart() -> None:
    """Display essential commands for getting up and running."""
    click.echo("")
    click.echo(click.style("🚀 Insights Development Quickstart", fg="green", bold=True))
    click.echo("")
    click.echo("Get Insights running locally:")
    click.echo("")
    click.echo("  insightscli start")
    click.echo("")
    click.echo("  That's it! Starts Docker, runs migrations, launches all services.")
    click.echo("  Opens http://localhost:8010 when ready.")
    click.echo("")
    click.echo("Optional:")
    click.echo("  insightscli dev:setup               configure which services to run")
    click.echo("  insightscli dev:demo-data           generate test data")
    click.echo("  insightscli dev:reset               full reset & reload")
    click.echo("")
    click.echo("Common commands:")
    click.echo("  insightscli format                  format all code")
    click.echo("  insightscli lint                    run quality checks")
    click.echo("  insightscli test:python <path>      run Python tests")
    click.echo("  insightscli test:js <path>          run JS tests")
    click.echo("")
    click.echo("For full command list:")
    click.echo("  insightscli --help")
    click.echo("")

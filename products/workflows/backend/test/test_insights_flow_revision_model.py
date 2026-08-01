from insights.test.base import BaseTest

from insights.models.organization import Organization
from insights.models.scoping import team_scope
from insights.models.team.team import Team

from products.workflows.backend.models import InsightsFlow, InsightsFlowRevision


class TestInsightsFlowRevisionModel(BaseTest):
    def test_save_derives_team_from_workflow(self):
        # A revision written with a mismatched team must not leak into that team's history — the
        # fail-closed manager filters on the revision's own team_id, so save() pins it to the flow's.
        other_org = Organization.objects.create(name="other")
        other_team = Team.objects.create(organization=other_org, name="other team")
        flow = InsightsFlow.objects.create(team=self.team, name="Flow")

        with team_scope(other_team.id):
            revision = InsightsFlowRevision.objects.create(team=other_team, hog_flow=flow, version=1, content={})

        assert revision.team_id == self.team.id
        with team_scope(self.team.id):
            assert InsightsFlowRevision.objects.filter(hog_flow=flow).count() == 1
        with team_scope(other_team.id):
            assert InsightsFlowRevision.objects.count() == 0

from rest_framework import status

from insights.api.project import ProjectViewSet
from insights.api.team import TeamViewSet
from insights.api.wizard.http import SetupWizardViewSet
from insights.rbac.access_control_api_mixin import AccessControlViewSetMixin
from insights.test.base import APIBaseTest


class TestAccessControlViewSetMixin(APIBaseTest):
    """`dangerously_get_required_scopes` is a contract, not an optional extra.

    `APIScopePermission._get_required_scopes` calls it on any view that defines
    it, and `TeamViewSet`/`ProjectViewSet` delegate upward with `super()`. When
    the mixin did not supply it, every settings save 500ed with
    `AttributeError: 'super' object has no attribute
    'dangerously_get_required_scopes'`.
    """

    def test_mixin_supplies_the_hook_subclasses_delegate_to(self):
        assert hasattr(AccessControlViewSetMixin, "dangerously_get_required_scopes")
        assert AccessControlViewSetMixin().dangerously_get_required_scopes(None, None) is None

    def test_every_definition_shares_one_signature(self):
        """A view whose override takes a different arity raises TypeError at the
        single call site in `permissions.py`."""
        import inspect

        expected = ["self", "request", "view"]
        for cls in (AccessControlViewSetMixin, TeamViewSet, ProjectViewSet, SetupWizardViewSet):
            params = list(inspect.signature(cls.dangerously_get_required_scopes).parameters)
            assert params == expected, f"{cls.__name__} takes {params}, expected {expected}"

    def test_patch_environment_saves_instead_of_500(self):
        response = self.client.patch(
            f"/api/environments/{self.team.id}/",
            {"autocapture_opt_out": True},
        )
        assert response.status_code == status.HTTP_200_OK, response.json()
        self.team.refresh_from_db()
        assert self.team.autocapture_opt_out is True

    def test_patch_project_saves_instead_of_500(self):
        response = self.client.patch(
            f"/api/projects/{self.team.project_id}/",
            {"name": "Renamed by test"},
        )
        assert response.status_code == status.HTTP_200_OK, response.json()

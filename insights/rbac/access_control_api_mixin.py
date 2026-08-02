from typing import Optional


class AccessControlViewSetMixin:
    """Object-level access control hooks for viewsets.

    The scope-derivation hook is part of the contract: `APIScopePermission`
    calls `view.dangerously_get_required_scopes(request, view)` whenever the
    view defines it, and subclasses (`TeamViewSet`, `ProjectViewSet`) delegate
    upward with `super()`. Returning `None` means "this mixin imposes no scope
    requirement" — callers then fall through to their own derivation.
    """

    def dangerously_get_required_scopes(self, request, view) -> Optional[list[str]]:
        return None

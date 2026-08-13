"""The shape of every error this API returns.

    {"type": ..., "code": ..., "detail": ..., "attr": ...}

`type` is the family the failure belongs to, `code` is the machine-readable
reason, `detail` is the sentence a person reads, and `attr` names the offending
field when there is one. Clients switch on `code`, so these values are a
contract: changing one is an API change.

This was a third-party package until it wasn't. The dependency's module name was
one we do not use, the rename that removed the name broke the import, and the
break was inside the ERROR HANDLER — so every 4xx came back as an opaque 500
with a traceback, and the 401 branch that advertises OAuth metadata never ran.
The envelope is ours and it is a page of code; a page of code is not worth a
dependency whose module name we are not free to spell.

Faithful to the behaviour it replaces, including two details that read like bugs
and are not: `invalid` is reported as `invalid_input`, because the bare word
tells a client nothing; and `__all__` / DRF's NON_FIELD_ERRORS_KEY report
`attr: null` rather than inventing a field name for an error that belongs to the
whole object.

Only the first failure of a multi-error validation is reported. The package
supported a `multiple` envelope behind a setting we never enabled, so this
changes nothing for any existing client.

NOTHING HERE MAY RUN AT IMPORT TIME. `insights.exceptions` is imported during
bootstrap, before the app registry is ready, so a module-level `gettext` or a
touch of DRF's `api_settings` resolves settings too early and takes the whole
process down with `AUTH_USER_MODEL ... has not been installed`. Translations are
lazy and DRF settings are read inside the functions that need them.
"""

from enum import Enum
from typing import Any, ClassVar, Optional, Union, cast

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.core.signals import got_request_exception
from django.db.models import ProtectedError
from django.http import Http404
from django.utils.encoding import force_str
from django.utils.translation import gettext_lazy as _

from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import set_rollback

DEFAULT_ERROR_DETAIL = _("A server error occurred.")

# Joins the keys of a nested validation error into one attribute name, so a
# failure at form.password reports `form__password`, not just `password`.
NESTED_KEY_SEPARATOR = "__"


class ErrorType(str, Enum):
    AUTHENTICATION = "authentication_error"
    INVALID_REQUEST = "invalid_request"
    SERVER = "server_error"
    THROTTLED = "throttled_error"
    VALIDATION = "validation_error"


def _type_table() -> tuple[tuple[type, ErrorType], ...]:
    return (
        (exceptions.AuthenticationFailed, ErrorType.AUTHENTICATION),
        (exceptions.NotAuthenticated, ErrorType.AUTHENTICATION),
        (exceptions.PermissionDenied, ErrorType.AUTHENTICATION),
        (exceptions.MethodNotAllowed, ErrorType.INVALID_REQUEST),
        (exceptions.NotAcceptable, ErrorType.INVALID_REQUEST),
        (exceptions.NotFound, ErrorType.INVALID_REQUEST),
        (exceptions.ParseError, ErrorType.INVALID_REQUEST),
        (exceptions.UnsupportedMediaType, ErrorType.INVALID_REQUEST),
        (exceptions.Throttled, ErrorType.THROTTLED),
        (exceptions.ValidationError, ErrorType.VALIDATION),
    )


class ProtectedObjectException(ProtectedError):
    """A delete refused because something still points at the object."""

    default_type: ClassVar[str] = ErrorType.INVALID_REQUEST.value
    default_code: ClassVar[str] = "protected_error"
    status_code: ClassVar[int] = status.HTTP_409_CONFLICT
    default_detail: ClassVar[Any] = _(
        "Requested operation cannot be completed because a related object is protected."
    )

    def __init__(self, msg, protected_objects):
        self.detail = force_str(msg or self.default_detail)
        super().__init__(msg, protected_objects)

    def get_codes(self) -> str:
        return self.default_code


def _error_type(exc: BaseException) -> str:
    for attr in ("exception_type", "default_type"):
        declared = getattr(exc, attr, None)
        if declared:
            return force_str(declared.value if isinstance(declared, Enum) else declared)
    for klass, error_type in _type_table():
        if isinstance(exc, klass):
            return error_type.value
    return ErrorType.SERVER.value


def _flatten(codes: dict, parents: Optional[list[str]] = None) -> list[dict]:
    """One entry per failure, keeping the path to it."""
    parents = parents or []
    flat: list[dict] = []
    for key, code in codes.items():
        path = [*parents, key]
        if isinstance(code, dict):
            flat.extend(_flatten(code.copy(), path))
        else:
            flat.append({"path": path, "code": code})
    return flat


def _code_and_key(codes: Union[dict, str, list, None]) -> tuple[str, Any]:
    def named(code: str) -> str:
        # `invalid` on its own tells a client nothing about what to fix.
        return "invalid_input" if code == "invalid" else code

    if not codes:
        return "error", None
    if isinstance(codes, dict) and "path" in codes:
        code = codes["code"]
        return named(str(code[0] if isinstance(code, list) else code)), codes["path"]
    if isinstance(codes, str):
        return codes, None
    if isinstance(codes, dict):
        key = next(iter(codes))
        value = codes[key]
        return named(value if isinstance(value, str) else value[0]), key
    if isinstance(codes, list):
        return named(str(codes[0])), None
    return "error", None


def _detail(exc: BaseException, key: Union[str, list[str]] = "") -> str:
    """The sentence a person reads.

    Read only off `detail`, which an exception sets deliberately. A bare Python
    exception's message can carry anything the process knows, including values
    from the request, so it never reaches the client.
    """
    detail = getattr(exc, "detail", None)
    if isinstance(detail, str):
        return force_str(detail)
    if isinstance(detail, dict):
        value: Any = detail
        if isinstance(key, list):
            for part in key:
                value = value[part]
        return force_str(value if isinstance(value, str) else value[0])
    if isinstance(detail, list) and detail:
        return force_str(detail[0])
    return force_str(DEFAULT_ERROR_DETAIL)


def _attr(key: Optional[Union[str, list[str]]] = None) -> Optional[str]:
    """The offending field, or None when the error belongs to the whole object."""
    from rest_framework.settings import api_settings as drf_api_settings

    name = NESTED_KEY_SEPARATOR.join(map(str, key)) if isinstance(key, list) else key
    if not name or name in ("__all__", drf_api_settings.NON_FIELD_ERRORS_KEY):
        return None
    return name


def exception_handler(exc: BaseException, context: Optional[dict] = None) -> Optional[Response]:
    """Render `exc` as the envelope above, or return None to let Django render it."""
    request = (context or {}).get("request")

    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()
    elif isinstance(exc, ProtectedError):
        exc = ProtectedObjectException("", protected_objects=exc.protected_objects)

    if getattr(settings, "DEBUG", False) and not isinstance(exc, exceptions.APIException):
        # In DEBUG a non-DRF error stays Django's to render, so a developer gets the
        # traceback page. This signal is what hands that traceback to the test client;
        # without it, tests lose the very thing they assert on.
        got_request_exception.send(sender=None, request=request)
        return None

    if isinstance(exc, exceptions.ValidationError):
        codes = exc.get_codes()
        failures: list[Any] = [codes] if isinstance(codes, list) else _flatten(cast(dict, codes))
    elif hasattr(exc, "get_codes"):
        failures = [exc.get_codes()]
    else:
        failures = [None]

    code, key = _code_and_key(failures[0] if failures else None)

    from insights.exceptions import exception_reporting

    event_id = exception_reporting(exc, context)

    set_rollback()

    body: dict[str, Any] = {
        "type": _error_type(exc),
        "code": code,
        "detail": _detail(exc, key),
        "attr": _attr(key),
    }
    extra = getattr(exc, "extra", None)
    if extra is not None:
        body["extra"] = extra
    if event_id:
        body["error_event_id"] = event_id

    headers = {}
    wait = getattr(exc, "wait", None)
    if isinstance(exc, exceptions.APIException) and wait:
        headers["Retry-After"] = "%d" % wait

    return Response(body, status=getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR), headers=headers)

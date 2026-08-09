import structlog
from rest_framework import status, viewsets
from rest_framework.response import Response

from insights.schema import ScriptCompileResponse

from insights.insightsql.compiler.bytecode import Local, create_bytecode
from insights.insightsql.errors import ExposedInsightsQLError
from insights.insightsql.parser import parse_program

from insights.api.documentation import _FallbackSerializer
from insights.api.mixins import PydanticModelMixin
from insights.api.routing import TeamAndOrgViewSetMixin

logger = structlog.get_logger(__name__)


class ScriptViewSet(TeamAndOrgViewSetMixin, PydanticModelMixin, viewsets.ViewSet):
    scope_object = "INTERNAL"
    serializer_class = _FallbackSerializer

    def create(self, request, *args, **kwargs) -> Response:
        # `script` is the field the one caller sends (`api.script.create` in lib/api.ts). Reading anything
        # else compiles `None`; reading a name that was never bound raised before it got that far.
        script = request.data.get("script")
        # A caller that omits `script` is making a bad request, and should be told which field.
        # Left to the compiler, `parse_program(None)` raises `TypeError: argument 1 must be str`,
        # which lands in the catch-all below: the status is right but the body says "internal
        # error" and an ERROR with a stack trace is written for what is a client mistake.
        if not isinstance(script, str):
            return Response({"error": "`script` is required and must be a string"}, status=status.HTTP_400_BAD_REQUEST)
        in_repl = request.data.get("in_repl", "false") in ("true", "True", True)
        locals = request.data.get("locals", []) or []
        try:
            # Parsing is inside the handler because the input is the caller's, and a program that
            # does not parse is a bad request, not a server fault. Outside it, every syntax error
            # was a 500 carrying no reason.
            program = parse_program(script)
            compiled = create_bytecode(
                program,
                supported_functions={"sleep", "fetch", "insightsCapture", "run"},
                in_repl=in_repl,
                locals=[Local(name=local[0], depth=local[1], is_captured=local[2]) for local in locals],
            )
            cleaned_locals = [[local.name, local.depth, local.is_captured] for local in compiled.locals]
            return Response(
                ScriptCompileResponse(
                    bytecode=compiled.bytecode,
                    locals=cleaned_locals,
                ).model_dump(),
                status=status.HTTP_200_OK,
            )
        except ExposedInsightsQLError as e:
            # `str(e)`, not `e.message`: `BaseInsightsQLError` annotates `message` but its
            # constructor never assigns it, so reading it raised `AttributeError` and turned every
            # exposable error into a 500. This is how the other handler renders one too
            # (`batch_exports/http.py`).
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Failed to compile script: {e}", exc_info=True, error=e)
            return Response({"error": "Internal error when compiling script"}, status=status.HTTP_400_BAD_REQUEST)

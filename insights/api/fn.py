import structlog
from rest_framework import status, viewsets
from rest_framework.response import Response

from insights.schema import InsightsQLCompileResponse

from insights.insightsql.compiler.bytecode import Local, create_bytecode
from insights.insightsql.errors import ExposedInsightsQLError
from insights.insightsql.parser import parse_program

from insights.api.mixins import PydanticModelMixin
from insights.api.routing import TeamAndOrgViewSetMixin

logger = structlog.get_logger(__name__)


class HogViewSet(TeamAndOrgViewSetMixin, PydanticModelMixin, viewsets.ViewSet):
    scope_object = "INTERNAL"

    def create(self, request, *args, **kwargs) -> Response:
        # `code` is the field the one caller sends (`api.fn.create` in lib/api.ts). Reading anything
        # else compiles `None`; reading a name that was never bound raised before it got that far.
        code = request.data.get("code")
        in_repl = request.data.get("in_repl", "false") in ("true", "True", True)
        locals = request.data.get("locals", []) or []
        try:
            # Parsing is inside the handler because the input is the caller's, and a program that
            # does not parse is a bad request, not a server fault. Outside it, every syntax error
            # was a 500 carrying no reason.
            program = parse_program(code)
            compiled = create_bytecode(
                program,
                supported_functions={"sleep", "fetch", "insightsCapture", "run"},
                in_repl=in_repl,
                locals=[Local(name=local[0], depth=local[1], is_captured=local[2]) for local in locals],
            )
            cleaned_locals = [[local.name, local.depth, local.is_captured] for local in compiled.locals]
            return Response(
                InsightsQLCompileResponse(
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

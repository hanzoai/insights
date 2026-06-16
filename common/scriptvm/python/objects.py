from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class CallFrame:
    ip: int
    chunk: str
    stack_start: int
    arg_len: int
    closure: dict


@dataclass
class ThrowFrame:
    call_stack_len: int
    stack_len: int
    catch_ip: int


def is_iql_date(obj: Any) -> bool:
    return isinstance(obj, dict) and "__iqlDate__" in obj and "year" in obj and "month" in obj and "day" in obj


def is_iql_datetime(obj: Any) -> bool:
    return isinstance(obj, dict) and "__iqlDateTime__" in obj and "dt" in obj and "zone" in obj


def is_iql_error(obj: Any) -> bool:
    return isinstance(obj, dict) and "__iqlError__" in obj and "type" in obj and "message" in obj


def new_iql_error(type: str, message: Any, payload: Any = None) -> dict:
    return {
        "__iqlError__": True,
        "type": type or "Error",
        "message": message or "An error occurred",
        "payload": payload,
    }


def is_iql_callable(obj: Any) -> bool:
    return (
        isinstance(obj, dict)
        and "__iqlCallable__" in obj
        and "argCount" in obj
        and "ip" in obj
        # and "chunk" in obj # TODO: enable after this has been live for some hours
        and "upvalueCount" in obj
    )


def is_iql_closure(obj: Any) -> bool:
    return isinstance(obj, dict) and "__iqlClosure__" in obj and "callable" in obj and "upvalues" in obj


def new_iql_closure(callable: dict, upvalues: Optional[list] = None) -> dict:
    return {
        "__iqlClosure__": True,
        "callable": callable,
        "upvalues": upvalues or [],
    }


def new_iql_callable(type: str, arg_count: int, upvalue_count: int, ip: int, name: str, chunk: str) -> dict:
    return {
        "__iqlCallable__": type,
        "name": name,
        "chunk": chunk,
        "argCount": arg_count,
        "upvalueCount": upvalue_count,
        "ip": ip,
    }


def is_iql_upvalue(obj: Any) -> bool:
    return (
        isinstance(obj, dict)
        and "__iqlUpValue__" in obj
        and "location" in obj
        and "closed" in obj
        and "value" in obj
        and "id" in obj
    )


def is_iql_interval(obj: Any) -> bool:
    return isinstance(obj, dict) and obj.get("__iqlInterval__") is True


def to_iql_interval(value: int, unit: str):
    return {
        "__iqlInterval__": True,
        "value": value,
        "unit": unit,
    }

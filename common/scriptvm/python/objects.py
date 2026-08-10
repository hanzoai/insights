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


def is_script_date(obj: Any) -> bool:
    return isinstance(obj, dict) and "__scriptDate__" in obj and "year" in obj and "month" in obj and "day" in obj


def is_script_datetime(obj: Any) -> bool:
    return isinstance(obj, dict) and "__scriptDateTime__" in obj and "dt" in obj and "zone" in obj


def is_script_error(obj: Any) -> bool:
    return isinstance(obj, dict) and "__scriptError__" in obj and "type" in obj and "message" in obj


def new_script_error(type: str, message: Any, payload: Any = None) -> dict:
    return {
        "__scriptError__": True,
        "type": type or "Error",
        "message": message or "An error occurred",
        "payload": payload,
    }


def is_script_callable(obj: Any) -> bool:
    return (
        isinstance(obj, dict)
        and "__scriptCallable__" in obj
        and "argCount" in obj
        and "ip" in obj
        # and "chunk" in obj # TODO: enable after this has been live for some hours
        and "upvalueCount" in obj
    )


def is_script_closure(obj: Any) -> bool:
    return isinstance(obj, dict) and "__scriptClosure__" in obj and "callable" in obj and "upvalues" in obj


def new_script_closure(callable: dict, upvalues: Optional[list] = None) -> dict:
    return {
        "__scriptClosure__": True,
        "callable": callable,
        "upvalues": upvalues or [],
    }


def new_script_callable(type: str, arg_count: int, upvalue_count: int, ip: int, name: str, chunk: str) -> dict:
    return {
        "__scriptCallable__": type,
        "name": name,
        "chunk": chunk,
        "argCount": arg_count,
        "upvalueCount": upvalue_count,
        "ip": ip,
    }


def is_script_upvalue(obj: Any) -> bool:
    return (
        isinstance(obj, dict)
        and "__scriptUpValue__" in obj
        and "location" in obj
        and "closed" in obj
        and "value" in obj
        and "id" in obj
    )


def is_script_interval(obj: Any) -> bool:
    return isinstance(obj, dict) and obj.get("__scriptInterval__") is True


def to_script_interval(value: int, unit: str):
    return {
        "__scriptInterval__": True,
        "value": value,
        "unit": unit,
    }

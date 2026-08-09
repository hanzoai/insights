import { ScriptCallable, ScriptClosure, ScriptDate, ScriptDateTime, ScriptError, ScriptUpValue } from './types'

export function isScriptDate(obj: any): obj is ScriptDate {
    return obj && typeof obj === 'object' && '__scriptDate__' in obj && 'year' in obj && 'month' in obj && 'day' in obj
}

export function isScriptDateTime(obj: any): obj is ScriptDateTime {
    return obj && typeof obj === 'object' && '__scriptDateTime__' in obj && 'dt' in obj && 'zone' in obj
}

export function isScriptError(obj: any): obj is ScriptError {
    return obj && typeof obj === 'object' && '__scriptError__' in obj && 'type' in obj && 'message' in obj
}

export function newScriptError(type: string, message: string, payload?: Record<string, any>): ScriptError {
    return {
        __scriptError__: true,
        type: type || 'Error',
        message: message || 'An error occurred',
        payload,
    }
}

export function isScriptCallable(obj: any): obj is ScriptCallable {
    return (
        obj &&
        typeof obj === 'object' &&
        '__scriptCallable__' in obj &&
        'argCount' in obj &&
        'ip' in obj &&
        // 'chunk' in obj &&  // TODO: enable after this has been live for some hours
        'upvalueCount' in obj
    )
}

export function isScriptClosure(obj: any): obj is ScriptClosure {
    return obj && typeof obj === 'object' && '__scriptClosure__' in obj && 'callable' in obj && 'upvalues' in obj
}

export function newScriptClosure(callable: ScriptCallable, upvalues?: number[]): ScriptClosure {
    return {
        __scriptClosure__: true,
        callable,
        upvalues: upvalues ?? [],
    }
}

export function newScriptCallable(
    type: ScriptCallable['__scriptCallable__'],
    {
        name,
        chunk,
        argCount,
        upvalueCount,
        ip,
    }: {
        name: string
        chunk: string
        argCount: number
        upvalueCount: number
        ip: number
    }
): ScriptCallable {
    return {
        __scriptCallable__: type,
        name,
        chunk: chunk,
        argCount,
        upvalueCount,
        ip,
    } satisfies ScriptCallable
}

export function isScriptUpValue(obj: any): obj is ScriptUpValue {
    return (
        obj &&
        typeof obj === 'object' &&
        '__scriptUpValue__' in obj &&
        'location' in obj &&
        'closed' in obj &&
        'value' in obj
    )
}

export function isScriptAST(obj: any): boolean {
    return obj && ((typeof obj === 'object' && '__hx_ast' in obj) || (obj instanceof Map && obj.get('__hx_ast')))
}

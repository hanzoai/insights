import { IQLCallable, IQLClosure, IQLDate, IQLDateTime, IQLError, IQLUpValue } from './types'

export function isIQLDate(obj: any): obj is IQLDate {
    return obj && typeof obj === 'object' && '__iqlDate__' in obj && 'year' in obj && 'month' in obj && 'day' in obj
}

export function isIQLDateTime(obj: any): obj is IQLDateTime {
    return obj && typeof obj === 'object' && '__iqlDateTime__' in obj && 'dt' in obj && 'zone' in obj
}

export function isIQLError(obj: any): obj is IQLError {
    return obj && typeof obj === 'object' && '__iqlError__' in obj && 'type' in obj && 'message' in obj
}

export function newIQLError(type: string, message: string, payload?: Record<string, any>): IQLError {
    return {
        __iqlError__: true,
        type: type || 'Error',
        message: message || 'An error occurred',
        payload,
    }
}

export function isIQLCallable(obj: any): obj is IQLCallable {
    return (
        obj &&
        typeof obj === 'object' &&
        '__iqlCallable__' in obj &&
        'argCount' in obj &&
        'ip' in obj &&
        // 'chunk' in obj &&  // TODO: enable after this has been live for some hours
        'upvalueCount' in obj
    )
}

export function isIQLClosure(obj: any): obj is IQLClosure {
    return obj && typeof obj === 'object' && '__iqlClosure__' in obj && 'callable' in obj && 'upvalues' in obj
}

export function newIQLClosure(callable: IQLCallable, upvalues?: number[]): IQLClosure {
    return {
        __iqlClosure__: true,
        callable,
        upvalues: upvalues ?? [],
    }
}

export function newIQLCallable(
    type: IQLCallable['__iqlCallable__'],
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
): IQLCallable {
    return {
        __iqlCallable__: type,
        name,
        chunk: chunk,
        argCount,
        upvalueCount,
        ip,
    } satisfies IQLCallable
}

export function isIQLUpValue(obj: any): obj is IQLUpValue {
    return (
        obj &&
        typeof obj === 'object' &&
        '__iqlUpValue__' in obj &&
        'location' in obj &&
        'closed' in obj &&
        'value' in obj
    )
}

export function isIQLAST(obj: any): boolean {
    return obj && ((typeof obj === 'object' && '__hx_ast' in obj) || (obj instanceof Map && obj.get('__hx_ast')))
}

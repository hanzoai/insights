import { DateTime } from 'luxon'

import { isScriptDate, isScriptDateTime } from '../objects'
import { ScriptDate, ScriptDateTime } from '../types'

export function toScriptDate(year: number, month: number, day: number): ScriptDate {
    return {
        __scriptDate__: true,
        year: year,
        month: month,
        day: day,
    }
}

export function toScriptDateTime(timestamp: number | ScriptDate, zone?: string): ScriptDateTime {
    if (isScriptDate(timestamp)) {
        const dateTime = DateTime.fromObject(
            {
                year: timestamp.year,
                month: timestamp.month,
                day: timestamp.day,
            },
            { zone: zone || 'UTC' }
        )
        return {
            __scriptDateTime__: true,
            dt: dateTime.toSeconds(),
            zone: dateTime.zoneName || 'UTC',
        }
    }
    return {
        __scriptDateTime__: true,
        dt: timestamp,
        zone: zone || 'UTC',
    }
}

// EXPORTED STL functions

export function now(zone?: string): ScriptDateTime {
    return toScriptDateTime(Date.now() / 1000, zone)
}

export function toUnixTimestamp(input: ScriptDateTime | ScriptDate | string, zone?: string): number {
    if (isScriptDateTime(input)) {
        return input.dt
    }
    if (isScriptDate(input)) {
        return toScriptDateTime(input).dt
    }
    return DateTime.fromISO(input, { zone: zone || 'UTC' }).toSeconds()
}

export function fromUnixTimestamp(input: number): ScriptDateTime {
    return toScriptDateTime(input)
}

export function toUnixTimestampMilli(input: ScriptDateTime | ScriptDate | string, zone?: string): number {
    return toUnixTimestamp(input, zone) * 1000
}

export function fromUnixTimestampMilli(input: number): ScriptDateTime {
    return toScriptDateTime(input / 1000)
}

export function toTimeZone(input: ScriptDateTime, zone: string): ScriptDateTime | ScriptDate {
    if (!isScriptDateTime(input)) {
        throw new Error('Expected a DateTime')
    }
    return { ...input, zone }
}

export function toDate(input: string | number): ScriptDate {
    const dt = typeof input === 'number' ? DateTime.fromSeconds(input) : DateTime.fromISO(input)
    return {
        __scriptDate__: true,
        year: dt.year,
        month: dt.month,
        day: dt.day,
    }
}

export function toDateTime(input: string | number, zone?: string): ScriptDateTime {
    const dt = typeof input === 'number' ? input : DateTime.fromISO(input, { zone: zone || 'UTC' }).toSeconds()
    return {
        __scriptDateTime__: true,
        dt: dt,
        zone: zone || 'UTC',
    }
}

/** Epoch seconds for a date-like string, parsed the same way `toDateTime` would, else null. */
export function dateStringToSeconds(input: string): number | null {
    const dt = DateTime.fromISO(input, { zone: 'UTC' })
    return dt.isValid ? dt.toSeconds() : null
}

/** Convert from Datastore format string to Luxon format string */
const tokenTranslations: Record<string, string> = {
    a: 'EEE',
    b: 'MMM',
    c: 'MM',
    C: 'yy',
    d: 'dd',
    D: 'MM/dd/yy',
    e: 'd',
    f: 'SSS',
    F: 'yyyy-MM-dd',
    g: 'yy',
    G: 'yyyy',
    h: 'hh',
    H: 'HH',
    i: 'mm',
    I: 'hh',
    j: 'ooo',
    k: 'HH',
    l: 'hh',
    m: 'MM',
    M: 'MMMM',
    n: '\n',
    p: 'a',
    Q: 'q',
    r: 'hh:mm a',
    R: 'HH:mm',
    s: 'ss',
    S: 'ss',
    t: '\t',
    T: 'HH:mm:ss',
    u: 'E',
    V: 'WW',
    w: 'E',
    W: 'EEEE',
    y: 'yy',
    Y: 'yyyy',
    z: 'ZZZ',
    '%': '%',
}
export function formatDateTime(input: any, format: string, zone?: string): string {
    if (!isScriptDateTime(input)) {
        throw new Error('Expected a DateTime')
    }
    if (!format) {
        throw new Error('formatDateTime requires at least 2 arguments')
    }
    let formatString = ''
    let acc = ''
    for (let i = 0; i < format.length; i++) {
        if (format[i] === '%') {
            if (acc.length > 0) {
                formatString += `'${acc}'`
                acc = ''
            }
            i += 1
            if (i < format.length && tokenTranslations[format[i]]) {
                formatString += tokenTranslations[format[i]]
            }
        } else {
            acc += format[i]
        }
    }
    if (acc.length > 0) {
        formatString += `'${acc}'`
    }
    return DateTime.fromSeconds(input.dt, { zone: zone || input.zone }).toFormat(formatString)
}

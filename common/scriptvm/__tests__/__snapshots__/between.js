function print (...args) { console.log(...args.map(__printStringOutput)) }
function __printStringOutput(obj) { if (typeof obj === 'string') { return obj } return __printValue(obj) }
function __printValue(obj, marked = new Set()) {
    if (typeof obj === 'object' && obj !== null && obj !== undefined) {
        if (marked.has(obj) && !__isDateTime(obj) && !__isDate(obj) && !__isError(obj)) { return 'null'; }
        marked.add(obj);
        try {
            if (Array.isArray(obj)) {
                if (obj.__isTuple) { return obj.length < 2 ? `tuple(${obj.map((o) => __printValue(o, marked)).join(', ')})` : `(${obj.map((o) => __printValue(o, marked)).join(', ')})`; }
                return `[${obj.map((o) => __printValue(o, marked)).join(', ')}]`;
            }
            if (__isDateTime(obj)) { const millis = String(obj.dt); return `DateTime(${millis}${millis.includes('.') ? '' : '.0'}, ${__escapeString(obj.zone)})`; }
            if (__isDate(obj)) return `Date(${obj.year}, ${obj.month}, ${obj.day})`;
            if (__isError(obj)) { return `${String(obj.type)}(${__escapeString(obj.message)}${obj.payload ? `, ${__printValue(obj.payload, marked)}` : ''})`; }
            if (obj instanceof Map) { return `{${Array.from(obj.entries()).map(([key, value]) => `${__printValue(key, marked)}: ${__printValue(value, marked)}`).join(', ')}}`; }
            return `{${Object.entries(obj).map(([key, value]) => `${__printValue(key, marked)}: ${__printValue(value, marked)}`).join(', ')}}`;
        } finally {
            marked.delete(obj);
        }
    } else if (typeof obj === 'boolean') return obj ? 'true' : 'false';
    else if (obj === null || obj === undefined) return 'null';
    else if (typeof obj === 'string') return __escapeString(obj);
            if (typeof obj === 'function') return `fn<${__escapeIdentifier(obj.name || 'lambda')}(${obj.length})>`;
    return obj.toString();
}
function __isError(obj) {return obj && obj.__error__ === true}
function __isDateTime(obj) { return obj && obj.__dateTime__ === true }
function __isDate(obj) { return obj && obj.__date__ === true }
function __escapeString(value) {
    const singlequoteEscapeCharsMap = { '\b': '\\b', '\f': '\\f', '\r': '\\r', '\n': '\\n', '\t': '\\t', '\0': '\\0', '\v': '\\v', '\\': '\\\\', "'": "\\'" }
    return `'${value.split('').map((c) => singlequoteEscapeCharsMap[c] || c).join('')}'`;
}
function __escapeIdentifier(identifier) {
    const backquoteEscapeCharsMap = { '\b': '\\b', '\f': '\\f', '\r': '\\r', '\n': '\\n', '\t': '\\t', '\0': '\\0', '\v': '\\v', '\\': '\\\\', '`': '``' }
    if (typeof identifier === 'number') return identifier.toString();
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(identifier)) return identifier;
    return `\`${identifier.split('').map((c) => backquoteEscapeCharsMap[c] || c).join('')}\``;
}

print((() => { const expr=(5), low=(1), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr >= 1 && expr <= 10); })());
print((() => { const expr=(1), low=(1), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr >= 1 && expr <= 10); })());
print((() => { const expr=(10), low=(1), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr >= 1 && expr <= 10); })());
print((() => { const expr=(0), low=(1), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr >= 1 && expr <= 10); })());
print((() => { const expr=(11), low=(1), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr >= 1 && expr <= 10); })());
print((() => { const expr=(5), low=(1), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr < 1 || expr > 10); })());
print((() => { const expr=(0), low=(1), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr < 1 || expr > 10); })());
print((() => { const expr=(11), low=(1), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr < 1 || expr > 10); })());
print((() => { const expr=(10), low=(1), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr < 1 || expr > 10); })());
print((() => { const expr=(null), low=(1), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr >= 1 && expr <= 10); })());
print((() => { const expr=(5), low=(null), high=(10); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr >= null && expr <= 10); })());
print((() => { const expr=(5), low=(1), high=(null); return expr !== null && expr !== undefined && low !== null && low !== undefined && high !== null && high !== undefined && !!(expr >= 1 && expr <= null); })());

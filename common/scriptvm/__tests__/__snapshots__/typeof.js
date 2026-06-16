function __x_typeof (value) {
    if (value === null || value === undefined) { return 'null'
    } else if (__isIQLDateTime(value)) { return 'datetime'
    } else if (__isIQLDate(value)) { return 'date'
    } else if (__isIQLError(value)) { return 'error'
    } else if (typeof value === 'function') { return 'function'
    } else if (Array.isArray(value)) { if (value.__isIQLTuple) { return 'tuple' } return 'array'
    } else if (typeof value === 'object') { return 'object'
    } else if (typeof value === 'number') { return Number.isInteger(value) ? 'integer' : 'float'
    } else if (typeof value === 'string') { return 'string'
    } else if (typeof value === 'boolean') { return 'boolean' }
    return 'unknown'
}
function tuple (...args) { const tuple = args.slice(); tuple.__isIQLTuple = true; return tuple; }
function toDateTime (input, zone) { return __toDateTime(input, zone) }
function toDate (input) { return __toDate(input) }
function print (...args) { console.log(...args.map(__printIQLStringOutput)) }
function __toDateTime(input, zone) { let dt;
    if (typeof input === 'number') { dt = input; }
    else { const date = new Date(input); if (isNaN(date.getTime())) { throw new Error('Invalid date input'); } dt = date.getTime() / 1000; }
    return { __iqlDateTime__: true, dt: dt, zone: zone || 'UTC' }; }
function __toDate(input) { let date;
    if (typeof input === 'number') { date = new Date(input * 1000); } else { date = new Date(input); }
    if (isNaN(date.getTime())) { throw new Error('Invalid date input'); }
    return { __iqlDate__: true, year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }; }
function __printIQLStringOutput(obj) { if (typeof obj === 'string') { return obj } return __printIQLValue(obj) }
function __printIQLValue(obj, marked = new Set()) {
    if (typeof obj === 'object' && obj !== null && obj !== undefined) {
        if (marked.has(obj) && !__isIQLDateTime(obj) && !__isIQLDate(obj) && !__isIQLError(obj)) { return 'null'; }
        marked.add(obj);
        try {
            if (Array.isArray(obj)) {
                if (obj.__isIQLTuple) { return obj.length < 2 ? `tuple(${obj.map((o) => __printIQLValue(o, marked)).join(', ')})` : `(${obj.map((o) => __printIQLValue(o, marked)).join(', ')})`; }
                return `[${obj.map((o) => __printIQLValue(o, marked)).join(', ')}]`;
            }
            if (__isIQLDateTime(obj)) { const millis = String(obj.dt); return `DateTime(${millis}${millis.includes('.') ? '' : '.0'}, ${__escapeString(obj.zone)})`; }
            if (__isIQLDate(obj)) return `Date(${obj.year}, ${obj.month}, ${obj.day})`;
            if (__isIQLError(obj)) { return `${String(obj.type)}(${__escapeString(obj.message)}${obj.payload ? `, ${__printIQLValue(obj.payload, marked)}` : ''})`; }
            if (obj instanceof Map) { return `{${Array.from(obj.entries()).map(([key, value]) => `${__printIQLValue(key, marked)}: ${__printIQLValue(value, marked)}`).join(', ')}}`; }
            return `{${Object.entries(obj).map(([key, value]) => `${__printIQLValue(key, marked)}: ${__printIQLValue(value, marked)}`).join(', ')}}`;
        } finally {
            marked.delete(obj);
        }
    } else if (typeof obj === 'boolean') return obj ? 'true' : 'false';
    else if (obj === null || obj === undefined) return 'null';
    else if (typeof obj === 'string') return __escapeString(obj);
            if (typeof obj === 'function') return `fn<${__escapeIdentifier(obj.name || 'lambda')}(${obj.length})>`;
    return obj.toString();
}
function __lambda (fn) { return fn }
function __isIQLError(obj) {return obj && obj.__iqlError__ === true}
function __isIQLDateTime(obj) { return obj && obj.__iqlDateTime__ === true }
function __isIQLDate(obj) { return obj && obj.__iqlDate__ === true }
function __escapeString(value) {
    const singlequoteEscapeCharsMap = { '\b': '\\b', '\f': '\\f', '\r': '\\r', '\n': '\\n', '\t': '\\t', '\0': '\\0', '\v': '\\v', '\\': '\\\\', "'": "\\'" }
    return `'${value.split('').map((c) => singlequoteEscapeCharsMap[c] || c).join('')}'`;
}
function __escapeIdentifier(identifier) {
    const backquoteEscapeCharsMap = { '\b': '\\b', '\f': '\\f', '\r': '\\r', '\n': '\\n', '\t': '\\t', '\0': '\\0', '\v': '\\v', '\\': '\\\\', '`': '\\`' }
    if (typeof identifier === 'number') return identifier.toString();
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(identifier)) return identifier;
    return `\`${identifier.split('').map((c) => backquoteEscapeCharsMap[c] || c).join('')}\``;
}
function __x_Error (message, payload) { return __newIQLError('Error', message, payload) }
function __newIQLError(type, message, payload) {
    let error = new Error(message || 'An error occurred');
    error.__iqlError__ = true
    error.type = type
    error.payload = payload
    return error
}

function test(obj) {
    print(__x_typeof(obj));
}
test("hello world");
test(123);
test(1.23);
test(true);
test(false);
test(null);
test({});
test([]);
test(tuple(1, 2, 3));
test(__lambda(() => (1 + 2)));
test(toDateTime("2021-01-01T00:00:00Z"));
test(toDate("2021-01-01"));
test(__x_Error("BigError", "message"));

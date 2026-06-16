function print (...args) { console.log(...args.map(__printIQLStringOutput)) }
function match (str, pattern) { return !str || !pattern ? false : new RegExp(pattern).test(str) }
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

print("-- match --");
print(match("uu", "u"));
print(match("uu", "b"));
print(match(null, "u"));
print(match(null, "b"));
print(match("uu", null));
print(match("null", null));
print(match("uu", "u"));
print(match("uu", "b"));
print(match(null, "u"));
print(match(null, "b"));
print(match("uu", null));
print(match("null", null));

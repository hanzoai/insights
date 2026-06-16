function print (...args) { console.log(...args.map(__printIQLStringOutput)) }
function jsonStringify (value, spacing) {
    function convert(x, marked) {
        if (!marked) { marked = new Set() }
        if (typeof x === 'object' && x !== null) {
            if (marked.has(x)) { return null }
            marked.add(x)
            try {
                if (x instanceof Map) {
                    const obj = {}
                    x.forEach((value, key) => { obj[convert(key, marked)] = convert(value, marked) })
                    return obj
                }
                if (Array.isArray(x)) { return x.map((v) => convert(v, marked)) }
                if (__isIQLDateTime(x) || __isIQLDate(x) || __isIQLError(x)) { return x }
                if (typeof x === 'function') { return `fn<${x.name || 'lambda'}(${x.length})>` }
                const obj = {}; for (const key in x) { obj[key] = convert(x[key], marked) }
                return obj
            } finally {
                marked.delete(x)
            }
        }
        return x
    }
    if (spacing && typeof spacing === 'number' && spacing > 0) {
        return JSON.stringify(convert(value), null, spacing)
    }
    return JSON.stringify(convert(value), (key, val) => typeof val === 'function' ? `fn<${val.name || 'lambda'}(${val.length})>` : val)
}
function jsonParse (str) {
    function convert(x) {
        if (Array.isArray(x)) { return x.map(convert) }
        else if (typeof x === 'object' && x !== null) {
            if (x.__iqlDateTime__) { return __toIQLDateTime(x.dt, x.zone)
            } else if (x.__iqlDate__) { return __toIQLDate(x.year, x.month, x.day)
            } else if (x.__iqlError__) { return __newIQLError(x.type, x.message, x.payload) }
            const obj = {}; for (const key in x) { obj[key] = convert(x[key]) }; return obj }
        return x }
    return convert(JSON.parse(str)) }
function arrayMap (func, arr) { let result = []; for (let i = 0; i < arr.length; i++) { result = arrayPushBack(result, func(arr[i])) } return result }
function arrayPushBack (arr, item) { if (!Array.isArray(arr)) { return [item] } return [...arr, item] }
function __toIQLDateTime(timestamp, zone) {
    if (__isIQLDate(timestamp)) {
        const date = new Date(Date.UTC(timestamp.year, timestamp.month - 1, timestamp.day));
        const dt = date.getTime() / 1000;
        return { __iqlDateTime__: true, dt: dt, zone: zone || 'UTC' };
    }
    return { __iqlDateTime__: true, dt: timestamp, zone: zone || 'UTC' }; }
function __toIQLDate(year, month, day) { return { __iqlDate__: true, year: year, month: month, day: day, } }
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
function __newIQLError(type, message, payload) {
    let error = new Error(message || 'An error occurred');
    error.__iqlError__ = true
    error.type = type
    error.payload = payload
    return error
}
function __lambda (fn) { return fn }
function __isIQLError(obj) {return obj && obj.__iqlError__ === true}
function __isIQLDateTime(obj) { return obj && obj.__iqlDateTime__ === true }
function __isIQLDate(obj) { return obj && obj.__iqlDate__ === true }
function __getProperty(objectOrArray, key, nullish) {
    if ((nullish && !objectOrArray) || key === 0) { return null }
    if (Array.isArray(objectOrArray)) { return key > 0 ? objectOrArray[key - 1] : objectOrArray[objectOrArray.length + key] }
    else { return objectOrArray[key] }
}
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

let b = __lambda((x) => (x * 2));
print(b);
print(b(2));
print(b(8));
print("--------");
let func = __lambda((x) => (x * 2));
let arr = [func];
print(func(2));
print(__getProperty(arr, 1, false)(2));
print(__lambda((x) => (x * 2))(2));
print("--------");
let withArg = __lambda((x) => {
    print(x);
    print("moo");
    print("cow");
});
withArg(2);
print("--------");
let noArg = __lambda(() => {
    print("moo");
    print("cow");
});
noArg();
print("-------- lambdas do not survive json --------");
print(b);
print(jsonStringify(b));
let c = jsonParse(jsonStringify(b));
print(c);
print("--------");
let arrayMapObjects = arrayMap(__lambda((a) => ({"a": a})), [1, 2, 3]);
print(arrayMapObjects);

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
function isValidJSON (str) { try { JSON.parse(str); return true } catch (e) { return false } }
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
function JSONLength (obj, ...path) {
    try { if (typeof obj === 'string') { obj = JSON.parse(obj) } } catch (e) { return 0 }
    if (typeof obj === 'object' && obj !== null) {
        const value = __getNestedValue(obj, path, true)
        if (Array.isArray(value)) {
            return value.length
        } else if (value instanceof Map) {
            return value.size
        } else if (typeof value === 'object' && value !== null) {
            return Object.keys(value).length
        }
    }
    return 0 }
function JSONHas (obj, ...path) {
    let current = obj
    for (const key of path) {
        let currentParsed = current
        if (typeof current === 'string') { try { currentParsed = JSON.parse(current) } catch (e) { return false } }
        if (currentParsed instanceof Map) { if (!currentParsed.has(key)) { return false }; current = currentParsed.get(key) }
        else if (typeof currentParsed === 'object' && currentParsed !== null) {
            if (typeof key === 'number') {
                if (Array.isArray(currentParsed)) {
                    if (key < 0) { if (key < -currentParsed.length) { return false }; current = currentParsed[currentParsed.length + key] }
                    else if (key === 0) { return false }
                    else { if (key > currentParsed.length) { return false }; current = currentParsed[key - 1] }
                } else { return false }
            } else {
                if (!(key in currentParsed)) { return false }
                current = currentParsed[key]
            }
        } else { return false }
    }
    return true }
function JSONExtractBool (obj, ...path) {
    try {
        if (typeof obj === 'string') {
            obj = JSON.parse(obj)
        }
    } catch (e) {
        return false
    }
    if (path.length > 0) {
        obj = __getNestedValue(obj, path, true)
    }
    if (typeof obj === 'boolean') {
        return obj
    }
    return false
}
function __getNestedValue(obj, path, allowNull = false) {
    let current = obj
    for (const key of path) {
        if (current == null) {
            return null
        }
        if (current instanceof Map) {
            current = current.get(key)
        } else if (typeof current === 'object' && current !== null) {
            current = current[key]
        } else {
            return null
        }
    }
    if (current === null && !allowNull) {
        return null
    }
    return current
}

print(jsonParse("[1,2,3]"));
let event = {"event": "$pageview", "properties": {"$browser": "Chrome", "$os": "Windows"}};
let json = jsonStringify(event);
print(jsonParse(json));
print("-- JSONHas --");
print(JSONHas("{\"a\": \"hello\", \"b\": [-100, 200.0, 300]}", "b"));
print(JSONHas("{\"a\": \"hello\", \"b\": [-100, 200.0, 300]}", "b", 4));
print(JSONHas({"a": "hello", "b": [-100, 200.0, 300]}, "b"));
print(JSONHas({"a": "hello", "b": [-100, 200.0, 300]}, "b", 4));
print(JSONHas({"a": "hello", "b": [-100, 200.0, 300]}, "b", -2));
print(JSONHas({"a": "hello", "b": [-100, 200.0, 300]}, "b", -4));
print(JSONHas("[1,2,3]", 0));
print(JSONHas("[1,2,[1,2]]", -1, 1));
print(JSONHas("[1,2,[1,2]]", -1, -3));
print(JSONHas("[1,2,[1,2]]", 1, 1));
print("-- isValidJSON --");
print(isValidJSON("{\"a\": \"hello\", \"b\": [-100, 200.0, 300]}"));
print(isValidJSON("not a json"));
print("-- JSONLength --");
print(JSONLength("{\"a\": \"hello\", \"b\": [-100, 200.0, 300]}", "b"));
print(JSONLength("{\"a\": \"hello\", \"b\": [-100, 200.0, 300]}"));
print(JSONLength({"a": "hello", "b": [-100, 200.0, 300]}, "b"));
print(JSONLength({"a": "hello", "b": [-100, 200.0, 300]}));
print("-- JSONExtractBool --");
print(JSONExtractBool("{\"a\": \"hello\", \"b\": true}", "b"));
print(JSONExtractBool("{\"a\": \"hello\", \"b\": false}", "b"));
print(JSONExtractBool("{\"a\": \"hello\", \"b\": 1}", "b"));
print(JSONExtractBool("{\"a\": \"hello\", \"b\": 0}", "b"));
print(JSONExtractBool("{\"a\": \"hello\", \"b\": \"true\"}", "b"));
print(JSONExtractBool("{\"a\": \"hello\", \"b\": \"false\"}", "b"));
print(JSONExtractBool(true));
print(JSONExtractBool(false));
print(JSONExtractBool(1));
print(JSONExtractBool(0));
print(JSONExtractBool("true"));
print(JSONExtractBool("false"));

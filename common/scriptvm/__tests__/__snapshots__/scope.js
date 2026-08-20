function print (...args) { console.log(...args.map(__printStringOutput)) }
function __setProperty(objectOrArray, key, value) {
    if (Array.isArray(objectOrArray)) { if (key > 0) { objectOrArray[key - 1] = value } else { objectOrArray[objectOrArray.length + key] = value } }
    else { objectOrArray[key] = value }
    return objectOrArray
}
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
function __lambda (fn) { return fn }
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

let dbl = __lambda((x) => (x * 2));
print(dbl);
print(dbl(2));
print(dbl(8));
print("--------");
let __x_var = 5;
let varify = __lambda((x) => (x * __x_var));
print(varify(2));
__x_var = 10
print(varify(2));
print(varify(8));
print("--------");
function bigVar() {
    let __x_var = 5;
    let varify = __lambda((x) => (x * __x_var));
    return varify;
}
let bigVarify = bigVar();
print(bigVarify(2));
print(bigVarify(8));
print("--------");
let a = 3;
function outerA() {
    print(a);
    a = 4
    print(a);
}
function innerA() {
    print(a);
    outerA();
    print(a);
}
print(a);
innerA();
print(a);
print("--------");
let b = {"key": 3};
function outerB() {
    print(b);
    __setProperty(b, "key", 4)
    print(b);
}
function innerB() {
    print(b);
    outerB();
    print(b);
}
print(b);
innerB();
print(b);
print("--------");
function outerC() {
    let x = "outside";
    function innerC() {
            print(x);
        }
    innerC();
}
outerC();
print("--------");
function myFunctionOuter() {
    let b = 3;
    function myFunction(a) {
            return (a + b);
        }
    print(myFunction(2));
    print(myFunction(3));
}
myFunctionOuter();
print("--------");

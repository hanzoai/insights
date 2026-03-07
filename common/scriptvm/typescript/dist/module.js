import {Buffer as $62dAA$Buffer} from "buffer";
import {DateTime as $62dAA$DateTime} from "luxon";


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
var $d6c46379019a9f14$exports = {};

$parcel$export($d6c46379019a9f14$exports, "DEFAULT_MAX_ASYNC_STEPS", () => $d6c46379019a9f14$export$2a71946d1fd66654);
$parcel$export($d6c46379019a9f14$exports, "DEFAULT_MAX_MEMORY", () => $d6c46379019a9f14$export$802abc67201653ab);
$parcel$export($d6c46379019a9f14$exports, "DEFAULT_TIMEOUT_MS", () => $d6c46379019a9f14$export$dcf22dd285f74f3d);
$parcel$export($d6c46379019a9f14$exports, "MAX_FUNCTION_ARGS_LENGTH", () => $d6c46379019a9f14$export$a6ea10a37f8d5abe);
$parcel$export($d6c46379019a9f14$exports, "CALLSTACK_LENGTH", () => $d6c46379019a9f14$export$b3e3f74739b6f9fd);
const $d6c46379019a9f14$export$2a71946d1fd66654 = 100;
const $d6c46379019a9f14$export$802abc67201653ab = 67108864 // 64 MB
;
const $d6c46379019a9f14$export$dcf22dd285f74f3d = 5000 // ms
;
const $d6c46379019a9f14$export$a6ea10a37f8d5abe = 300;
const $d6c46379019a9f14$export$b3e3f74739b6f9fd = 1000;


var $46c45dfd262302d4$exports = {};

$parcel$export($46c45dfd262302d4$exports, "execSync", () => $46c45dfd262302d4$export$fa77af024d7e00a8);
$parcel$export($46c45dfd262302d4$exports, "exec", () => $46c45dfd262302d4$export$78e3044358792147);
$parcel$export($46c45dfd262302d4$exports, "execAsync", () => $46c45dfd262302d4$export$cf47dcd3447a7197);

var $27b25c9e0700770a$exports = {};

$parcel$export($27b25c9e0700770a$exports, "isHogDate", () => $27b25c9e0700770a$export$bd8197d5a05a4a7e);
$parcel$export($27b25c9e0700770a$exports, "isHogDateTime", () => $27b25c9e0700770a$export$36cb9320e67ccd70);
$parcel$export($27b25c9e0700770a$exports, "isHogError", () => $27b25c9e0700770a$export$6a076491ad0da05d);
$parcel$export($27b25c9e0700770a$exports, "newHogError", () => $27b25c9e0700770a$export$c2d752b32b9bf15c);
$parcel$export($27b25c9e0700770a$exports, "isHogCallable", () => $27b25c9e0700770a$export$3bbfc8b03361d8b7);
$parcel$export($27b25c9e0700770a$exports, "isHogClosure", () => $27b25c9e0700770a$export$2fad4bf1d8756816);
$parcel$export($27b25c9e0700770a$exports, "newHogClosure", () => $27b25c9e0700770a$export$42bb9ce6d451c81e);
$parcel$export($27b25c9e0700770a$exports, "newHogCallable", () => $27b25c9e0700770a$export$4160dcabb869144f);
$parcel$export($27b25c9e0700770a$exports, "isHogUpValue", () => $27b25c9e0700770a$export$30222d8f8abbf3d0);
$parcel$export($27b25c9e0700770a$exports, "isHogAST", () => $27b25c9e0700770a$export$c1885639c9f11133);
function $27b25c9e0700770a$export$bd8197d5a05a4a7e(obj) {
    return obj && typeof obj === 'object' && '__hogDate__' in obj && 'year' in obj && 'month' in obj && 'day' in obj;
}
function $27b25c9e0700770a$export$36cb9320e67ccd70(obj) {
    return obj && typeof obj === 'object' && '__hogDateTime__' in obj && 'dt' in obj && 'zone' in obj;
}
function $27b25c9e0700770a$export$6a076491ad0da05d(obj) {
    return obj && typeof obj === 'object' && '__hogError__' in obj && 'type' in obj && 'message' in obj;
}
function $27b25c9e0700770a$export$c2d752b32b9bf15c(type, message, payload) {
    return {
        __hogError__: true,
        type: type || 'Error',
        message: message || 'An error occurred',
        payload: payload
    };
}
function $27b25c9e0700770a$export$3bbfc8b03361d8b7(obj) {
    return obj && typeof obj === 'object' && '__hogCallable__' in obj && 'argCount' in obj && 'ip' in obj && // 'chunk' in obj &&  // TODO: enable after this has been live for some hours
    'upvalueCount' in obj;
}
function $27b25c9e0700770a$export$2fad4bf1d8756816(obj) {
    return obj && typeof obj === 'object' && '__hogClosure__' in obj && 'callable' in obj && 'upvalues' in obj;
}
function $27b25c9e0700770a$export$42bb9ce6d451c81e(callable, upvalues) {
    return {
        __hogClosure__: true,
        callable: callable,
        upvalues: upvalues ?? []
    };
}
function $27b25c9e0700770a$export$4160dcabb869144f(type, { name: name, chunk: chunk, argCount: argCount, upvalueCount: upvalueCount, ip: ip }) {
    return {
        __hogCallable__: type,
        name: name,
        chunk: chunk,
        argCount: argCount,
        upvalueCount: upvalueCount,
        ip: ip
    };
}
function $27b25c9e0700770a$export$30222d8f8abbf3d0(obj) {
    return obj && typeof obj === 'object' && '__hogUpValue__' in obj && 'location' in obj && 'closed' in obj && 'value' in obj;
}
function $27b25c9e0700770a$export$c1885639c9f11133(obj) {
    return obj && (typeof obj === 'object' && '__hx_ast' in obj || obj instanceof Map && obj.get('__hx_ast'));
}


var $66bfafebb155a286$exports = {};

$parcel$export($66bfafebb155a286$exports, "Operation", () => $66bfafebb155a286$export$ab5aad00225c5662);
$parcel$export($66bfafebb155a286$exports, "operations", () => $66bfafebb155a286$export$59894c102379d64a);
var $66bfafebb155a286$export$ab5aad00225c5662 = /*#__PURE__*/ function(Operation) {
    Operation[Operation["GET_GLOBAL"] = 1] = "GET_GLOBAL";
    Operation[Operation["CALL_GLOBAL"] = 2] = "CALL_GLOBAL";
    Operation[Operation["AND"] = 3] = "AND";
    Operation[Operation["OR"] = 4] = "OR";
    Operation[Operation["NOT"] = 5] = "NOT";
    Operation[Operation["PLUS"] = 6] = "PLUS";
    Operation[Operation["MINUS"] = 7] = "MINUS";
    Operation[Operation["MULTIPLY"] = 8] = "MULTIPLY";
    Operation[Operation["DIVIDE"] = 9] = "DIVIDE";
    Operation[Operation["MOD"] = 10] = "MOD";
    Operation[Operation["EQ"] = 11] = "EQ";
    Operation[Operation["NOT_EQ"] = 12] = "NOT_EQ";
    Operation[Operation["GT"] = 13] = "GT";
    Operation[Operation["GT_EQ"] = 14] = "GT_EQ";
    Operation[Operation["LT"] = 15] = "LT";
    Operation[Operation["LT_EQ"] = 16] = "LT_EQ";
    Operation[Operation["LIKE"] = 17] = "LIKE";
    Operation[Operation["ILIKE"] = 18] = "ILIKE";
    Operation[Operation["NOT_LIKE"] = 19] = "NOT_LIKE";
    Operation[Operation["NOT_ILIKE"] = 20] = "NOT_ILIKE";
    Operation[Operation["IN"] = 21] = "IN";
    Operation[Operation["NOT_IN"] = 22] = "NOT_IN";
    Operation[Operation["REGEX"] = 23] = "REGEX";
    Operation[Operation["NOT_REGEX"] = 24] = "NOT_REGEX";
    Operation[Operation["IREGEX"] = 25] = "IREGEX";
    Operation[Operation["NOT_IREGEX"] = 26] = "NOT_IREGEX";
    Operation[Operation["IN_COHORT"] = 27] = "IN_COHORT";
    Operation[Operation["NOT_IN_COHORT"] = 28] = "NOT_IN_COHORT";
    Operation[Operation["TRUE"] = 29] = "TRUE";
    Operation[Operation["FALSE"] = 30] = "FALSE";
    Operation[Operation["NULL"] = 31] = "NULL";
    Operation[Operation["STRING"] = 32] = "STRING";
    Operation[Operation["INTEGER"] = 33] = "INTEGER";
    Operation[Operation["FLOAT"] = 34] = "FLOAT";
    Operation[Operation["POP"] = 35] = "POP";
    Operation[Operation["GET_LOCAL"] = 36] = "GET_LOCAL";
    Operation[Operation["SET_LOCAL"] = 37] = "SET_LOCAL";
    Operation[Operation["RETURN"] = 38] = "RETURN";
    Operation[Operation["JUMP"] = 39] = "JUMP";
    Operation[Operation["JUMP_IF_FALSE"] = 40] = "JUMP_IF_FALSE";
    Operation[Operation["DECLARE_FN"] = 41] = "DECLARE_FN";
    Operation[Operation["DICT"] = 42] = "DICT";
    Operation[Operation["ARRAY"] = 43] = "ARRAY";
    Operation[Operation["TUPLE"] = 44] = "TUPLE";
    Operation[Operation["GET_PROPERTY"] = 45] = "GET_PROPERTY";
    Operation[Operation["SET_PROPERTY"] = 46] = "SET_PROPERTY";
    Operation[Operation["JUMP_IF_STACK_NOT_NULL"] = 47] = "JUMP_IF_STACK_NOT_NULL";
    Operation[Operation["GET_PROPERTY_NULLISH"] = 48] = "GET_PROPERTY_NULLISH";
    Operation[Operation["THROW"] = 49] = "THROW";
    Operation[Operation["TRY"] = 50] = "TRY";
    Operation[Operation["POP_TRY"] = 51] = "POP_TRY";
    Operation[Operation["CALLABLE"] = 52] = "CALLABLE";
    Operation[Operation["CLOSURE"] = 53] = "CLOSURE";
    Operation[Operation["CALL_LOCAL"] = 54] = "CALL_LOCAL";
    Operation[Operation["GET_UPVALUE"] = 55] = "GET_UPVALUE";
    Operation[Operation["SET_UPVALUE"] = 56] = "SET_UPVALUE";
    Operation[Operation["CLOSE_UPVALUE"] = 57] = "CLOSE_UPVALUE";
    return Operation;
}({});
const $66bfafebb155a286$export$59894c102379d64a = [
    '',
    'GET_GLOBAL',
    'CALL_GLOBAL',
    'AND',
    'OR',
    'NOT',
    'PLUS',
    'MINUS',
    'MULTIPLY',
    'DIVIDE',
    'MOD',
    'EQ',
    'NOT_EQ',
    'GT',
    'GT_EQ',
    'LT',
    'LT_EQ',
    'LIKE',
    'ILIKE',
    'NOT_LIKE',
    'NOT_ILIKE',
    'IN',
    'NOT_IN',
    'REGEX',
    'NOT_REGEX',
    'IREGEX',
    'NOT_IREGEX',
    'IN_COHORT',
    'NOT_IN_COHORT',
    'TRUE',
    'FALSE',
    'NULL',
    'STRING',
    'INTEGER',
    'FLOAT',
    'POP',
    'GET_LOCAL',
    'SET_LOCAL',
    'RETURN',
    'JUMP',
    'JUMP_IF_FALSE',
    'DECLARE_FN',
    'DICT',
    'ARRAY',
    'TUPLE',
    'GET_PROPERTY',
    'SET_PROPERTY',
    'JUMP_IF_STACK_NOT_NULL',
    'GET_PROPERTY_NULLISH',
    'THROW',
    'TRY',
    'POP_TRY',
    'CALLABLE',
    'CLOSURE',
    'CALL_LOCAL',
    'GET_UPVALUE',
    'SET_UPVALUE',
    'CLOSE_UPVALUE'
];


// This file is generated by common/hogvm/stl/compile.py
const $afd1cc5cb2d921da$export$5477e8cd2355fadb = {
    "arrayCount": [
        [
            "func",
            "arr"
        ],
        [
            33,
            0,
            36,
            1,
            36,
            3,
            2,
            "values",
            1,
            33,
            1,
            36,
            4,
            2,
            "length",
            1,
            31,
            36,
            6,
            36,
            5,
            16,
            40,
            31,
            36,
            4,
            36,
            5,
            45,
            37,
            7,
            36,
            7,
            36,
            0,
            54,
            1,
            40,
            7,
            33,
            1,
            36,
            2,
            6,
            37,
            2,
            36,
            5,
            33,
            1,
            6,
            37,
            5,
            39,
            -38,
            35,
            35,
            35,
            35,
            35,
            36,
            2,
            38,
            35
        ]
    ],
    "arrayExists": [
        [
            "func",
            "arr"
        ],
        [
            36,
            1,
            36,
            2,
            2,
            "values",
            1,
            33,
            1,
            36,
            3,
            2,
            "length",
            1,
            31,
            36,
            5,
            36,
            4,
            16,
            40,
            26,
            36,
            3,
            36,
            4,
            45,
            37,
            6,
            36,
            6,
            36,
            0,
            54,
            1,
            40,
            2,
            29,
            38,
            36,
            4,
            33,
            1,
            6,
            37,
            4,
            39,
            -33,
            35,
            35,
            35,
            35,
            35,
            30,
            38
        ]
    ],
    "arrayFilter": [
        [
            "func",
            "arr"
        ],
        [
            43,
            0,
            36,
            1,
            36,
            3,
            2,
            "values",
            1,
            33,
            1,
            36,
            4,
            2,
            "length",
            1,
            31,
            36,
            6,
            36,
            5,
            16,
            40,
            33,
            36,
            4,
            36,
            5,
            45,
            37,
            7,
            36,
            7,
            36,
            0,
            54,
            1,
            40,
            9,
            36,
            2,
            36,
            7,
            2,
            "arrayPushBack",
            2,
            37,
            2,
            36,
            5,
            33,
            1,
            6,
            37,
            5,
            39,
            -40,
            35,
            35,
            35,
            35,
            35,
            36,
            2,
            38,
            35
        ]
    ],
    "arrayMap": [
        [
            "func",
            "arr"
        ],
        [
            43,
            0,
            36,
            1,
            36,
            3,
            2,
            "values",
            1,
            33,
            1,
            36,
            4,
            2,
            "length",
            1,
            31,
            36,
            6,
            36,
            5,
            16,
            40,
            29,
            36,
            4,
            36,
            5,
            45,
            37,
            7,
            36,
            2,
            36,
            7,
            36,
            0,
            54,
            1,
            2,
            "arrayPushBack",
            2,
            37,
            2,
            36,
            5,
            33,
            1,
            6,
            37,
            5,
            39,
            -36,
            35,
            35,
            35,
            35,
            35,
            36,
            2,
            38,
            35
        ]
    ],
    "arrayReduce": [
        [
            "func",
            "arr",
            "initial"
        ],
        [
            36,
            2,
            36,
            1,
            36,
            4,
            2,
            "values",
            1,
            33,
            1,
            36,
            5,
            2,
            "length",
            1,
            31,
            36,
            7,
            36,
            6,
            16,
            40,
            26,
            36,
            5,
            36,
            6,
            45,
            37,
            8,
            36,
            3,
            36,
            8,
            36,
            0,
            54,
            2,
            37,
            3,
            36,
            6,
            33,
            1,
            6,
            37,
            6,
            39,
            -33,
            35,
            35,
            35,
            35,
            35,
            36,
            3,
            38,
            35
        ]
    ]
};


var $23fc6ca6b1cb5ed8$exports = {};

$parcel$export($23fc6ca6b1cb5ed8$exports, "STL", () => $23fc6ca6b1cb5ed8$export$ef8a2f3c50755575);
$parcel$export($23fc6ca6b1cb5ed8$exports, "ASYNC_STL", () => $23fc6ca6b1cb5ed8$export$daf23d78d6f53989);


var $ddbbfac842d2b47e$exports = {};

$parcel$export($ddbbfac842d2b47e$exports, "HogVMException", () => $ddbbfac842d2b47e$export$abb9271b33b89c57);
$parcel$export($ddbbfac842d2b47e$exports, "UncaughtHogVMException", () => $ddbbfac842d2b47e$export$21c2d8f6d56a9f14);
$parcel$export($ddbbfac842d2b47e$exports, "like", () => $ddbbfac842d2b47e$export$e94e5ec04a02879c);
$parcel$export($ddbbfac842d2b47e$exports, "getNestedValue", () => $ddbbfac842d2b47e$export$2516322ffbb7f3fb);
$parcel$export($ddbbfac842d2b47e$exports, "setNestedValue", () => $ddbbfac842d2b47e$export$c52c7e952af52ee2);
$parcel$export($ddbbfac842d2b47e$exports, "convertJSToHog", () => $ddbbfac842d2b47e$export$f0c387fc4f006d51);
$parcel$export($ddbbfac842d2b47e$exports, "convertHogToJS", () => $ddbbfac842d2b47e$export$8353e27c009c56d3);
$parcel$export($ddbbfac842d2b47e$exports, "calculateCost", () => $ddbbfac842d2b47e$export$ccac9139013839fb);
$parcel$export($ddbbfac842d2b47e$exports, "unifyComparisonTypes", () => $ddbbfac842d2b47e$export$13d90b9b2a99ed13);


function $4d6f6365495b63e6$export$96c0bff854cee350(year, month, day) {
    return {
        __hogDate__: true,
        year: year,
        month: month,
        day: day
    };
}
function $4d6f6365495b63e6$export$3f140f12059184aa(timestamp, zone) {
    if ((0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(timestamp)) {
        const dateTime = (0, $62dAA$DateTime).fromObject({
            year: timestamp.year,
            month: timestamp.month,
            day: timestamp.day
        }, {
            zone: zone || 'UTC'
        });
        return {
            __hogDateTime__: true,
            dt: dateTime.toSeconds(),
            zone: dateTime.zoneName || 'UTC'
        };
    }
    return {
        __hogDateTime__: true,
        dt: timestamp,
        zone: zone || 'UTC'
    };
}
function $4d6f6365495b63e6$export$461939dd4422153(zone) {
    return $4d6f6365495b63e6$export$3f140f12059184aa(Date.now() / 1000, zone);
}
function $4d6f6365495b63e6$export$89d19b307eaa5b00(input, zone) {
    if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(input)) return input.dt;
    if ((0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(input)) return $4d6f6365495b63e6$export$3f140f12059184aa(input).dt;
    return (0, $62dAA$DateTime).fromISO(input, {
        zone: zone || 'UTC'
    }).toSeconds();
}
function $4d6f6365495b63e6$export$2eae39828437ef9(input) {
    return $4d6f6365495b63e6$export$3f140f12059184aa(input);
}
function $4d6f6365495b63e6$export$3c767e1cce0f2443(input, zone) {
    return $4d6f6365495b63e6$export$89d19b307eaa5b00(input, zone) * 1000;
}
function $4d6f6365495b63e6$export$477f0894d0f48f23(input) {
    return $4d6f6365495b63e6$export$3f140f12059184aa(input / 1000);
}
function $4d6f6365495b63e6$export$538b00033cc11c75(input, zone) {
    if (!(0, $27b25c9e0700770a$export$36cb9320e67ccd70)(input)) throw new Error('Expected a DateTime');
    return {
        ...input,
        zone: zone
    };
}
function $4d6f6365495b63e6$export$e67a095c620b86fe(input) {
    const dt = typeof input === 'number' ? (0, $62dAA$DateTime).fromSeconds(input) : (0, $62dAA$DateTime).fromISO(input);
    return {
        __hogDate__: true,
        year: dt.year,
        month: dt.month,
        day: dt.day
    };
}
function $4d6f6365495b63e6$export$c2dea5c02f48568d(input, zone) {
    const dt = typeof input === 'number' ? input : (0, $62dAA$DateTime).fromISO(input, {
        zone: zone || 'UTC'
    }).toSeconds();
    return {
        __hogDateTime__: true,
        dt: dt,
        zone: zone || 'UTC'
    };
}
/** Convert from ClickHouse format string to Luxon format string */ const $4d6f6365495b63e6$var$tokenTranslations = {
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
    '%': '%'
};
function $4d6f6365495b63e6$export$8b492ed8828f789c(input, format, zone) {
    if (!(0, $27b25c9e0700770a$export$36cb9320e67ccd70)(input)) throw new Error('Expected a DateTime');
    if (!format) throw new Error('formatDateTime requires at least 2 arguments');
    let formatString = '';
    let acc = '';
    for(let i = 0; i < format.length; i++)if (format[i] === '%') {
        if (acc.length > 0) {
            formatString += `'${acc}'`;
            acc = '';
        }
        i += 1;
        if (i < format.length && $4d6f6365495b63e6$var$tokenTranslations[format[i]]) formatString += $4d6f6365495b63e6$var$tokenTranslations[format[i]];
    } else acc += format[i];
    if (acc.length > 0) formatString += `'${acc}'`;
    return (0, $62dAA$DateTime).fromSeconds(input.dt, {
        zone: zone || input.zone
    }).toFormat(formatString);
}


class $ddbbfac842d2b47e$export$abb9271b33b89c57 extends Error {
    constructor(message){
        super(message);
        this.name = 'HogVMException';
    }
}
class $ddbbfac842d2b47e$export$21c2d8f6d56a9f14 extends $ddbbfac842d2b47e$export$abb9271b33b89c57 {
    constructor(type, message, payload = null){
        super(message);
        this.name = 'UncaughtHogVMException';
        this.type = type;
        this.payload = payload;
    }
    toString() {
        const msg = this.message.replaceAll("'", "\\'");
        return `${this.type}('${msg}')`;
    }
}
/** Fixed cost per object in memory */ const $ddbbfac842d2b47e$var$COST_PER_UNIT = 8;
function $ddbbfac842d2b47e$export$e94e5ec04a02879c(string, pattern, caseInsensitive = false, match) {
    pattern = String(pattern).replaceAll(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replaceAll('%', '.*').replaceAll('_', '.');
    if (match) return match((caseInsensitive ? '(?i)' : '') + pattern, string);
    return new RegExp(pattern, caseInsensitive ? 'i' : undefined).test(string);
}
function $ddbbfac842d2b47e$export$2516322ffbb7f3fb(obj, chain, nullish = false) {
    if (typeof obj === 'object' && obj !== null) {
        for (const key of chain){
            if (nullish && obj === null) return null;
            // if obj is a map
            if (obj instanceof Map) obj = obj.get(key) ?? null;
            else if (typeof key === 'number') {
                if (key == 0) throw new Error(`Script arrays start from index 1`);
                else if (key > 0) obj = obj[key - 1] ?? null;
                else obj = obj[obj.length + key] ?? null;
            } else obj = obj[key] ?? null;
        }
        return obj;
    }
    return null;
}
function $ddbbfac842d2b47e$export$c52c7e952af52ee2(obj, chain, value) {
    if (typeof obj !== 'object' || obj === null) throw new Error(`Can not set ${chain} on non-object: ${typeof obj}`);
    for(let i = 0; i < chain.length - 1; i++){
        const key = chain[i];
        if (obj instanceof Map) obj = obj.get(key) ?? null;
        else if (Array.isArray(obj) && typeof key === 'number') {
            if (key <= 0) throw new Error(`Script arrays start from index 1`);
            obj = obj[key - 1];
        } else throw new Error(`Can not get ${chain} on element of type ${typeof obj}`);
    }
    const lastKey = chain[chain.length - 1];
    if (obj instanceof Map) obj.set(lastKey, value);
    else if (Array.isArray(obj) && typeof lastKey === 'number') {
        if (lastKey <= 0) throw new Error(`Script arrays start from index 1`);
        obj[lastKey - 1] = value;
    } else throw new Error(`Can not set ${chain} on element of type ${typeof obj}`);
}
function $ddbbfac842d2b47e$export$f0c387fc4f006d51(x, found) {
    if (!found) found = new Map();
    if (found.has(x)) return found.get(x);
    if (Array.isArray(x)) {
        const obj = [];
        found.set(x, obj);
        x.forEach((v)=>obj.push($ddbbfac842d2b47e$export$f0c387fc4f006d51(v, found)));
        found.delete(x);
        return obj;
    } else if (typeof x === 'object' && x !== null) {
        if (x.__hogDateTime__) return (0, $4d6f6365495b63e6$export$3f140f12059184aa)(x.dt, x.zone);
        else if (x.__hogDate__) return (0, $4d6f6365495b63e6$export$96c0bff854cee350)(x.year, x.month, x.day);
        else if (x.__hogClosure__ || x.__hogCallable__) return x;
        const map = new Map();
        found.set(x, map);
        for(const key in x)map.set(key, $ddbbfac842d2b47e$export$f0c387fc4f006d51(x[key], found));
        found.delete(x);
        return map;
    }
    return x;
}
function $ddbbfac842d2b47e$export$8353e27c009c56d3(x, found) {
    if (!found) found = new Map();
    if (found.has(x)) return found.get(x);
    if (x instanceof Map) {
        const obj = {};
        found.set(x, obj);
        x.forEach((value, key)=>{
            obj[key] = $ddbbfac842d2b47e$export$8353e27c009c56d3(value, found);
        });
        found.delete(x);
        return obj;
    } else if (typeof x === 'object' && Array.isArray(x)) {
        const obj = [];
        found.set(x, obj);
        x.forEach((v)=>obj.push($ddbbfac842d2b47e$export$8353e27c009c56d3(v, found)));
        found.delete(x);
        return obj;
    } else if (typeof x === 'object' && x !== null) {
        if (x.__hogDateTime__ || x.__hogDate__ || x.__hogClosure__ || x.__hogCallable__) return x;
        const obj = {};
        found.set(x, obj);
        for(const key in x)obj[key] = $ddbbfac842d2b47e$export$8353e27c009c56d3(x[key], found);
        found.delete(x);
        return obj;
    }
    return x;
}
function $ddbbfac842d2b47e$export$ccac9139013839fb(object, marked) {
    if (!marked) marked = new Set();
    if (typeof object === 'object' && object !== null) {
        if (marked.has(object)) return $ddbbfac842d2b47e$var$COST_PER_UNIT;
        marked.add(object);
        try {
            if (object instanceof Map) return $ddbbfac842d2b47e$var$COST_PER_UNIT + Array.from(object.keys()).reduce((acc, key)=>acc + $ddbbfac842d2b47e$export$ccac9139013839fb(key, marked) + $ddbbfac842d2b47e$export$ccac9139013839fb(object.get(key), marked), 0);
            else if (Array.isArray(object)) return $ddbbfac842d2b47e$var$COST_PER_UNIT + object.reduce((acc, val)=>acc + $ddbbfac842d2b47e$export$ccac9139013839fb(val, marked), 0);
            return $ddbbfac842d2b47e$var$COST_PER_UNIT + Object.keys(object).reduce((acc, key)=>acc + $ddbbfac842d2b47e$export$ccac9139013839fb(key, marked) + $ddbbfac842d2b47e$export$ccac9139013839fb(object[key], marked), 0);
        } finally{
            marked.delete(object);
        }
    } else if (typeof object === 'string') return $ddbbfac842d2b47e$var$COST_PER_UNIT + object.length;
    return $ddbbfac842d2b47e$var$COST_PER_UNIT;
}
function $ddbbfac842d2b47e$export$13d90b9b2a99ed13(left, right) {
    if (typeof left === 'number' && typeof right === 'string') return [
        left,
        Number(right)
    ];
    if (typeof left === 'string' && typeof right === 'number') return [
        Number(left),
        right
    ];
    if (typeof left === 'boolean' && typeof right === 'string') return [
        left,
        right === 'true'
    ];
    if (typeof left === 'string' && typeof right === 'boolean') return [
        left === 'true',
        right
    ];
    if (typeof left === 'boolean' && typeof right === 'number') return [
        left ? 1 : 0,
        right
    ];
    if (typeof left === 'number' && typeof right === 'boolean') return [
        left,
        right ? 1 : 0
    ];
    return [
        left,
        right
    ];
}


function $cd98dbf3206987a7$export$bced8d2aada2d1c9(data, encoding = 'hex', options) {
    if (data === null) return null;
    const crypto = options?.external?.crypto;
    if (!crypto) throw new Error('The crypto module is required for "sha256Hex" to work.');
    return crypto.createHash('sha256').update(data).digest(encoding);
}
function $cd98dbf3206987a7$export$a58ec6a60c09ca72(data, encoding = 'hex', options) {
    if (data === null) return null;
    const crypto = options?.external?.crypto;
    if (!crypto) throw new Error('The crypto module is required for "md5Hex" to work.');
    return crypto.createHash('md5').update(data).digest(encoding);
}
function $cd98dbf3206987a7$export$60c7719ba3f4dd3e(data, encoding = 'hex', options) {
    const crypto = options?.external?.crypto;
    if (!crypto) throw new Error('The crypto module is required for "sha256HmacChainHex" to work.');
    if (data.length < 2) throw new Error('Data array must contain at least two elements.');
    let hmac = crypto.createHmac('sha256', data[0]);
    hmac.update(data[1]);
    for(let i = 2; i < data.length; i++){
        hmac = crypto.createHmac('sha256', hmac.digest());
        hmac.update(data[i]);
    }
    return hmac.digest(encoding);
}



var $054a234da6c04610$exports = {};

$parcel$export($054a234da6c04610$exports, "escapeString", () => $054a234da6c04610$export$4148cf4a40af9f34);
$parcel$export($054a234da6c04610$exports, "escapeIdentifier", () => $054a234da6c04610$export$56fe274825607f4a);
$parcel$export($054a234da6c04610$exports, "printHogValue", () => $054a234da6c04610$export$49c4ba04cdb4c4d4);
$parcel$export($054a234da6c04610$exports, "InsightsQLPrinter", () => $054a234da6c04610$export$4c46226ec729a3dc);
$parcel$export($054a234da6c04610$exports, "printHogStringOutput", () => $054a234da6c04610$export$ed243cb9e89db69e);


const $054a234da6c04610$var$escapeCharsMap = {
    '\b': '\\b',
    '\f': '\\f',
    '\r': '\\r',
    '\n': '\\n',
    '\t': '\\t',
    '\0': '\\0',
    '\v': '\\v',
    '\\': '\\\\'
};
const $054a234da6c04610$var$singlequoteEscapeCharsMap = {
    ...$054a234da6c04610$var$escapeCharsMap,
    "'": "\\'"
};
const $054a234da6c04610$var$backquoteEscapeCharsMap = {
    ...$054a234da6c04610$var$escapeCharsMap,
    '`': '\\`'
};
function $054a234da6c04610$export$4148cf4a40af9f34(value) {
    return `'${value.split('').map((c)=>$054a234da6c04610$var$singlequoteEscapeCharsMap[c] || c).join('')}'`;
}
function $054a234da6c04610$export$56fe274825607f4a(identifier) {
    if (typeof identifier === 'number') return identifier.toString();
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(identifier)) return identifier;
    return `\`${identifier.split('').map((c)=>$054a234da6c04610$var$backquoteEscapeCharsMap[c] || c).join('')}\``;
}
function $054a234da6c04610$export$49c4ba04cdb4c4d4(obj, marked) {
    if (!marked) marked = new Set();
    if (typeof obj === 'object' && obj !== null && obj !== undefined) {
        if (marked.has(obj) && !(0, $27b25c9e0700770a$export$36cb9320e67ccd70)(obj) && !(0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(obj) && !(0, $27b25c9e0700770a$export$6a076491ad0da05d)(obj) && !(0, $27b25c9e0700770a$export$2fad4bf1d8756816)(obj) && !(0, $27b25c9e0700770a$export$3bbfc8b03361d8b7)(obj) && !(0, $27b25c9e0700770a$export$c1885639c9f11133)(obj)) return 'null';
        marked.add(obj);
        try {
            if (Array.isArray(obj)) {
                if (obj.__isHogTuple) {
                    if (obj.length < 2) return `tuple(${obj.map((o)=>$054a234da6c04610$export$49c4ba04cdb4c4d4(o, marked)).join(', ')})`;
                    return `(${obj.map((o)=>$054a234da6c04610$export$49c4ba04cdb4c4d4(o, marked)).join(', ')})`;
                }
                return `[${obj.map((o)=>$054a234da6c04610$export$49c4ba04cdb4c4d4(o, marked)).join(', ')}]`;
            }
            if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(obj)) {
                const millis = String(obj.dt);
                return `DateTime(${millis}${millis.includes('.') ? '' : '.0'}, ${$054a234da6c04610$export$4148cf4a40af9f34(obj.zone)})`;
            }
            if ((0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(obj)) return `Date(${obj.year}, ${obj.month}, ${obj.day})`;
            if ((0, $27b25c9e0700770a$export$6a076491ad0da05d)(obj)) return `${String(obj.type)}(${$054a234da6c04610$export$4148cf4a40af9f34(obj.message)}${obj.payload ? `, ${$054a234da6c04610$export$49c4ba04cdb4c4d4(obj.payload, marked)}` : ''})`;
            if ((0, $27b25c9e0700770a$export$2fad4bf1d8756816)(obj)) return $054a234da6c04610$export$49c4ba04cdb4c4d4(obj.callable, marked);
            if ((0, $27b25c9e0700770a$export$3bbfc8b03361d8b7)(obj)) return `fn<${$054a234da6c04610$export$56fe274825607f4a(obj.name ?? 'lambda')}(${$054a234da6c04610$export$49c4ba04cdb4c4d4(obj.argCount)})>`;
            if ((0, $27b25c9e0700770a$export$c1885639c9f11133)(obj)) return `sql(${new $054a234da6c04610$export$4c46226ec729a3dc(false, marked).print(obj)})`;
            if (obj instanceof Map) return `{${Array.from(obj.entries()).map(([key, value])=>`${$054a234da6c04610$export$49c4ba04cdb4c4d4(key, marked)}: ${$054a234da6c04610$export$49c4ba04cdb4c4d4(value, marked)}`).join(', ')}}`;
            return `{${Object.entries(obj).map(([key, value])=>`${$054a234da6c04610$export$49c4ba04cdb4c4d4(key, marked)}: ${$054a234da6c04610$export$49c4ba04cdb4c4d4(value, marked)}`).join(', ')}}`;
        } finally{
            marked.delete(obj);
        }
    } else if (typeof obj === 'boolean') return obj ? 'true' : 'false';
    else if (obj === null || obj === undefined) return 'null';
    else if (typeof obj === 'string') return $054a234da6c04610$export$4148cf4a40af9f34(obj);
    return obj.toString();
}
function $054a234da6c04610$export$ed243cb9e89db69e(obj) {
    if (typeof obj === 'string') return obj;
    return $054a234da6c04610$export$49c4ba04cdb4c4d4(obj);
}
class $054a234da6c04610$export$4c46226ec729a3dc {
    constructor(pretty = false, marked){
        this.stack = [];
        this.indentLevel = -1;
        this.tabSize = 4;
        this.pretty = pretty;
        this.marked = marked || new Set();
    }
    indent(extra = 0) {
        return ' '.repeat(this.tabSize * (this.indentLevel + extra));
    }
    print(node) {
        return this.visit(node);
    }
    visit(node) {
        if (!node) return '';
        if (!(node instanceof Map)) {
            if ((0, $27b25c9e0700770a$export$c1885639c9f11133)(node)) node = (0, $ddbbfac842d2b47e$export$f0c387fc4f006d51)(node);
            else return this.escapeValue(node);
        }
        this.stack.push(node);
        this.indentLevel += 1;
        let result;
        const nodeType = node?.get('__hx_ast');
        if (!nodeType) throw new Error('Node type is missing or undefined.');
        switch(nodeType){
            case 'SelectQuery':
                result = this.visitSelectQuery(node);
                break;
            case 'SelectSetQuery':
                result = this.visitSelectSetQuery(node);
                break;
            case 'Call':
                result = this.visitCall(node);
                break;
            case 'Constant':
                result = this.visitConstant(node);
                break;
            case 'Field':
                result = this.visitField(node);
                break;
            case 'Alias':
                result = this.visitAlias(node);
                break;
            case 'And':
                result = this.visitAnd(node);
                break;
            case 'Or':
                result = this.visitOr(node);
                break;
            case 'Not':
                result = this.visitNot(node);
                break;
            case 'CompareOperation':
                result = this.visitCompareOperation(node);
                break;
            case 'Tuple':
                result = this.visitTuple(node);
                break;
            case 'Array':
                result = this.visitArray(node);
                break;
            case 'Lambda':
                result = this.visitLambda(node);
                break;
            case 'OrderExpr':
                result = this.visitOrderExpr(node);
                break;
            case 'ArithmeticOperation':
                result = this.visitArithmeticOperation(node);
                break;
            case 'Asterisk':
                result = this.visitAsterisk(node);
                break;
            case 'JoinExpr':
                result = this.visitJoinExpr(node);
                break;
            case 'JoinConstraint':
                result = this.visitJoinConstraint(node);
                break;
            case 'WindowExpr':
                result = this.visitWindowExpr(node);
                break;
            case 'WindowFunction':
                result = this.visitWindowFunction(node);
                break;
            case 'WindowFrameExpr':
                result = this.visitWindowFrameExpr(node);
                break;
            case 'SampleExpr':
                result = this.visitSampleExpr(node);
                break;
            case 'RatioExpr':
                result = this.visitRatioExpr(node);
                break;
            case 'InsightsQLXTag':
                result = this.visitInsightsQLXTag(node);
                break;
            default:
                throw new Error(`Unknown AST node type: ${nodeType}`);
        }
        this.indentLevel -= 1;
        this.stack.pop();
        return result;
    }
    visitSelectQuery(node) {
        if (!node) return '';
        const isTopLevelQuery = this.stack.length <= 1;
        const selectNodes = node.get('select');
        const selectExpressions = selectNodes ? selectNodes.map((expr)=>this.visit(expr)) : [];
        const space = this.pretty ? `\n${this.indent(1)}` : ' ';
        const comma = this.pretty ? `,\n${this.indent(1)}` : ', ';
        const clauses = [
            `SELECT${node.get('distinct') ? ' DISTINCT' : ''}${space}${selectExpressions.join(comma)}`
        ];
        if (node.has('select_from')) {
            const fromExpr = this.visitJoinExpression(node.get('select_from'));
            if (fromExpr) clauses.push(`FROM${space}${fromExpr}`);
        }
        if (node.has('prewhere')) {
            const prewhereExpr = this.visit(node.get('prewhere'));
            if (prewhereExpr) clauses.push(`PREWHERE${space}${prewhereExpr}`);
        }
        if (node.has('where')) {
            const whereExpr = this.visit(node.get('where'));
            if (whereExpr) clauses.push(`WHERE${space}${whereExpr}`);
        }
        if (node.has('group_by') && Array.isArray(node.get('group_by')) && node.get('group_by').length > 0) {
            const groupByExpressions = node.get('group_by').map((expr)=>this.visit(expr));
            clauses.push(`GROUP BY${space}${groupByExpressions.join(comma)}`);
        }
        if (node.has('having')) {
            const havingExpr = this.visit(node.get('having'));
            if (havingExpr) clauses.push(`HAVING${space}${havingExpr}`);
        }
        if (node.has('order_by') && Array.isArray(node.get('order_by')) && node.get('order_by').length > 0) {
            const orderByExpressions = node.get('order_by').map((expr)=>this.visit(expr));
            clauses.push(`ORDER BY${space}${orderByExpressions.join(comma)}`);
        }
        if (node.has('limit')) {
            const limitExpr = this.visit(node.get('limit'));
            if (limitExpr) clauses.push(`LIMIT ${limitExpr}`);
            if (node.get('limit_with_ties')) clauses.push('WITH TIES');
            if (node.has('offset')) {
                const offsetExpr = this.visit(node.get('offset'));
                if (offsetExpr) clauses.push(`OFFSET ${offsetExpr}`);
            }
        }
        if (node.has('window_exprs')) {
            const windowExprs = node.get('window_exprs');
            if (windowExprs) {
                const windowExpressions = Array.from(windowExprs.entries()).map(([name, expr])=>`${$054a234da6c04610$export$56fe274825607f4a(name)} AS (${this.visit(expr)})`).join(comma);
                if (windowExpressions) clauses.push(`WINDOW${space}${windowExpressions}`);
            }
        }
        let response = this.pretty ? clauses.map((clause)=>`${this.indent()}${clause}`).join('\n') : clauses.join(' ');
        if (!isTopLevelQuery) response = `(${response})`;
        return response;
    }
    visitSelectSetQuery(node) {
        if (!node) return '';
        this.indentLevel -= 1;
        const initialSelectQuery = node.get('initial_select_query');
        let result = this.visit(initialSelectQuery);
        if (this.pretty) result = result.trim();
        const subsequentQueries = node.get('subsequent_select_queries');
        if (subsequentQueries) for (const expr of subsequentQueries){
            const query = this.visit(expr.select_query);
            const trimmedQuery = this.pretty ? query.trim() : query;
            if (expr.set_operator) {
                if (this.pretty) result += `\n${this.indent(1)}${expr.set_operator}\n${this.indent(1)}`;
                else result += ` ${expr.set_operator} `;
            }
            result += trimmedQuery;
        }
        this.indentLevel += 1;
        if (this.stack.length > 1) return `(${result.trim()})`;
        return result;
    }
    // Helper method to handle join expressions in the FROM clause
    visitJoinExpression(node) {
        if (!node) return '';
        const nodeType = node.get('__hx_ast');
        if (nodeType === 'JoinExpr') return this.visitJoinExpr(node);
        // If it's not a JoinExpr, treat it as a regular table or subquery
        return this.visit(node);
    }
    visitJoinExpr(node) {
        if (!node) return '';
        const joinParts = [];
        // Handle the initial table or subquery
        const initialTable = this.visit(node.get('table'));
        // Add alias if present
        if (node.has('alias') && node.get('alias') !== initialTable) joinParts.push(`${initialTable} AS ${$054a234da6c04610$export$56fe274825607f4a(node.get('alias'))}`);
        else joinParts.push(initialTable);
        // Process the chain of joins via next_join
        let currentJoin = node.get('next_join');
        while(currentJoin){
            const joinType = currentJoin.get('join_type') || 'JOIN';
            const table = this.visit(currentJoin.get('table'));
            const constraint = currentJoin.get('constraint');
            const constraintClause = constraint ? `${constraint.get('constraint_type')} ${this.visit(constraint)}` : '';
            // Add alias if present
            let tableWithAlias = table;
            if (currentJoin.has('alias') && currentJoin.get('alias') !== table) tableWithAlias = `${table} AS ${$054a234da6c04610$export$56fe274825607f4a(currentJoin.get('alias'))}`;
            joinParts.push(`${joinType} ${tableWithAlias} ${constraintClause}`.trim());
            currentJoin = currentJoin.get('next_join');
        }
        return joinParts.join(' ');
    }
    visitJoinConstraint(node) {
        if (!node) return '';
        return this.visit(node.get('expr'));
    }
    visitCall(node) {
        if (!node) return '';
        const name = node.get('name');
        const args = node.get('args')?.map((arg)=>this.visit(arg)) || [];
        return `${name}(${args.join(', ')})`;
    }
    visitConstant(node) {
        if (!node) return '';
        const value = node.get('value');
        return this.escapeValue(value);
    }
    visitField(node) {
        if (!node) return '';
        const chain = node.get('chain');
        if (chain.length === 1 && chain[0] === '*') return '*';
        return chain.map((identifier)=>this.escapeIdentifierOrIndex(identifier)).join('.');
    }
    visitAlias(node) {
        if (!node) return '';
        if (node.get('hidden')) return this.visit(node.get('expr'));
        let expr = node.get('expr');
        while(expr && expr instanceof Map && expr.get('__hx_ast') === 'Alias' && expr.get('hidden'))expr = expr.get('expr');
        const inside = this.visit(expr);
        const alias = $054a234da6c04610$export$56fe274825607f4a(node.get('alias'));
        return `${inside} AS ${alias}`;
    }
    visitAnd(node) {
        if (!node) return '';
        const exprs = node.get('exprs');
        if (!exprs || exprs.length === 0) return '';
        if (exprs.length === 1) return this.visit(exprs[0]);
        const expressions = exprs.map((expr)=>this.visit(expr));
        return `and(${expressions.join(', ')})`;
    }
    visitOr(node) {
        if (!node) return '';
        const exprs = node.get('exprs');
        if (!exprs || exprs.length === 0) return '';
        if (exprs.length === 1) return this.visit(exprs[0]);
        const expressions = exprs.map((expr)=>this.visit(expr));
        return `or(${expressions.join(', ')})`;
    }
    visitNot(node) {
        if (!node) return '';
        return `not(${this.visit(node.get('expr'))})`;
    }
    visitCompareOperation(node) {
        if (!node) return '';
        const left = this.visit(node.get('left'));
        const right = this.visit(node.get('right'));
        const op = node.get('op');
        const opMap = {
            '==': 'equals',
            '!=': 'notEquals',
            '<': 'less',
            '>': 'greater',
            '<=': 'lessOrEquals',
            '>=': 'greaterOrEquals',
            in: 'in',
            'not in': 'notIn',
            like: 'like',
            'not like': 'notLike',
            ilike: 'ilike',
            'not ilike': 'notILike',
            '=~': 'match',
            '!~': 'match',
            '=~*': 'match',
            '!~*': 'match'
        };
        const functionName = opMap[op] || op;
        if (op === '!~*') return `not(${functionName}(${left}, concat('(?i)', ${right})))`;
        if (op === '=~*') return `${functionName}(${left}, concat('(?i)', ${right}))`;
        if (op === '!~') return `not(${functionName}(${left}, ${right}))`;
        return `${functionName}(${left}, ${right})`;
    }
    visitTuple(node) {
        if (!node) return '';
        const exprs = node.get('exprs');
        if (!exprs) return '';
        const expressions = exprs.map((expr)=>this.visit(expr));
        return `tuple(${expressions.join(', ')})`;
    }
    visitArray(node) {
        if (!node) return '';
        const exprs = node.get('exprs');
        if (!exprs) return '';
        const expressions = exprs.map((expr)=>this.visit(expr));
        return `[${expressions.join(', ')}]`;
    }
    visitLambda(node) {
        if (!node) return '';
        const args = node.get('args');
        if (!args || args.length === 0) throw new Error('Lambdas require at least one argument');
        const escapedArgs = args.map((arg)=>$054a234da6c04610$export$56fe274825607f4a(arg));
        const argList = escapedArgs.length === 1 ? escapedArgs[0] : `(${escapedArgs.join(', ')})`;
        return `${argList} -> ${this.visit(node.get('expr'))}`;
    }
    visitOrderExpr(node) {
        if (!node) return '';
        return `${this.visit(node.get('expr'))} ${node.get('order')}`;
    }
    visitArithmeticOperation(node) {
        if (!node) return '';
        const left = this.visit(node.get('left'));
        const right = this.visit(node.get('right'));
        const op = node.get('op');
        switch(op){
            case '+':
                return `plus(${left}, ${right})`;
            case '-':
                return `minus(${left}, ${right})`;
            case '*':
                return `multiply(${left}, ${right})`;
            case '/':
                return `divide(${left}, ${right})`;
            case '%':
                return `modulo(${left}, ${right})`;
            default:
                throw new Error(`Unknown ArithmeticOperation operator: ${op}`);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    visitAsterisk(_) {
        return '*';
    }
    visitWindowExpr(node) {
        if (!node) return '';
        const parts = [];
        if (node.has('partition_by') && Array.isArray(node.get('partition_by')) && node.get('partition_by').length > 0) {
            const partitions = node.get('partition_by').map((expr)=>this.visit(expr)).join(', ');
            parts.push(`PARTITION BY ${partitions}`);
        }
        if (node.has('order_by') && Array.isArray(node.get('order_by')) && node.get('order_by').length > 0) {
            const orders = node.get('order_by').map((expr)=>this.visit(expr)).join(', ');
            parts.push(`ORDER BY ${orders}`);
        }
        if (node.has('frame_method')) {
            const frameMethod = node.get('frame_method');
            if (node.has('frame_start') && node.has('frame_end')) parts.push(`${frameMethod} BETWEEN ${this.visitWindowFrameExpr(node.get('frame_start'))} AND ${this.visitWindowFrameExpr(node.get('frame_end'))}`);
            else if (node.has('frame_start')) parts.push(`${frameMethod} ${this.visitWindowFrameExpr(node.get('frame_start'))}`);
        }
        return parts.join(' ');
    }
    visitWindowFunction(node) {
        if (!node) return '';
        const name = node.get('name');
        const exprs = node.has('exprs') ? node.get('exprs').map((expr)=>this.visit(expr)).join(', ') : '';
        const args = node.has('args') ? `(${node.get('args').map((arg)=>this.visit(arg)).join(', ')})` : '';
        let over = '';
        if (node.has('over_expr')) over = `(${this.visit(node.get('over_expr'))})`;
        else if (node.has('over_identifier')) over = $054a234da6c04610$export$56fe274825607f4a(node.get('over_identifier'));
        else over = '()';
        return `${name}(${exprs})${args} OVER ${over}`;
    }
    visitWindowFrameExpr(node) {
        if (!node) return '';
        const frameType = node.get('frame_type');
        const frameValue = node.has('frame_value') ? node.get('frame_value').toString() : 'UNBOUNDED';
        return `${frameValue} ${frameType}`;
    }
    visitSampleExpr(node) {
        if (!node) return '';
        const sampleValue = this.visitRatioExpr(node.get('sample_value'));
        const offsetClause = node.has('offset_value') ? ` OFFSET ${this.visitRatioExpr(node.get('offset_value'))}` : '';
        return `SAMPLE ${sampleValue}${offsetClause}`;
    }
    visitInsightsQLXTag(node) {
        if (!node) return '';
        const tagName = node.get('kind');
        const args = node.get('attributes') || [];
        const argsString = args.length > 0 ? ` ${args.map((a)=>this.visitInsightsQLXAttribute(a)).join(' ')}` : '';
        return `<${tagName}${argsString} />`;
    }
    visitInsightsQLXAttribute(node) {
        if (!node) return '';
        const name = node.get('name');
        const value = this.visit(node.get('value'));
        if (typeof node.get('value') === 'string') return `${$054a234da6c04610$export$56fe274825607f4a(name)}=${value}`;
        return `${$054a234da6c04610$export$56fe274825607f4a(name)}={${value}}`;
    }
    visitRatioExpr(node) {
        if (!node) return '';
        if (node.has('right')) return `${this.visit(node.get('left'))}/${this.visit(node.get('right'))}`;
        return this.visit(node.get('left'));
    }
    escapeIdentifierOrIndex(name) {
        if (typeof name === 'number' && /^\d+$/.test(name.toString())) return name.toString();
        return $054a234da6c04610$export$56fe274825607f4a(name.toString());
    }
    escapeValue(value) {
        return $054a234da6c04610$export$49c4ba04cdb4c4d4(value, this.marked);
    }
}


function $081f56eebceb920b$export$d37f750fa547bf8b(address, prefix) {
    try {
        if (!address || !prefix) return false;
        const [net, mask] = prefix.split('/');
        if (!net || !mask) return false;
        const cidr = +mask;
        if (isNaN(cidr) || cidr < 0) return false;
        const v4 = address.includes('.') && net.includes('.');
        const v6 = !v4 && address.includes(':') && net.includes(':');
        if (!v4 && !v6) return false;
        if (v4 && cidr > 32 || v6 && cidr > 128) return false;
        const aBytes = $081f56eebceb920b$var$toBytes(address, v4);
        const nBytes = $081f56eebceb920b$var$toBytes(net, v4);
        if (!aBytes || !nBytes) return false;
        const fullBytes = cidr >> 3;
        for(let i = 0; i < fullBytes; i++)if (aBytes[i] !== nBytes[i]) return false;
        const bits = cidr & 7;
        if (bits && fullBytes < aBytes.length) {
            const m = 0xff << 8 - bits;
            if ((aBytes[fullBytes] & m) !== (nBytes[fullBytes] & m)) return false;
        }
        return true;
    } catch  {
        return false;
    }
}
function $081f56eebceb920b$var$toBytes(ip, isV4) {
    if (isV4) {
        const p = ip.split('.');
        if (p.length !== 4) return null;
        const b = new Uint8Array(4);
        for(let i = 0; i < 4; i++){
            const n = +p[i];
            if (isNaN(n) || n < 0 || n > 255 || p[i] !== n.toString()) return null;
            b[i] = n;
        }
        return b;
    }
    const b = new Uint8Array(16);
    let s;
    if (ip.includes('::')) {
        if ((ip.match(/::/g) || []).length > 1) return null;
        const [pre, post] = ip.split('::');
        const preSeg = pre ? pre.split(':') : [];
        const postSeg = post ? post.split(':') : [];
        if (preSeg.length + postSeg.length > 7) return null;
        s = [
            ...preSeg,
            ...Array(8 - preSeg.length - postSeg.length).fill('0'),
            ...postSeg
        ];
    } else {
        s = ip.split(':');
        if (s.length !== 8) return null;
    }
    for(let i = 0; i < 8; i++){
        if (!s[i] && s[i] !== '0') return null;
        const v = parseInt(s[i], 16);
        if (isNaN(v) || v < 0 || v > 0xffff) return null;
        b[i * 2] = v >> 8;
        b[i * 2 + 1] = v & 0xff;
    }
    return b;
}



var $23fc6ca6b1cb5ed8$require$Buffer = $62dAA$Buffer;
// TODO: this file should be generated from or mergred with insights/insightsql/compiler/javascript_stl.py
function $23fc6ca6b1cb5ed8$var$STLToString(args) {
    if ((0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(args[0])) {
        const month = args[0].month;
        const day = args[0].day;
        return `${args[0].year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    }
    if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(args[0])) return (0, $62dAA$DateTime).fromSeconds(args[0].dt, {
        zone: args[0].zone
    }).toISO();
    return (0, $054a234da6c04610$export$ed243cb9e89db69e)(args[0]);
}
// Helper: HogInterval
// function isHogInterval(obj: any): obj is HogInterval {
//     return obj && obj.__hogInterval__ === true
// }
function $23fc6ca6b1cb5ed8$var$toHogInterval(value, unit) {
    return {
        __hogInterval__: true,
        value: value,
        unit: unit
    };
}
function $23fc6ca6b1cb5ed8$var$applyIntervalToDateTime(base, interval) {
    let dt;
    let zone = 'UTC';
    if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(base)) {
        zone = base.zone;
        dt = (0, $62dAA$DateTime).fromSeconds(base.dt, {
            zone: zone
        });
    } else dt = (0, $62dAA$DateTime).fromObject({
        year: base.year,
        month: base.month,
        day: base.day
    }, {
        zone: zone
    });
    const { value: value, unit: unit } = interval;
    // Expand certain units for uniformity
    let effectiveUnit = unit;
    let effectiveValue = value;
    if (unit === 'week') {
        effectiveUnit = 'day';
        effectiveValue = value * 7;
    } else if (unit === 'year') {
        effectiveUnit = 'month';
        effectiveValue = value * 12;
    }
    // Note: Luxon doesn't have direct month addition that can handle overflow automatically to last day of month,
    // but plus({ months: x }) will shift the date by x months and clamp automatically if needed.
    let newDt;
    switch(effectiveUnit){
        case 'day':
            newDt = dt.plus({
                days: effectiveValue
            });
            break;
        case 'hour':
            newDt = dt.plus({
                hours: effectiveValue
            });
            break;
        case 'minute':
            newDt = dt.plus({
                minutes: effectiveValue
            });
            break;
        case 'second':
            newDt = dt.plus({
                seconds: effectiveValue
            });
            break;
        case 'month':
            newDt = dt.plus({
                months: effectiveValue
            });
            break;
        default:
            throw new Error(`Unsupported interval unit: ${unit}`);
    }
    if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(base)) return {
        __hogDateTime__: true,
        dt: newDt.toSeconds(),
        zone: newDt.zoneName || 'UTC'
    };
    return {
        __hogDate__: true,
        year: newDt.year,
        month: newDt.month,
        day: newDt.day
    };
}
// dateAdd(unit, amount, datetime)
function $23fc6ca6b1cb5ed8$var$dateAddFn([unit, amount, datetime]) {
    return $23fc6ca6b1cb5ed8$var$applyIntervalToDateTime(datetime, $23fc6ca6b1cb5ed8$var$toHogInterval(amount, unit));
}
// dateDiff(unit, start, end)
function $23fc6ca6b1cb5ed8$var$dateDiffFn([unit, startVal, endVal]) {
    function toDT(obj) {
        if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(obj)) return (0, $62dAA$DateTime).fromSeconds(obj.dt, {
            zone: obj.zone
        });
        else if ((0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(obj)) return (0, $62dAA$DateTime).fromObject({
            year: obj.year,
            month: obj.month,
            day: obj.day
        }, {
            zone: 'UTC'
        });
        // try parse ISO string
        return (0, $62dAA$DateTime).fromISO(obj, {
            zone: 'UTC'
        });
    }
    const start = toDT(startVal);
    const end = toDT(endVal);
    const diff = end.diff(start, [
        'years',
        'months',
        'weeks',
        'days',
        'hours',
        'minutes',
        'seconds'
    ]);
    switch(unit){
        case 'day':
            return Math.floor((end.toMillis() - start.toMillis()) / 86400000);
        case 'hour':
            return Math.floor(diff.as('hours'));
        case 'minute':
            return Math.floor(diff.as('minutes'));
        case 'second':
            return Math.floor(diff.as('seconds'));
        case 'week':
            return Math.floor(diff.as('days') / 7);
        case 'month':
            // Month difference approximated by counting month differences:
            return (end.year - start.year) * 12 + (end.month - start.month);
        case 'year':
            return end.year - start.year;
        default:
            throw new Error(`Unsupported unit for dateDiff: ${unit}`);
    }
}
// dateTrunc(unit, datetime)
function $23fc6ca6b1cb5ed8$var$dateTruncFn([unit, val]) {
    if (!(0, $27b25c9e0700770a$export$36cb9320e67ccd70)(val)) throw new Error('Expected a DateTime for dateTrunc');
    const dt = (0, $62dAA$DateTime).fromSeconds(val.dt, {
        zone: val.zone
    });
    let truncated;
    switch(unit){
        case 'year':
            truncated = (0, $62dAA$DateTime).fromObject({
                year: dt.year
            }, {
                zone: dt.zoneName
            });
            break;
        case 'month':
            truncated = (0, $62dAA$DateTime).fromObject({
                year: dt.year,
                month: dt.month
            }, {
                zone: dt.zoneName
            });
            break;
        case 'day':
            truncated = (0, $62dAA$DateTime).fromObject({
                year: dt.year,
                month: dt.month,
                day: dt.day
            }, {
                zone: dt.zoneName
            });
            break;
        case 'hour':
            truncated = (0, $62dAA$DateTime).fromObject({
                year: dt.year,
                month: dt.month,
                day: dt.day,
                hour: dt.hour
            }, {
                zone: dt.zoneName
            });
            break;
        case 'minute':
            truncated = (0, $62dAA$DateTime).fromObject({
                year: dt.year,
                month: dt.month,
                day: dt.day,
                hour: dt.hour,
                minute: dt.minute
            }, {
                zone: dt.zoneName
            });
            break;
        default:
            throw new Error(`Unsupported unit for dateTrunc: ${unit}`);
    }
    return {
        __hogDateTime__: true,
        dt: truncated.toSeconds(),
        zone: truncated.zoneName || 'UTC'
    };
}
function $23fc6ca6b1cb5ed8$var$coalesceFn(args) {
    for (const a of args){
        if (a !== null && a !== undefined) return a;
    }
    return null;
}
function $23fc6ca6b1cb5ed8$var$assumeNotNullFn([val]) {
    if (val === null || val === undefined) throw new Error('Value is null in assumeNotNull');
    return val;
}
function $23fc6ca6b1cb5ed8$var$equalsFn([a, b]) {
    return a === b;
}
function $23fc6ca6b1cb5ed8$var$greaterFn([a, b]) {
    return a > b;
}
function $23fc6ca6b1cb5ed8$var$greaterOrEqualsFn([a, b]) {
    return a >= b;
}
function $23fc6ca6b1cb5ed8$var$lessFn([a, b]) {
    return a < b;
}
function $23fc6ca6b1cb5ed8$var$lessOrEqualsFn([a, b]) {
    return a <= b;
}
function $23fc6ca6b1cb5ed8$var$notEqualsFn([a, b]) {
    return a !== b;
}
function $23fc6ca6b1cb5ed8$var$notFn([a]) {
    return !a;
}
function $23fc6ca6b1cb5ed8$var$andFn(args) {
    return args.every(Boolean);
}
function $23fc6ca6b1cb5ed8$var$orFn(args) {
    return args.some(Boolean);
}
function $23fc6ca6b1cb5ed8$var$ifFn([cond, thenVal, elseVal]) {
    return cond ? thenVal : elseVal;
}
function $23fc6ca6b1cb5ed8$var$inFn([val, arr]) {
    return Array.isArray(arr) || arr && arr.__isHogTuple ? arr.includes(val) : false;
}
function $23fc6ca6b1cb5ed8$var$min2Fn([a, b]) {
    return a < b ? a : b;
}
function $23fc6ca6b1cb5ed8$var$plusFn([a, b]) {
    return a + b;
}
function $23fc6ca6b1cb5ed8$var$minusFn([a, b]) {
    return a - b;
}
function $23fc6ca6b1cb5ed8$var$multiIfFn(args) {
    // multiIf(cond1, val1, cond2, val2, ..., default)
    const last = args[args.length - 1];
    const pairs = args.slice(0, -1);
    for(let i = 0; i < pairs.length; i += 2){
        const cond = pairs[i];
        const val = pairs[i + 1];
        if (cond) return val;
    }
    return last;
}
function $23fc6ca6b1cb5ed8$var$floorFn([a]) {
    return Math.floor(a);
}
// extract(part, datetime)
function $23fc6ca6b1cb5ed8$var$extractFn([part, val]) {
    function toDT(obj) {
        if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(obj)) return (0, $62dAA$DateTime).fromSeconds(obj.dt, {
            zone: obj.zone
        });
        else if ((0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(obj)) return (0, $62dAA$DateTime).fromObject({
            year: obj.year,
            month: obj.month,
            day: obj.day
        }, {
            zone: 'UTC'
        });
        return (0, $62dAA$DateTime).fromISO(obj, {
            zone: 'UTC'
        });
    }
    const dt = toDT(val);
    switch(part){
        case 'year':
            return dt.year;
        case 'month':
            return dt.month;
        case 'day':
            return dt.day;
        case 'hour':
            return dt.hour;
        case 'minute':
            return dt.minute;
        case 'second':
            return dt.second;
        default:
            throw new Error(`Unknown extract part: ${part}`);
    }
}
function $23fc6ca6b1cb5ed8$var$roundFn([a]) {
    return Math.round(a);
}
function $23fc6ca6b1cb5ed8$var$startsWithFn([str, prefix]) {
    return typeof str === 'string' && typeof prefix === 'string' && str.startsWith(prefix);
}
function $23fc6ca6b1cb5ed8$var$substringFn([s, start, optionalLength]) {
    if (typeof s !== 'string') return '';
    const startIdx = start - 1;
    const length = typeof optionalLength === 'number' ? optionalLength : s.length - startIdx;
    if (startIdx < 0 || length < 0) return '';
    const endIdx = startIdx + length;
    return startIdx < s.length ? s.slice(startIdx, endIdx) : '';
}
function $23fc6ca6b1cb5ed8$var$addDaysFn([dateOrDt, days]) {
    return $23fc6ca6b1cb5ed8$var$applyIntervalToDateTime(dateOrDt, $23fc6ca6b1cb5ed8$var$toHogInterval(days, 'day'));
}
function $23fc6ca6b1cb5ed8$var$toIntervalDayFn([val]) {
    return $23fc6ca6b1cb5ed8$var$toHogInterval(val, 'day');
}
function $23fc6ca6b1cb5ed8$var$toIntervalHourFn([val]) {
    return $23fc6ca6b1cb5ed8$var$toHogInterval(val, 'hour');
}
function $23fc6ca6b1cb5ed8$var$toIntervalMinuteFn([val]) {
    return $23fc6ca6b1cb5ed8$var$toHogInterval(val, 'minute');
}
function $23fc6ca6b1cb5ed8$var$toIntervalMonthFn([val]) {
    return $23fc6ca6b1cb5ed8$var$toHogInterval(val, 'month');
}
function $23fc6ca6b1cb5ed8$var$toYearFn([val]) {
    return $23fc6ca6b1cb5ed8$var$extractFn([
        'year',
        val
    ]);
}
function $23fc6ca6b1cb5ed8$var$toMonthFn([val]) {
    return $23fc6ca6b1cb5ed8$var$extractFn([
        'month',
        val
    ]);
}
function $23fc6ca6b1cb5ed8$var$toStartOfDayFn([val]) {
    return $23fc6ca6b1cb5ed8$var$dateTruncFn([
        'day',
        (0, $27b25c9e0700770a$export$36cb9320e67ccd70)(val) ? val : $23fc6ca6b1cb5ed8$var$toDateTimeFromDate(val)
    ]);
}
function $23fc6ca6b1cb5ed8$var$toStartOfHourFn([val]) {
    return $23fc6ca6b1cb5ed8$var$dateTruncFn([
        'hour',
        (0, $27b25c9e0700770a$export$36cb9320e67ccd70)(val) ? val : $23fc6ca6b1cb5ed8$var$toDateTimeFromDate(val)
    ]);
}
function $23fc6ca6b1cb5ed8$var$toStartOfMonthFn([val]) {
    return $23fc6ca6b1cb5ed8$var$dateTruncFn([
        'month',
        (0, $27b25c9e0700770a$export$36cb9320e67ccd70)(val) ? val : $23fc6ca6b1cb5ed8$var$toDateTimeFromDate(val)
    ]);
}
function $23fc6ca6b1cb5ed8$var$toStartOfWeekFn([val]) {
    const dt = (0, $27b25c9e0700770a$export$36cb9320e67ccd70)(val) ? (0, $62dAA$DateTime).fromSeconds(val.dt, {
        zone: val.zone
    }) : (0, $62dAA$DateTime).fromObject({
        year: val.year,
        month: val.month,
        day: val.day
    }, {
        zone: 'UTC'
    });
    const weekday = dt.weekday // Monday=1, Sunday=7
    ;
    const startOfWeek = dt.minus({
        days: weekday - 1
    }).startOf('day');
    return {
        __hogDateTime__: true,
        dt: startOfWeek.toSeconds(),
        zone: startOfWeek.zoneName || 'UTC'
    };
}
function $23fc6ca6b1cb5ed8$var$toYYYYMMFn([val]) {
    const y = $23fc6ca6b1cb5ed8$var$toYearFn([
        val
    ]);
    const m = $23fc6ca6b1cb5ed8$var$toMonthFn([
        val
    ]);
    return y * 100 + m;
}
function $23fc6ca6b1cb5ed8$var$todayFn() {
    const now = (0, $62dAA$DateTime).now().setZone('UTC');
    return {
        __hogDate__: true,
        year: now.year,
        month: now.month,
        day: now.day
    };
}
function $23fc6ca6b1cb5ed8$var$toDateTimeFromDate(date) {
    const dt = (0, $62dAA$DateTime).fromObject({
        year: date.year,
        month: date.month,
        day: date.day
    }, {
        zone: 'UTC'
    });
    return {
        __hogDateTime__: true,
        dt: dt.toSeconds(),
        zone: 'UTC'
    };
}
function $23fc6ca6b1cb5ed8$var$rangeFn(args) {
    if (args.length === 1) return Array.from({
        length: args[0]
    }, (_, i)=>i);
    return Array.from({
        length: args[1] - args[0]
    }, (_, i)=>args[0] + i);
}
// JSON extraction
function $23fc6ca6b1cb5ed8$var$JSONExtractArrayRawFn(args) {
    let [obj, ...path] = args // eslint-disable-line prefer-const
    ;
    try {
        if (typeof obj === 'string') obj = JSON.parse(obj);
    } catch  {
        return null;
    }
    const val = (0, $ddbbfac842d2b47e$export$2516322ffbb7f3fb)(obj, path, true);
    return Array.isArray(val) ? val : null;
}
function $23fc6ca6b1cb5ed8$var$JSONExtractFloatFn(args) {
    let [obj, ...path] = args // eslint-disable-line prefer-const
    ;
    try {
        if (typeof obj === 'string') obj = JSON.parse(obj);
    } catch  {
        return null;
    }
    const val = (0, $ddbbfac842d2b47e$export$2516322ffbb7f3fb)(obj, path, true);
    const f = parseFloat(val);
    return isNaN(f) ? null : f;
}
function $23fc6ca6b1cb5ed8$var$JSONExtractIntFn(args) {
    let [obj, ...path] = args // eslint-disable-line prefer-const
    ;
    try {
        if (typeof obj === 'string') obj = JSON.parse(obj);
    } catch  {
        return null;
    }
    const val = (0, $ddbbfac842d2b47e$export$2516322ffbb7f3fb)(obj, path, true);
    const i = parseInt(val);
    return isNaN(i) ? null : i;
}
function $23fc6ca6b1cb5ed8$var$JSONExtractStringFn(args) {
    let [obj, ...path] = args // eslint-disable-line prefer-const
    ;
    try {
        if (typeof obj === 'string') obj = JSON.parse(obj);
    } catch  {
        return null;
    }
    const val = (0, $ddbbfac842d2b47e$export$2516322ffbb7f3fb)(obj, path, true);
    return val != null ? String(val) : null;
}
const $23fc6ca6b1cb5ed8$export$ef8a2f3c50755575 = {
    concat: {
        fn: (args)=>{
            return args.map((arg)=>arg === null ? '' : $23fc6ca6b1cb5ed8$var$STLToString([
                    arg
                ])).join('');
        },
        description: 'Concatenates multiple values into a single string',
        example: 'concat($1, $2, $3)',
        minArgs: 1,
        maxArgs: undefined
    },
    match: {
        fn: (args, _name, options)=>{
            if (!options?.external?.regex?.match) throw new Error('Set options.external.regex.match for RegEx support');
            return !args[0] || !args[1] ? false : options.external.regex.match(args[1], args[0]);
        },
        description: 'Checks if a string matches a regex pattern',
        example: 'match($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    like: {
        fn: ([str, pattern], _name, options)=>(0, $ddbbfac842d2b47e$export$e94e5ec04a02879c)(str, pattern, false, options?.external?.regex?.match),
        description: 'Checks if a string matches a SQL LIKE pattern',
        example: 'like($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    ilike: {
        fn: ([str, pattern], _name, options)=>(0, $ddbbfac842d2b47e$export$e94e5ec04a02879c)(str, pattern, true, options?.external?.regex?.match),
        description: 'Case-insensitive SQL LIKE pattern matching',
        example: 'ilike($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    notLike: {
        fn: ([str, pattern], _name, options)=>!(0, $ddbbfac842d2b47e$export$e94e5ec04a02879c)(str, pattern, false, options?.external?.regex?.match),
        description: 'Negated SQL LIKE pattern matching',
        example: 'notLike($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    notILike: {
        fn: ([str, pattern], _name, options)=>!(0, $ddbbfac842d2b47e$export$e94e5ec04a02879c)(str, pattern, true, options?.external?.regex?.match),
        description: 'Case-insensitive negated SQL LIKE pattern matching',
        example: 'notILike($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    toString: {
        fn: $23fc6ca6b1cb5ed8$var$STLToString,
        description: 'Converts a value to its string representation',
        example: 'toString($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toUUID: {
        fn: $23fc6ca6b1cb5ed8$var$STLToString,
        description: 'Converts a value to a UUID string',
        example: 'toUUID($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toInt: {
        fn: (args)=>{
            if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(args[0])) return Math.floor(args[0].dt);
            else if ((0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(args[0])) {
                const day = (0, $62dAA$DateTime).fromObject({
                    year: args[0].year,
                    month: args[0].month,
                    day: args[0].day
                });
                const epoch = (0, $62dAA$DateTime).fromObject({
                    year: 1970,
                    month: 1,
                    day: 1
                });
                return Math.floor(day.diff(epoch, 'days').days);
            }
            return !isNaN(parseInt(args[0])) ? parseInt(args[0]) : null;
        },
        description: 'Converts a value to an integer',
        example: 'toInt($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toFloat: {
        fn: (args)=>{
            if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(args[0])) return args[0].dt;
            else if ((0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(args[0])) {
                const day = (0, $62dAA$DateTime).fromObject({
                    year: args[0].year,
                    month: args[0].month,
                    day: args[0].day
                });
                const epoch = (0, $62dAA$DateTime).fromObject({
                    year: 1970,
                    month: 1,
                    day: 1
                });
                return Math.floor(day.diff(epoch, 'days').days);
            }
            return !isNaN(parseFloat(args[0])) ? parseFloat(args[0]) : null;
        },
        description: 'Converts a value to a floating point number',
        example: 'toFloat($1)',
        minArgs: 1,
        maxArgs: 1
    },
    // ifNull is complied into JUMP instructions. Keeping the function here for backwards compatibility
    ifNull: {
        fn: (args)=>{
            return args[0] !== null ? args[0] : args[1];
        },
        description: 'Returns first non-null value',
        example: 'ifNull($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    isNull: {
        fn: (args)=>{
            return args[0] === null || args[0] === undefined;
        },
        description: 'Checks if a value is null or undefined',
        example: 'isNull($1)',
        minArgs: 1,
        maxArgs: 1
    },
    isNotNull: {
        fn: (args)=>{
            return args[0] !== null && args[0] !== undefined;
        },
        description: 'Checks if a value is not null and not undefined',
        example: 'isNotNull($1)',
        minArgs: 1,
        maxArgs: 1
    },
    length: {
        fn: (args)=>{
            return args[0].length;
        },
        description: 'Returns the length of a string or array',
        example: 'length($1)',
        minArgs: 1,
        maxArgs: 1
    },
    empty: {
        fn: (args)=>{
            if (typeof args[0] === 'object') {
                if (Array.isArray(args[0])) return args[0].length === 0;
                else if (args[0] === null) return true;
                else if (args[0] instanceof Map) return args[0].size === 0;
                return Object.keys(args[0]).length === 0;
            } else if (typeof args[0] === 'number' || typeof args[0] === 'boolean') return false;
            return !args[0];
        },
        description: 'Checks if a value is empty (null, undefined, empty string, empty array, empty object, etc.)',
        example: 'empty($1)',
        minArgs: 1,
        maxArgs: 1
    },
    notEmpty: {
        fn: (args)=>{
            return !$23fc6ca6b1cb5ed8$export$ef8a2f3c50755575.empty.fn(args, 'empty');
        },
        description: 'Checks if a value is not empty',
        example: 'notEmpty($1)',
        minArgs: 1,
        maxArgs: 1
    },
    tuple: {
        fn: (args)=>{
            const tuple = args.slice();
            tuple.__isHogTuple = true;
            return tuple;
        },
        description: 'Creates a tuple from multiple values',
        example: 'tuple($1, $2, $3)',
        minArgs: 0,
        maxArgs: undefined
    },
    lower: {
        fn: (args)=>{
            if (args[0] === null || args[0] === undefined) return null;
            return args[0].toLowerCase();
        },
        description: 'Converts a string to lowercase',
        example: 'lower($1)',
        minArgs: 1,
        maxArgs: 1
    },
    upper: {
        fn: (args)=>{
            return args[0].toUpperCase();
        },
        description: 'Converts a string to uppercase',
        example: 'upper($1)',
        minArgs: 1,
        maxArgs: 1
    },
    reverse: {
        fn: (args)=>{
            return args[0].split('').reverse().join('');
        },
        description: 'Reverses a string',
        example: 'reverse($1)',
        minArgs: 1,
        maxArgs: 1
    },
    print: {
        fn: (args)=>{
            // eslint-disable-next-line no-console
            console.log(...args.map((0, $054a234da6c04610$export$ed243cb9e89db69e)));
        },
        description: 'Prints values to console',
        example: 'print($1, $2)',
        minArgs: 0,
        maxArgs: undefined
    },
    jsonParse: {
        fn: (args)=>{
            // Recursively convert objects to maps
            function convert(x) {
                if (Array.isArray(x)) return x.map(convert);
                else if (typeof x === 'object' && x !== null) {
                    // DateTime and other objects will be sanitized and not converted to a map
                    if (x.__hogDateTime__) return (0, $4d6f6365495b63e6$export$3f140f12059184aa)(x.dt, x.zone);
                    else if (x.__hogDate__) return (0, $4d6f6365495b63e6$export$96c0bff854cee350)(x.year, x.month, x.day);
                    else if (x.__hogError__) return (0, $27b25c9e0700770a$export$c2d752b32b9bf15c)(x.type, x.message, x.payload);
                    // All other objects will
                    const map = new Map();
                    for(const key in x)map.set(key, convert(x[key]));
                    return map;
                }
                return x;
            }
            return convert(JSON.parse(args[0]));
        },
        description: 'Parses a JSON string into an object',
        example: 'jsonParse($1)',
        minArgs: 1,
        maxArgs: 1
    },
    jsonStringify: {
        fn: (args)=>{
            // Recursively convert maps to objects
            function convert(x, marked) {
                if (!marked) marked = new Set();
                if (typeof x === 'object' && x !== null) {
                    if (marked.has(x)) return null;
                    marked.add(x);
                    try {
                        if (x instanceof Map) {
                            const obj = {};
                            x.forEach((value, key)=>{
                                obj[convert(key, marked)] = convert(value, marked);
                            });
                            return obj;
                        }
                        if (Array.isArray(x)) return x.map((v)=>convert(v, marked));
                        if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(x) || (0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(x) || (0, $27b25c9e0700770a$export$6a076491ad0da05d)(x) || (0, $27b25c9e0700770a$export$c1885639c9f11133)(x)) return x;
                        if ((0, $27b25c9e0700770a$export$3bbfc8b03361d8b7)(x) || (0, $27b25c9e0700770a$export$2fad4bf1d8756816)(x)) {
                            // we don't support serializing callables
                            const callable = (0, $27b25c9e0700770a$export$3bbfc8b03361d8b7)(x) ? x : x.callable;
                            return `fn<${callable.name || 'lambda'}(${callable.argCount})>`;
                        }
                        const obj = {};
                        for(const key in x)obj[key] = convert(x[key], marked);
                        return obj;
                    } finally{
                        marked.delete(x);
                    }
                }
                return x;
            }
            if (args[1] && typeof args[1] === 'number' && args[1] > 0) return JSON.stringify(convert(args[0]), null, args[1]);
            return JSON.stringify(convert(args[0]));
        },
        description: 'Converts an object to a JSON string',
        example: 'jsonStringify($1)',
        minArgs: 1,
        maxArgs: 1
    },
    JSONHas: {
        fn: ([obj, ...path])=>{
            let current = obj;
            for (const key of path){
                let currentParsed = current;
                if (typeof current === 'string') try {
                    currentParsed = JSON.parse(current);
                } catch  {
                    return false;
                }
                if (currentParsed instanceof Map) {
                    if (!currentParsed.has(key)) return false;
                    current = currentParsed.get(key);
                } else if (typeof currentParsed === 'object') {
                    if (typeof key === 'number') {
                        if (Array.isArray(currentParsed)) {
                            if (key < 0) {
                                if (key < -currentParsed.length) return false;
                                current = currentParsed[currentParsed.length + key];
                            } else if (key === 0) return false;
                            else {
                                if (key > currentParsed.length) return false;
                                current = currentParsed[key - 1];
                            }
                        }
                    } else {
                        if (!(key in currentParsed)) return false;
                        current = currentParsed[key];
                    }
                } else return false;
            }
            return true;
        },
        description: 'Checks if a JSON path exists in an object',
        example: 'JSONHas($1, $2)',
        minArgs: 2
    },
    isValidJSON: {
        fn: ([str])=>{
            try {
                JSON.parse(str);
                return true;
            } catch  {
                return false;
            }
        },
        description: 'Checks if a string is valid JSON',
        example: 'isValidJSON($1)',
        minArgs: 1,
        maxArgs: 1
    },
    JSONLength: {
        fn: ([obj, ...path])=>{
            try {
                if (typeof obj === 'string') obj = JSON.parse(obj);
            } catch  {
                return 0;
            }
            if (typeof obj === 'object') {
                const value = (0, $ddbbfac842d2b47e$export$2516322ffbb7f3fb)(obj, path, true);
                if (Array.isArray(value)) return value.length;
                else if (value instanceof Map) return value.size;
                else if (typeof value === 'object') return Object.keys(value).length;
            }
            return 0;
        },
        description: 'Returns the length of a JSON array or object',
        example: 'JSONLength($1, $2)',
        minArgs: 2
    },
    JSONExtractBool: {
        fn: ([obj, ...path])=>{
            try {
                if (typeof obj === 'string') obj = JSON.parse(obj);
            } catch  {
                return false;
            }
            if (path.length > 0) obj = (0, $ddbbfac842d2b47e$export$2516322ffbb7f3fb)(obj, path, true);
            if (typeof obj === 'boolean') return obj;
            return false;
        },
        description: 'Extracts a boolean value from JSON',
        example: 'JSONExtractBool($1, $2)',
        minArgs: 1
    },
    base64Encode: {
        fn: (args)=>{
            return $23fc6ca6b1cb5ed8$require$Buffer.from(args[0]).toString('base64');
        },
        description: 'Encodes a string to base64',
        example: 'base64Encode($1)',
        minArgs: 1,
        maxArgs: 1
    },
    base64Decode: {
        fn: (args)=>{
            return $23fc6ca6b1cb5ed8$require$Buffer.from(args[0], 'base64').toString();
        },
        description: 'Decodes a base64 string',
        example: 'base64Decode($1)',
        minArgs: 1,
        maxArgs: 1
    },
    tryBase64Decode: {
        fn: (args)=>{
            try {
                return $23fc6ca6b1cb5ed8$require$Buffer.from(args[0], 'base64').toString();
            } catch  {
                return '';
            }
        },
        description: 'Safely decodes a base64 string, returns empty string on error',
        example: 'tryBase64Decode($1)',
        minArgs: 1,
        maxArgs: 1
    },
    encodeURLComponent: {
        fn: (args)=>encodeURIComponent(args[0]),
        description: 'URL-encodes a string',
        example: 'encodeURLComponent($1)',
        minArgs: 1,
        maxArgs: 1
    },
    decodeURLComponent: {
        fn: (args)=>decodeURIComponent(args[0]),
        description: 'URL-decodes a string',
        example: 'decodeURLComponent($1)',
        minArgs: 1,
        maxArgs: 1
    },
    replaceOne: {
        fn: (args)=>{
            return args[0].replace(args[1], args[2]);
        },
        description: 'Replaces first occurrence of a substring',
        example: 'replaceOne($1, $2, $3)',
        minArgs: 3,
        maxArgs: 3
    },
    replaceAll: {
        fn: (args)=>{
            return args[0].replaceAll(args[1], args[2]);
        },
        description: 'Replaces all occurrences of a substring',
        example: 'replaceAll($1, $2, $3)',
        minArgs: 3,
        maxArgs: 3
    },
    position: {
        fn: ([str, elem])=>{
            if (typeof str === 'string') return str.indexOf(String(elem)) + 1;
            return 0;
        },
        description: 'Returns position of substring in string (1-based)',
        example: 'position($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    positionCaseInsensitive: {
        fn: ([str, elem])=>{
            if (typeof str === 'string') return str.toLowerCase().indexOf(String(elem).toLowerCase()) + 1;
            return 0;
        },
        description: 'Case-insensitive substring position (1-based)',
        example: 'positionCaseInsensitive($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    trim: {
        fn: ([str, char])=>{
            if (char === null || char === undefined) char = ' ';
            if (char.length !== 1) return '';
            let start = 0;
            while(str[start] === char)start++;
            let end = str.length;
            while(str[end - 1] === char)end--;
            if (start >= end) return '';
            return str.slice(start, end);
        },
        description: 'Removes leading and trailing characters',
        example: 'trim($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    trimLeft: {
        fn: ([str, char])=>{
            if (char === null || char === undefined) char = ' ';
            if (char.length !== 1) return '';
            let start = 0;
            while(str[start] === char)start++;
            return str.slice(start);
        },
        description: 'Removes leading characters',
        example: 'trimLeft($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    trimRight: {
        fn: ([str, char])=>{
            if (char === null || char === undefined) char = ' ';
            if (char.length !== 1) return '';
            let end = str.length;
            while(str[end - 1] === char)end--;
            return str.slice(0, end);
        },
        description: 'Removes trailing characters',
        example: 'trimRight($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    splitByString: {
        fn: ([separator, str, maxSplits])=>{
            if (maxSplits === undefined || maxSplits === null) return str.split(separator);
            return str.split(separator, maxSplits);
        },
        description: 'Splits string by separator',
        example: 'splitByString($1, $2, $3)',
        minArgs: 2,
        maxArgs: 3
    },
    generateUUIDv4: {
        fn: ()=>{
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : r & 0x3 | 0x8;
                return v.toString(16);
            });
        },
        description: 'Generates a random UUID v4',
        example: 'generateUUIDv4()',
        minArgs: 0,
        maxArgs: 0
    },
    sha256Hex: {
        fn: ([str], _, options)=>(0, $cd98dbf3206987a7$export$bced8d2aada2d1c9)(str, 'hex', options),
        description: 'Computes SHA-256 hash of a string',
        example: 'sha256($1)',
        minArgs: 1,
        maxArgs: 1
    },
    sha256: {
        fn: ([str, encoding], _, options)=>(0, $cd98dbf3206987a7$export$bced8d2aada2d1c9)(str, encoding, options),
        description: 'Computes SHA-256 hash of a string',
        example: 'sha256($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    md5Hex: {
        fn: ([str], _, options)=>(0, $cd98dbf3206987a7$export$a58ec6a60c09ca72)(str, 'hex', options),
        description: 'Computes MD5 hash of a string',
        example: 'md5($1)',
        minArgs: 1,
        maxArgs: 1
    },
    md5: {
        fn: ([str, encoding], _, options)=>(0, $cd98dbf3206987a7$export$a58ec6a60c09ca72)(str, encoding, options),
        description: 'Computes MD5 hash of a string',
        example: 'md5($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    sha256HmacChainHex: {
        fn: ([data], _, options)=>(0, $cd98dbf3206987a7$export$60c7719ba3f4dd3e)(data, 'hex', options),
        description: 'Computes SHA-256 HMAC chain hash',
        example: 'sha256HmacChainHex($1)',
        minArgs: 1,
        maxArgs: 1
    },
    sha256HmacChain: {
        fn: ([data, encoding], _, options)=>(0, $cd98dbf3206987a7$export$60c7719ba3f4dd3e)(data, encoding, options),
        description: 'Computes SHA-256 HMAC chain hash',
        example: 'sha256HmacChainHex($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    isIPAddressInRange: {
        fn: ([address, prefix])=>(0, $081f56eebceb920b$export$d37f750fa547bf8b)(address, prefix),
        description: 'Checks if IP address is in CIDR range',
        example: 'isIPAddressInRange($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    keys: {
        fn: ([obj])=>{
            if (typeof obj === 'object') {
                if (Array.isArray(obj)) return Array.from(obj.keys());
                else if (obj instanceof Map) return Array.from(obj.keys());
                return Object.keys(obj);
            }
            return [];
        },
        description: 'Returns array of object keys',
        example: 'keys($1)',
        minArgs: 1,
        maxArgs: 1
    },
    values: {
        fn: ([obj])=>{
            if (typeof obj === 'object') {
                if (Array.isArray(obj)) return [
                    ...obj
                ];
                else if (obj instanceof Map) return Array.from(obj.values());
                return Object.values(obj);
            }
            return [];
        },
        description: 'Returns array of object values',
        example: 'values($1)',
        minArgs: 1,
        maxArgs: 1
    },
    indexOf: {
        fn: ([arrOrString, elem])=>{
            if (Array.isArray(arrOrString)) return arrOrString.indexOf(elem) + 1;
            return 0;
        },
        description: 'Returns 1-based index of element in array',
        example: 'indexOf($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    arrayPushBack: {
        fn: ([arr, item])=>{
            if (!Array.isArray(arr)) return [
                item
            ];
            return [
                ...arr,
                item
            ];
        },
        description: 'Adds element to end of array',
        example: 'arrayPushBack($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    arrayPushFront: {
        fn: ([arr, item])=>{
            if (!Array.isArray(arr)) return [
                item
            ];
            return [
                item,
                ...arr
            ];
        },
        description: 'Adds element to start of array',
        example: 'arrayPushFront($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    arrayPopBack: {
        fn: ([arr])=>{
            if (!Array.isArray(arr)) return [];
            return arr.slice(0, arr.length - 1);
        },
        description: 'Removes last element from array',
        example: 'arrayPopBack($1)',
        minArgs: 1,
        maxArgs: 1
    },
    arrayPopFront: {
        fn: ([arr])=>{
            if (!Array.isArray(arr)) return [];
            return arr.slice(1);
        },
        description: 'Removes first element from array',
        example: 'arrayPopFront($1)',
        minArgs: 1,
        maxArgs: 1
    },
    arraySort: {
        fn: ([arr])=>{
            if (!Array.isArray(arr)) return [];
            return [
                ...arr
            ].sort();
        },
        description: 'Sorts array in ascending order',
        example: 'arraySort($1)',
        minArgs: 1,
        maxArgs: 1
    },
    arrayReverse: {
        fn: ([arr])=>{
            if (!Array.isArray(arr)) return [];
            return [
                ...arr
            ].reverse();
        },
        description: 'Reverses array order',
        example: 'arrayReverse($1)',
        minArgs: 1,
        maxArgs: 1
    },
    arrayReverseSort: {
        fn: ([arr])=>{
            if (!Array.isArray(arr)) return [];
            return [
                ...arr
            ].sort().reverse();
        },
        description: 'Sorts array in descending order',
        example: 'arrayReverseSort($1)',
        minArgs: 1,
        maxArgs: 1
    },
    arrayStringConcat: {
        fn: ([arr, separator = ''])=>{
            if (!Array.isArray(arr)) return '';
            return arr.join(separator);
        },
        description: 'Joins array elements with separator',
        example: 'arrayStringConcat($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    has: {
        fn: ([arr, elem])=>{
            if (!Array.isArray(arr) || arr.length === 0) return false;
            return arr.includes(elem);
        },
        description: 'Checks if array contains element',
        example: 'has($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    now: {
        fn: ()=>{
            return (0, $4d6f6365495b63e6$export$461939dd4422153)();
        },
        description: 'Returns current datetime',
        example: 'now()',
        minArgs: 0,
        maxArgs: 0
    },
    toUnixTimestamp: {
        fn: (args)=>{
            return (0, $4d6f6365495b63e6$export$89d19b307eaa5b00)(args[0], args[1]);
        },
        description: 'Converts datetime to Unix timestamp',
        example: 'toUnixTimestamp($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    fromUnixTimestamp: {
        fn: (args)=>{
            return (0, $4d6f6365495b63e6$export$2eae39828437ef9)(args[0]);
        },
        description: 'Converts Unix timestamp to datetime',
        example: 'fromUnixTimestamp($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toUnixTimestampMilli: {
        fn: (args)=>{
            return (0, $4d6f6365495b63e6$export$3c767e1cce0f2443)(args[0], args[1]);
        },
        description: 'Converts datetime to Unix timestamp in milliseconds',
        example: 'toUnixTimestampMilli($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    fromUnixTimestampMilli: {
        fn: (args)=>{
            return (0, $4d6f6365495b63e6$export$477f0894d0f48f23)(args[0]);
        },
        description: 'Converts Unix timestamp in milliseconds to datetime',
        example: 'fromUnixTimestampMilli($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toTimeZone: {
        fn: (args)=>{
            return (0, $4d6f6365495b63e6$export$538b00033cc11c75)(args[0], args[1]);
        },
        description: 'Converts datetime to specified timezone',
        example: 'toTimeZone($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    toDate: {
        fn: (args)=>{
            return (0, $4d6f6365495b63e6$export$e67a095c620b86fe)(args[0]);
        },
        description: 'Converts value to date',
        example: 'toDate($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toDateTime: {
        fn: (args)=>{
            return (0, $4d6f6365495b63e6$export$c2dea5c02f48568d)(args[0], args[1]);
        },
        description: 'Converts value to datetime',
        example: 'toDateTime($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    formatDateTime: {
        fn: (args)=>{
            return (0, $4d6f6365495b63e6$export$8b492ed8828f789c)(args[0], args[1], args[2]);
        },
        description: 'Formats datetime with pattern',
        example: 'formatDateTime($1, $2, $3)',
        minArgs: 2,
        maxArgs: 3
    },
    HogError: {
        fn: (args)=>(0, $27b25c9e0700770a$export$c2d752b32b9bf15c)(args[0], args[1], args[2]),
        description: 'Creates a Script error',
        example: 'HogError($1, $2, $3)',
        minArgs: 1,
        maxArgs: 3
    },
    Error: {
        fn: (args, name)=>(0, $27b25c9e0700770a$export$c2d752b32b9bf15c)(name, args[0], args[1]),
        description: 'Creates a generic error',
        example: 'Error($1, $2)',
        minArgs: 0,
        maxArgs: 2
    },
    RetryError: {
        fn: (args, name)=>(0, $27b25c9e0700770a$export$c2d752b32b9bf15c)(name, args[0], args[1]),
        description: 'Creates a retry error',
        example: 'RetryError($1, $2)',
        minArgs: 0,
        maxArgs: 2
    },
    NotImplementedError: {
        fn: (args, name)=>(0, $27b25c9e0700770a$export$c2d752b32b9bf15c)(name, args[0], args[1]),
        description: 'Creates a not implemented error',
        example: 'NotImplementedError($1, $2)',
        minArgs: 0,
        maxArgs: 2
    },
    typeof: {
        fn: (args)=>{
            if (args[0] === null || args[0] === undefined) return 'null';
            else if ((0, $27b25c9e0700770a$export$36cb9320e67ccd70)(args[0])) return 'datetime';
            else if ((0, $27b25c9e0700770a$export$bd8197d5a05a4a7e)(args[0])) return 'date';
            else if ((0, $27b25c9e0700770a$export$6a076491ad0da05d)(args[0])) return 'error';
            else if ((0, $27b25c9e0700770a$export$3bbfc8b03361d8b7)(args[0]) || (0, $27b25c9e0700770a$export$2fad4bf1d8756816)(args[0])) return 'function';
            else if ((0, $27b25c9e0700770a$export$c1885639c9f11133)(args[0])) return 'sql';
            else if (Array.isArray(args[0])) {
                if (args[0].__isHogTuple) return 'tuple';
                return 'array';
            } else if (typeof args[0] === 'object') return 'object';
            else if (typeof args[0] === 'number') return Number.isInteger(args[0]) ? 'integer' : 'float';
            else if (typeof args[0] === 'string') return 'string';
            else if (typeof args[0] === 'boolean') return 'boolean';
            return 'unknown';
        },
        description: 'Returns type of value as string',
        example: 'typeof($1)',
        minArgs: 1,
        maxArgs: 1
    },
    JSONExtractArrayRaw: {
        fn: $23fc6ca6b1cb5ed8$var$JSONExtractArrayRawFn,
        description: 'Extracts array from JSON path',
        example: 'JSONExtractArrayRaw($1, $2)',
        minArgs: 1
    },
    JSONExtractFloat: {
        fn: $23fc6ca6b1cb5ed8$var$JSONExtractFloatFn,
        description: 'Extracts float from JSON path',
        example: 'JSONExtractFloat($1, $2)',
        minArgs: 1
    },
    JSONExtractInt: {
        fn: $23fc6ca6b1cb5ed8$var$JSONExtractIntFn,
        description: 'Extracts integer from JSON path',
        example: 'JSONExtractInt($1, $2)',
        minArgs: 1
    },
    JSONExtractString: {
        fn: $23fc6ca6b1cb5ed8$var$JSONExtractStringFn,
        description: 'Extracts string from JSON path',
        example: 'JSONExtractString($1, $2)',
        minArgs: 1
    },
    addDays: {
        fn: $23fc6ca6b1cb5ed8$var$addDaysFn,
        description: 'Adds days to date/datetime',
        example: 'addDays($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    assumeNotNull: {
        fn: $23fc6ca6b1cb5ed8$var$assumeNotNullFn,
        description: 'Asserts value is not null',
        example: 'assumeNotNull($1)',
        minArgs: 1,
        maxArgs: 1
    },
    coalesce: {
        fn: $23fc6ca6b1cb5ed8$var$coalesceFn,
        description: 'Returns first non-null value',
        example: 'coalesce($1, $2, $3)',
        minArgs: 1
    },
    dateAdd: {
        fn: $23fc6ca6b1cb5ed8$var$dateAddFn,
        description: 'Adds interval to date/datetime',
        example: 'dateAdd($1, $2, $3)',
        minArgs: 3,
        maxArgs: 3
    },
    dateDiff: {
        fn: $23fc6ca6b1cb5ed8$var$dateDiffFn,
        description: 'Returns difference between dates',
        example: 'dateDiff($1, $2, $3)',
        minArgs: 3,
        maxArgs: 3
    },
    dateTrunc: {
        fn: $23fc6ca6b1cb5ed8$var$dateTruncFn,
        description: 'Truncates datetime to unit',
        example: 'dateTrunc($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    equals: {
        fn: $23fc6ca6b1cb5ed8$var$equalsFn,
        description: 'Checks if values are equal',
        example: 'equals($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    extract: {
        fn: $23fc6ca6b1cb5ed8$var$extractFn,
        description: 'Extracts part from date/datetime',
        example: 'extract($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    floor: {
        fn: $23fc6ca6b1cb5ed8$var$floorFn,
        description: 'Rounds number down to integer',
        example: 'floor($1)',
        minArgs: 1,
        maxArgs: 1
    },
    greater: {
        fn: $23fc6ca6b1cb5ed8$var$greaterFn,
        description: 'Checks if first value is greater',
        example: 'greater($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    greaterOrEquals: {
        fn: $23fc6ca6b1cb5ed8$var$greaterOrEqualsFn,
        description: 'Checks if first value is greater or equal',
        example: 'greaterOrEquals($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    if: {
        fn: $23fc6ca6b1cb5ed8$var$ifFn,
        description: 'Returns value based on condition',
        example: 'if($1, $2, $3)',
        minArgs: 3,
        maxArgs: 3
    },
    in: {
        fn: $23fc6ca6b1cb5ed8$var$inFn,
        description: 'Checks if value is in array/tuple',
        example: 'in($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    less: {
        fn: $23fc6ca6b1cb5ed8$var$lessFn,
        description: 'Checks if first value is less',
        example: 'less($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    lessOrEquals: {
        fn: $23fc6ca6b1cb5ed8$var$lessOrEqualsFn,
        description: 'Checks if first value is less or equal',
        example: 'lessOrEquals($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    min2: {
        fn: $23fc6ca6b1cb5ed8$var$min2Fn,
        description: 'Returns minimum of two values',
        example: 'min2($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    minus: {
        fn: $23fc6ca6b1cb5ed8$var$minusFn,
        description: 'Subtracts second value from first',
        example: 'minus($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    multiIf: {
        fn: $23fc6ca6b1cb5ed8$var$multiIfFn,
        description: 'Returns value based on multiple conditions',
        example: 'multiIf($1, $2, $3, $4, $5)',
        minArgs: 3
    },
    not: {
        fn: $23fc6ca6b1cb5ed8$var$notFn,
        description: 'Logical NOT operation',
        example: 'not($1)',
        minArgs: 1,
        maxArgs: 1
    },
    notEquals: {
        fn: $23fc6ca6b1cb5ed8$var$notEqualsFn,
        description: 'Checks if values are not equal',
        example: 'notEquals($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    and: {
        fn: $23fc6ca6b1cb5ed8$var$andFn,
        description: 'Logical AND operation',
        example: 'and($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    or: {
        fn: $23fc6ca6b1cb5ed8$var$orFn,
        description: 'Logical OR operation',
        example: 'or($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    plus: {
        fn: $23fc6ca6b1cb5ed8$var$plusFn,
        description: 'Adds two values',
        example: 'plus($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    range: {
        fn: $23fc6ca6b1cb5ed8$var$rangeFn,
        description: 'Creates array of numbers',
        example: 'range($1, $2)',
        minArgs: 1,
        maxArgs: 2
    },
    round: {
        fn: $23fc6ca6b1cb5ed8$var$roundFn,
        description: 'Rounds number to nearest integer',
        example: 'round($1)',
        minArgs: 1,
        maxArgs: 1
    },
    startsWith: {
        fn: $23fc6ca6b1cb5ed8$var$startsWithFn,
        description: 'Checks if string starts with prefix',
        example: 'startsWith($1, $2)',
        minArgs: 2,
        maxArgs: 2
    },
    substring: {
        fn: $23fc6ca6b1cb5ed8$var$substringFn,
        description: 'Extracts substring from string',
        example: 'substring($1, $2, $3)',
        minArgs: 2,
        maxArgs: 3
    },
    toIntervalDay: {
        fn: $23fc6ca6b1cb5ed8$var$toIntervalDayFn,
        description: 'Creates day interval',
        example: 'toIntervalDay($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toIntervalHour: {
        fn: $23fc6ca6b1cb5ed8$var$toIntervalHourFn,
        description: 'Creates hour interval',
        example: 'toIntervalHour($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toIntervalMinute: {
        fn: $23fc6ca6b1cb5ed8$var$toIntervalMinuteFn,
        description: 'Creates minute interval',
        example: 'toIntervalMinute($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toIntervalMonth: {
        fn: $23fc6ca6b1cb5ed8$var$toIntervalMonthFn,
        description: 'Creates month interval',
        example: 'toIntervalMonth($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toMonth: {
        fn: $23fc6ca6b1cb5ed8$var$toMonthFn,
        description: 'Extracts month from date/datetime',
        example: 'toMonth($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toStartOfDay: {
        fn: $23fc6ca6b1cb5ed8$var$toStartOfDayFn,
        description: 'Truncates datetime to start of day',
        example: 'toStartOfDay($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toStartOfHour: {
        fn: $23fc6ca6b1cb5ed8$var$toStartOfHourFn,
        description: 'Truncates datetime to start of hour',
        example: 'toStartOfHour($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toStartOfMonth: {
        fn: $23fc6ca6b1cb5ed8$var$toStartOfMonthFn,
        description: 'Truncates datetime to start of month',
        example: 'toStartOfMonth($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toStartOfWeek: {
        fn: $23fc6ca6b1cb5ed8$var$toStartOfWeekFn,
        description: 'Truncates datetime to start of week',
        example: 'toStartOfWeek($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toYYYYMM: {
        fn: $23fc6ca6b1cb5ed8$var$toYYYYMMFn,
        description: 'Converts date to YYYYMM format',
        example: 'toYYYYMM($1)',
        minArgs: 1,
        maxArgs: 1
    },
    toYear: {
        fn: $23fc6ca6b1cb5ed8$var$toYearFn,
        description: 'Extracts year from date/datetime',
        example: 'toYear($1)',
        minArgs: 1,
        maxArgs: 1
    },
    today: {
        fn: $23fc6ca6b1cb5ed8$var$todayFn,
        description: 'Returns current date',
        example: 'today()',
        minArgs: 0,
        maxArgs: 0
    },
    multiSearchAnyCaseInsensitive: {
        fn: (args)=>{
            if (args[0] == null || args[1] == null) return 0;
            if (!Array.isArray(args[1])) return 0;
            const haystack = String(args[0]).toLowerCase();
            return args[1].some((needle)=>haystack.includes(String(needle).toLowerCase())) ? 1 : 0;
        },
        description: 'Searches for any of the provided needles in the haystack (case insensitive)',
        example: 'multiSearchAnyCaseInsensitive($1, $2)',
        minArgs: 2,
        maxArgs: 2
    }
};
const $23fc6ca6b1cb5ed8$export$daf23d78d6f53989 = {
    sleep: {
        fn: async (args)=>{
            await new Promise((resolve)=>setTimeout(resolve, args[0] * 1000));
        },
        minArgs: 1,
        maxArgs: 1
    }
};



function $46c45dfd262302d4$export$fa77af024d7e00a8(bytecode, options) {
    const response = $46c45dfd262302d4$export$78e3044358792147(bytecode, options);
    if (response.finished) return response.result;
    if (response.error) throw response.error;
    throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Unexpected async function call: ' + response.asyncFunctionName);
}
async function $46c45dfd262302d4$export$cf47dcd3447a7197(bytecode, options) {
    let vmState = undefined;
    while(true){
        const response = $46c45dfd262302d4$export$78e3044358792147(vmState ?? bytecode, options);
        if (response.finished) return response;
        if (response.error) throw response.error;
        if (response.state && response.asyncFunctionName && response.asyncFunctionArgs) {
            vmState = response.state;
            if (options?.asyncFunctions && response.asyncFunctionName in options.asyncFunctions) {
                const result = await options?.asyncFunctions[response.asyncFunctionName](...response.asyncFunctionArgs);
                vmState.stack.push(result);
            } else if (response.asyncFunctionName in (0, $23fc6ca6b1cb5ed8$export$daf23d78d6f53989)) {
                const result = await (0, $23fc6ca6b1cb5ed8$export$daf23d78d6f53989)[response.asyncFunctionName].fn(response.asyncFunctionArgs, response.asyncFunctionName, options);
                vmState.stack.push(result);
            } else throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Invalid async function call: ' + response.asyncFunctionName);
        } else throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Invalid async function call');
    }
}
function $46c45dfd262302d4$export$78e3044358792147(input, options) {
    const startTime = Date.now();
    let vmState = undefined;
    let bytecodes;
    if (!Array.isArray(input)) {
        if ('stack' in input) vmState = input;
        bytecodes = input.bytecode ? {
            root: {
                bytecode: input.bytecode
            }
        } : input.bytecodes;
    } else bytecodes = {
        root: {
            bytecode: input
        }
    };
    const rootBytecode = bytecodes.root.bytecode;
    if (!rootBytecode || rootBytecode.length === 0 || rootBytecode[0] !== '_h' && rootBytecode[0] !== '_H') throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)("Invalid InsightsQL bytecode, must start with '_H'");
    const version = rootBytecode[0] === '_H' ? rootBytecode[1] ?? 0 : 0;
    let temp;
    let temp2;
    let tempArray;
    let tempMap = new Map();
    const asyncSteps = vmState ? vmState.asyncSteps : 0;
    const syncDuration = vmState ? vmState.syncDuration : 0;
    const sortedUpValues = vmState ? vmState.upvalues.map((v)=>({
            ...v,
            value: (0, $ddbbfac842d2b47e$export$f0c387fc4f006d51)(v.value)
        })) : [];
    const upvaluesById = {};
    for (const upvalue of sortedUpValues)upvaluesById[upvalue.id] = upvalue;
    const stack = vmState ? vmState.stack.map((v)=>(0, $ddbbfac842d2b47e$export$f0c387fc4f006d51)(v)) : [];
    const memStack = stack.map((s)=>(0, $ddbbfac842d2b47e$export$ccac9139013839fb)(s));
    const callStack = vmState ? vmState.callStack.map((v)=>({
            ...v,
            closure: (0, $ddbbfac842d2b47e$export$f0c387fc4f006d51)(v.closure)
        })) : [];
    const throwStack = vmState ? vmState.throwStack : [];
    const declaredFunctions = vmState ? vmState.declaredFunctions : {};
    let memUsed = memStack.reduce((acc, val)=>acc + val, 0);
    let maxMemUsed = Math.max(vmState ? vmState.maxMemUsed : 0, memUsed);
    const memLimit = options?.memoryLimit ?? (0, $d6c46379019a9f14$export$802abc67201653ab);
    let ops = vmState ? vmState.ops : 0;
    const timeout = options?.timeout ?? (0, $d6c46379019a9f14$export$dcf22dd285f74f3d);
    const maxAsyncSteps = options?.maxAsyncSteps ?? (0, $d6c46379019a9f14$export$2a71946d1fd66654);
    const rootGlobals = bytecodes.root?.globals && options?.globals ? {
        ...bytecodes.root.globals,
        ...options.globals
    } : bytecodes.root?.globals ?? options?.globals ?? {};
    if (callStack.length === 0) callStack.push({
        ip: 0,
        chunk: 'root',
        stackStart: 0,
        argCount: 0,
        closure: (0, $27b25c9e0700770a$export$42bb9ce6d451c81e)((0, $27b25c9e0700770a$export$4160dcabb869144f)('local', {
            name: '',
            argCount: 0,
            upvalueCount: 0,
            ip: 1,
            chunk: 'root'
        }))
    });
    let frame = callStack[callStack.length - 1];
    let chunkBytecode = rootBytecode;
    let chunkGlobals = rootGlobals;
    let lastChunk = frame.chunk;
    let lastTime = startTime;
    const telemetry = [
        [
            startTime,
            lastChunk,
            0,
            'START',
            ''
        ]
    ];
    const setChunkBytecode = ()=>{
        if (!frame.chunk || frame.chunk === 'root') {
            chunkBytecode = rootBytecode;
            chunkGlobals = rootGlobals;
        } else if (frame.chunk.startsWith('stl/') && frame.chunk.substring(4) in (0, $afd1cc5cb2d921da$export$5477e8cd2355fadb)) {
            chunkBytecode = (0, $afd1cc5cb2d921da$export$5477e8cd2355fadb)[frame.chunk.substring(4)][1];
            chunkGlobals = {};
        } else if (bytecodes[frame.chunk]) {
            chunkBytecode = bytecodes[frame.chunk].bytecode;
            chunkGlobals = bytecodes[frame.chunk].globals ?? {};
        } else if (options?.importBytecode) {
            const chunk = options.importBytecode(frame.chunk);
            if (chunk) {
                bytecodes[frame.chunk] = chunk // cache for later
                ;
                chunkBytecode = chunk.bytecode;
                chunkGlobals = chunk.globals ?? {};
            } else throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Unknown chunk: ${frame.chunk}`);
        } else throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Unknown chunk: ${frame.chunk}`);
        if (frame.ip === 0 && (chunkBytecode[0] === '_H' || chunkBytecode[0] === '_h')) // TODO: store chunkVersion
        frame.ip += chunkBytecode[0] === '_H' ? 2 : 1;
    };
    setChunkBytecode();
    function popStack() {
        if (stack.length === 0) {
            logTelemetry();
            throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Invalid InsightsQL bytecode, stack is empty, can not pop');
        }
        memUsed -= memStack.pop() ?? 0;
        return stack.pop();
    }
    function pushStack(value) {
        memStack.push((0, $ddbbfac842d2b47e$export$ccac9139013839fb)(value));
        memUsed += memStack[memStack.length - 1];
        maxMemUsed = Math.max(maxMemUsed, memUsed);
        if (memUsed > memLimit && memLimit > 0) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Memory limit of ${memLimit} bytes exceeded. Tried to allocate ${memUsed} bytes.`);
        return stack.push(value);
    }
    function spliceStack2(start, deleteCount) {
        memUsed -= memStack.splice(start, deleteCount).reduce((acc, val)=>acc + val, 0);
        return stack.splice(start, deleteCount);
    }
    function stackKeepFirstElements(count) {
        if (count < 0 || stack.length < count) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Stack underflow');
        for(let i = sortedUpValues.length - 1; i >= 0; i--){
            if (sortedUpValues[i].location >= count) {
                if (!sortedUpValues[i].closed) {
                    sortedUpValues[i].closed = true;
                    sortedUpValues[i].value = stack[sortedUpValues[i].location];
                }
            } else break;
        }
        memUsed -= memStack.splice(count).reduce((acc, val)=>acc + val, 0);
        return stack.splice(count);
    }
    function next() {
        if (frame.ip >= chunkBytecode.length - 1) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Unexpected end of bytecode');
        return chunkBytecode[++frame.ip];
    }
    function checkTimeout() {
        if (syncDuration + Date.now() - startTime > timeout) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Execution timed out after ${timeout / 1000} seconds. Performed ${ops} ops.`);
    }
    function getVMState() {
        return {
            bytecodes: bytecodes,
            stack: stack.map((v)=>(0, $ddbbfac842d2b47e$export$8353e27c009c56d3)(v)),
            upvalues: sortedUpValues.map((v)=>({
                    ...v,
                    value: (0, $ddbbfac842d2b47e$export$8353e27c009c56d3)(v.value)
                })),
            callStack: callStack.map((v)=>({
                    ...v,
                    closure: (0, $ddbbfac842d2b47e$export$8353e27c009c56d3)(v.closure)
                })),
            throwStack: throwStack,
            declaredFunctions: declaredFunctions,
            ops: ops,
            asyncSteps: asyncSteps,
            syncDuration: syncDuration + (Date.now() - startTime),
            maxMemUsed: maxMemUsed,
            telemetry: options?.telemetry ? telemetry : undefined
        };
    }
    function captureUpValue(index) {
        for(let i = sortedUpValues.length - 1; i >= 0; i--){
            if (sortedUpValues[i].location < index) break;
            if (sortedUpValues[i].location === index) return sortedUpValues[i];
        }
        const createdUpValue = {
            __hogUpValue__: true,
            id: sortedUpValues.length + 1,
            location: index,
            closed: false,
            value: null
        };
        upvaluesById[createdUpValue.id] = createdUpValue;
        sortedUpValues.push(createdUpValue);
        sortedUpValues.sort((a, b)=>a.location - b.location);
        return createdUpValue;
    }
    function regexMatch() {
        if (!options?.external?.regex?.match) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Set options.external.regex.match for RegEx support');
        return (regex, value)=>regex && value ? !!options.external?.regex?.match(regex, value) : false;
    }
    const logTelemetry = ()=>{
        const op = chunkBytecode[frame.ip];
        const newTime = new Date().getTime();
        let debug = '';
        if (op === (0, $66bfafebb155a286$export$ab5aad00225c5662).CALL_LOCAL || op === (0, $66bfafebb155a286$export$ab5aad00225c5662).GET_PROPERTY || op === (0, $66bfafebb155a286$export$ab5aad00225c5662).GET_PROPERTY_NULLISH) debug = String(stack[stack.length - 1]);
        else if (op === (0, $66bfafebb155a286$export$ab5aad00225c5662).GET_GLOBAL || op === (0, $66bfafebb155a286$export$ab5aad00225c5662).CALL_GLOBAL || op === (0, $66bfafebb155a286$export$ab5aad00225c5662).STRING || op === (0, $66bfafebb155a286$export$ab5aad00225c5662).INTEGER || op === (0, $66bfafebb155a286$export$ab5aad00225c5662).FLOAT) debug = String(chunkBytecode[frame.ip + 1]);
        telemetry.push([
            newTime !== lastTime ? newTime - lastTime : 0,
            frame.chunk !== lastChunk ? frame.chunk : '',
            frame.ip,
            typeof chunkBytecode[frame.ip] === 'number' ? String(chunkBytecode[frame.ip]) + ((0, $66bfafebb155a286$export$59894c102379d64a)[chunkBytecode[frame.ip]] ? `/${(0, $66bfafebb155a286$export$59894c102379d64a)[chunkBytecode[frame.ip]]}` : '') : '???',
            debug
        ]);
        lastChunk = frame.chunk;
        lastTime = newTime;
    };
    const nextOp = options?.telemetry ? ()=>{
        ops += 1;
        logTelemetry();
        if ((ops & 31) === 0) checkTimeout();
    } : ()=>{
        ops += 1;
        if ((ops & 31) === 0) checkTimeout();
    };
    try {
        while(true){
            // Return or jump back to the previous call frame if ran out of bytecode to execute in this one
            if (frame.ip >= chunkBytecode.length) {
                const lastCallFrame = callStack.pop();
                // Also ran out of call frames. We're done.
                if (!lastCallFrame || callStack.length === 0) return {
                    // Don't pop the stack if we're in repl mode
                    result: options?.repl ? undefined : stack.length > 0 ? popStack() : null,
                    finished: true,
                    state: getVMState()
                };
                stackKeepFirstElements(lastCallFrame.stackStart);
                pushStack(null);
                frame = callStack[callStack.length - 1];
                setChunkBytecode();
            }
            nextOp();
            switch(chunkBytecode[frame.ip]){
                case null:
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).STRING:
                    pushStack(next());
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).FLOAT:
                    pushStack(next());
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).INTEGER:
                    pushStack(next());
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).TRUE:
                    pushStack(true);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).FALSE:
                    pushStack(false);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).NULL:
                    pushStack(null);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).NOT:
                    pushStack(!popStack());
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).AND:
                    temp = next();
                    temp2 = true;
                    for(let i = 0; i < temp; i++)temp2 = !!popStack() && temp2;
                    pushStack(temp2);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).OR:
                    temp = next();
                    temp2 = false;
                    for(let i = 0; i < temp; i++)temp2 = !!popStack() || temp2;
                    pushStack(temp2);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).PLUS:
                    pushStack(Number(popStack()) + Number(popStack()));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).MINUS:
                    pushStack(Number(popStack()) - Number(popStack()));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).DIVIDE:
                    pushStack(Number(popStack()) / Number(popStack()));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).MULTIPLY:
                    pushStack(Number(popStack()) * Number(popStack()));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).MOD:
                    pushStack(Number(popStack()) % Number(popStack()));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).EQ:
                    [temp, temp2] = (0, $ddbbfac842d2b47e$export$13d90b9b2a99ed13)(popStack(), popStack());
                    pushStack(temp === temp2);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).NOT_EQ:
                    [temp, temp2] = (0, $ddbbfac842d2b47e$export$13d90b9b2a99ed13)(popStack(), popStack());
                    pushStack(temp !== temp2);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).GT:
                    [temp, temp2] = (0, $ddbbfac842d2b47e$export$13d90b9b2a99ed13)(popStack(), popStack());
                    pushStack(temp > temp2);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).GT_EQ:
                    [temp, temp2] = (0, $ddbbfac842d2b47e$export$13d90b9b2a99ed13)(popStack(), popStack());
                    pushStack(temp >= temp2);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).LT:
                    [temp, temp2] = (0, $ddbbfac842d2b47e$export$13d90b9b2a99ed13)(popStack(), popStack());
                    pushStack(temp < temp2);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).LT_EQ:
                    [temp, temp2] = (0, $ddbbfac842d2b47e$export$13d90b9b2a99ed13)(popStack(), popStack());
                    pushStack(temp <= temp2);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).LIKE:
                    pushStack((0, $ddbbfac842d2b47e$export$e94e5ec04a02879c)(popStack(), popStack(), false, options?.external?.regex?.match));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).ILIKE:
                    pushStack((0, $ddbbfac842d2b47e$export$e94e5ec04a02879c)(popStack(), popStack(), true, options?.external?.regex?.match));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).NOT_LIKE:
                    pushStack(!(0, $ddbbfac842d2b47e$export$e94e5ec04a02879c)(popStack(), popStack(), false, options?.external?.regex?.match));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).NOT_ILIKE:
                    pushStack(!(0, $ddbbfac842d2b47e$export$e94e5ec04a02879c)(popStack(), popStack(), true, options?.external?.regex?.match));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).IN:
                    temp = popStack();
                    pushStack(popStack().includes(temp));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).NOT_IN:
                    temp = popStack();
                    pushStack(!popStack().includes(temp));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).REGEX:
                    temp = popStack();
                    pushStack(regexMatch()(popStack(), temp));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).NOT_REGEX:
                    temp = popStack();
                    pushStack(!regexMatch()(popStack(), temp));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).IREGEX:
                    temp = popStack();
                    pushStack(regexMatch()('(?i)' + popStack(), temp));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).NOT_IREGEX:
                    temp = popStack();
                    pushStack(!regexMatch()('(?i)' + popStack(), temp));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).GET_GLOBAL:
                    {
                        const count = next();
                        const chain = [];
                        for(let i = 0; i < count; i++)chain.push(popStack());
                        if (chunkGlobals && chain[0] in chunkGlobals && Object.hasOwn(chunkGlobals, chain[0])) pushStack((0, $ddbbfac842d2b47e$export$f0c387fc4f006d51)((0, $ddbbfac842d2b47e$export$2516322ffbb7f3fb)(chunkGlobals, chain, true)));
                        else if (options?.asyncFunctions && chain.length == 1 && Object.hasOwn(options.asyncFunctions, chain[0]) && options.asyncFunctions[chain[0]]) pushStack((0, $27b25c9e0700770a$export$42bb9ce6d451c81e)((0, $27b25c9e0700770a$export$4160dcabb869144f)('async', {
                            name: chain[0],
                            argCount: 0,
                            upvalueCount: 0,
                            ip: -1,
                            chunk: 'async'
                        })));
                        else if (chain.length == 1 && chain[0] in (0, $23fc6ca6b1cb5ed8$export$daf23d78d6f53989) && Object.hasOwn((0, $23fc6ca6b1cb5ed8$export$daf23d78d6f53989), chain[0])) pushStack((0, $27b25c9e0700770a$export$42bb9ce6d451c81e)((0, $27b25c9e0700770a$export$4160dcabb869144f)('async', {
                            name: chain[0],
                            argCount: (0, $23fc6ca6b1cb5ed8$export$daf23d78d6f53989)[chain[0]].maxArgs ?? 0,
                            upvalueCount: 0,
                            ip: -1,
                            chunk: 'async'
                        })));
                        else if (chain.length == 1 && chain[0] in (0, $23fc6ca6b1cb5ed8$export$ef8a2f3c50755575) && Object.hasOwn((0, $23fc6ca6b1cb5ed8$export$ef8a2f3c50755575), chain[0])) pushStack((0, $27b25c9e0700770a$export$42bb9ce6d451c81e)((0, $27b25c9e0700770a$export$4160dcabb869144f)('stl', {
                            name: chain[0],
                            argCount: (0, $23fc6ca6b1cb5ed8$export$ef8a2f3c50755575)[chain[0]].maxArgs ?? 0,
                            upvalueCount: 0,
                            ip: -1,
                            chunk: 'stl'
                        })));
                        else if (chain.length == 1 && chain[0] in (0, $afd1cc5cb2d921da$export$5477e8cd2355fadb) && Object.hasOwn((0, $afd1cc5cb2d921da$export$5477e8cd2355fadb), chain[0])) pushStack((0, $27b25c9e0700770a$export$42bb9ce6d451c81e)((0, $27b25c9e0700770a$export$4160dcabb869144f)('stl', {
                            name: chain[0],
                            argCount: (0, $afd1cc5cb2d921da$export$5477e8cd2355fadb)[chain[0]][0].length,
                            upvalueCount: 0,
                            ip: 0,
                            chunk: `stl/${chain[0]}`
                        })));
                        else throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Global variable not found: ${chain.join('.')}`);
                        break;
                    }
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).POP:
                    popStack();
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).CLOSE_UPVALUE:
                    stackKeepFirstElements(stack.length - 1);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).RETURN:
                    {
                        const result = popStack();
                        const lastCallFrame = callStack.pop();
                        if (callStack.length === 0 || !lastCallFrame) return {
                            result: result,
                            finished: true,
                            state: {
                                ...getVMState(),
                                bytecodes: {},
                                stack: [],
                                callStack: [],
                                upvalues: []
                            }
                        };
                        const stackStart = lastCallFrame.stackStart;
                        stackKeepFirstElements(stackStart);
                        pushStack(result);
                        frame = callStack[callStack.length - 1];
                        setChunkBytecode();
                        continue; // resume the loop without incrementing frame.ip
                    }
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).GET_LOCAL:
                    temp = callStack.length > 0 ? callStack[callStack.length - 1].stackStart : 0;
                    pushStack(stack[next() + temp]);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).SET_LOCAL:
                    temp = (callStack.length > 0 ? callStack[callStack.length - 1].stackStart : 0) + next();
                    stack[temp] = popStack();
                    temp2 = memStack[temp];
                    memStack[temp] = (0, $ddbbfac842d2b47e$export$ccac9139013839fb)(stack[temp]);
                    memUsed += memStack[temp] - temp2;
                    maxMemUsed = Math.max(maxMemUsed, memUsed);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).GET_PROPERTY:
                    temp = popStack() // property
                    ;
                    pushStack((0, $ddbbfac842d2b47e$export$2516322ffbb7f3fb)(popStack(), [
                        temp
                    ]));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).GET_PROPERTY_NULLISH:
                    temp = popStack() // property
                    ;
                    pushStack((0, $ddbbfac842d2b47e$export$2516322ffbb7f3fb)(popStack(), [
                        temp
                    ], true));
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).SET_PROPERTY:
                    temp = popStack() // value
                    ;
                    temp2 = popStack() // field
                    ;
                    (0, $ddbbfac842d2b47e$export$c52c7e952af52ee2)(popStack(), [
                        temp2
                    ], temp);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).DICT:
                    temp = next() * 2 // number of elements to remove from the stack
                    ;
                    tempArray = spliceStack2(stack.length - temp, temp);
                    tempMap = new Map();
                    for(let i = 0; i < tempArray.length; i += 2)tempMap.set(tempArray[i], tempArray[i + 1]);
                    pushStack(tempMap);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).ARRAY:
                    temp = next();
                    tempArray = spliceStack2(stack.length - temp, temp);
                    pushStack(tempArray);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).TUPLE:
                    temp = next();
                    tempArray = spliceStack2(stack.length - temp, temp);
                    tempArray.__isHogTuple = true;
                    pushStack(tempArray);
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).JUMP:
                    temp = next();
                    frame.ip += temp;
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).JUMP_IF_FALSE:
                    temp = next();
                    if (!popStack()) frame.ip += temp;
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).JUMP_IF_STACK_NOT_NULL:
                    temp = next();
                    if (stack.length > 0 && stack[stack.length - 1] !== null) frame.ip += temp;
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).DECLARE_FN:
                    {
                        // DEPRECATED
                        const name = next();
                        const argCount = next();
                        const bodyLength = next();
                        declaredFunctions[name] = [
                            frame.ip + 1,
                            argCount
                        ];
                        frame.ip += bodyLength;
                        break;
                    }
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).CALLABLE:
                    {
                        const name = next();
                        const argCount = next();
                        const upvalueCount = next();
                        const bodyLength = next();
                        const callable = (0, $27b25c9e0700770a$export$4160dcabb869144f)('local', {
                            name: name,
                            argCount: argCount,
                            upvalueCount: upvalueCount,
                            ip: frame.ip + 1,
                            chunk: frame.chunk
                        });
                        pushStack(callable);
                        frame.ip += bodyLength;
                        break;
                    }
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).CLOSURE:
                    {
                        const callable = popStack();
                        if (!(0, $27b25c9e0700770a$export$3bbfc8b03361d8b7)(callable)) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Invalid callable: ${JSON.stringify(callable)}`);
                        const upvalueCount = next();
                        const closureUpValues = [];
                        if (upvalueCount !== callable.upvalueCount) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Invalid upvalue count. Expected ${callable.upvalueCount}, got ${upvalueCount}`);
                        const stackStart = frame.stackStart;
                        for(let i = 0; i < callable.upvalueCount; i++){
                            const [isLocal, index] = [
                                next(),
                                next()
                            ];
                            if (isLocal) closureUpValues.push(captureUpValue(stackStart + index).id);
                            else closureUpValues.push(frame.closure.upvalues[index]);
                        }
                        pushStack((0, $27b25c9e0700770a$export$42bb9ce6d451c81e)(callable, closureUpValues));
                        break;
                    }
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).GET_UPVALUE:
                    {
                        const index = next();
                        if (index >= frame.closure.upvalues.length) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Invalid upvalue index: ${index}`);
                        const upvalue = upvaluesById[frame.closure.upvalues[index]];
                        if (!(0, $27b25c9e0700770a$export$30222d8f8abbf3d0)(upvalue)) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Invalid upvalue: ${upvalue}`);
                        if (upvalue.closed) pushStack(upvalue.value);
                        else pushStack(stack[upvalue.location]);
                        break;
                    }
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).SET_UPVALUE:
                    {
                        const index = next();
                        if (index >= frame.closure.upvalues.length) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Invalid upvalue index: ${index}`);
                        const upvalue = upvaluesById[frame.closure.upvalues[index]];
                        if (!(0, $27b25c9e0700770a$export$30222d8f8abbf3d0)(upvalue)) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Invalid upvalue: ${upvalue}`);
                        if (upvalue.closed) upvalue.value = popStack();
                        else stack[upvalue.location] = popStack();
                        break;
                    }
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).CALL_GLOBAL:
                    {
                        checkTimeout();
                        const name = next();
                        temp = next() // args.length
                        ;
                        if (name in declaredFunctions && name !== 'toString') {
                            // This is for backwards compatibility. We use a closure on the stack with local functions now.
                            const [funcIp, argLen] = declaredFunctions[name];
                            frame.ip += 1 // advance for when we return
                            ;
                            if (argLen > temp) for(let i = temp; i < argLen; i++)pushStack(null);
                            frame = {
                                ip: funcIp,
                                chunk: frame.chunk,
                                stackStart: stack.length - argLen,
                                argCount: argLen,
                                closure: (0, $27b25c9e0700770a$export$42bb9ce6d451c81e)((0, $27b25c9e0700770a$export$4160dcabb869144f)('local', {
                                    name: name,
                                    argCount: argLen,
                                    upvalueCount: 0,
                                    ip: funcIp,
                                    chunk: frame.chunk
                                }))
                            };
                            setChunkBytecode();
                            callStack.push(frame);
                            continue; // resume the loop without incrementing frame.ip
                        } else {
                            if (temp > stack.length) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Not enough arguments on the stack');
                            if (temp > (0, $d6c46379019a9f14$export$a6ea10a37f8d5abe)) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Too many arguments');
                            if (name === 'import') {
                                const args = version === 0 ? Array(temp).fill(null).map(()=>popStack()) : stackKeepFirstElements(stack.length - temp);
                                if (args.length !== 1) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Function ${name} requires exactly 1 argument`);
                                frame.ip += 1 // advance for when we return
                                ;
                                frame = {
                                    ip: 0,
                                    chunk: args[0],
                                    stackStart: stack.length,
                                    argCount: 0,
                                    closure: (0, $27b25c9e0700770a$export$42bb9ce6d451c81e)((0, $27b25c9e0700770a$export$4160dcabb869144f)('local', {
                                        name: args[0],
                                        argCount: 0,
                                        upvalueCount: 0,
                                        ip: 0,
                                        chunk: args[0]
                                    }))
                                };
                                setChunkBytecode();
                                callStack.push(frame);
                                continue; // resume the loop without incrementing frame.ip
                            } else if (options?.functions && Object.hasOwn(options.functions, name) && options.functions[name]) {
                                const args = version === 0 ? Array(temp).fill(null).map(()=>popStack()) : stackKeepFirstElements(stack.length - temp);
                                pushStack((0, $ddbbfac842d2b47e$export$f0c387fc4f006d51)(options.functions[name](...args.map((v)=>(0, $ddbbfac842d2b47e$export$8353e27c009c56d3)(v)))));
                            } else if (name !== 'toString' && (options?.asyncFunctions && Object.hasOwn(options.asyncFunctions, name) && options.asyncFunctions[name] || name in (0, $23fc6ca6b1cb5ed8$export$daf23d78d6f53989))) {
                                if (asyncSteps >= maxAsyncSteps) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Exceeded maximum number of async steps: ${maxAsyncSteps}`);
                                const args = version === 0 ? Array(temp).fill(null).map(()=>popStack()) : stackKeepFirstElements(stack.length - temp);
                                frame.ip += 1 // resume at the next address after async returns
                                ;
                                return {
                                    result: undefined,
                                    finished: false,
                                    asyncFunctionName: name,
                                    asyncFunctionArgs: args.map((v)=>(0, $ddbbfac842d2b47e$export$8353e27c009c56d3)(v)),
                                    state: {
                                        ...getVMState(),
                                        asyncSteps: asyncSteps + 1
                                    }
                                };
                            } else if (name in (0, $23fc6ca6b1cb5ed8$export$ef8a2f3c50755575)) {
                                const args = version === 0 ? Array(temp).fill(null).map(()=>popStack()) : stackKeepFirstElements(stack.length - temp);
                                pushStack((0, $23fc6ca6b1cb5ed8$export$ef8a2f3c50755575)[name].fn(args, name, options));
                            } else if (name in (0, $afd1cc5cb2d921da$export$5477e8cd2355fadb)) {
                                const argNames = (0, $afd1cc5cb2d921da$export$5477e8cd2355fadb)[name][0];
                                if (argNames.length !== temp) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Function ${name} requires exactly ${argNames.length} arguments`);
                                frame.ip += 1 // advance for when we return
                                ;
                                frame = {
                                    ip: 0,
                                    chunk: `stl/${name}`,
                                    stackStart: stack.length - temp,
                                    argCount: temp,
                                    closure: (0, $27b25c9e0700770a$export$42bb9ce6d451c81e)((0, $27b25c9e0700770a$export$4160dcabb869144f)('stl', {
                                        name: name,
                                        argCount: temp,
                                        upvalueCount: 0,
                                        ip: 0,
                                        chunk: `stl/${name}`
                                    }))
                                };
                                setChunkBytecode();
                                callStack.push(frame);
                                if (callStack.length > (0, $d6c46379019a9f14$export$b3e3f74739b6f9fd)) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Call stack exceeded maximum length of ${(0, $d6c46379019a9f14$export$b3e3f74739b6f9fd)}`);
                                continue; // resume the loop without incrementing frame.ip
                            } else throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Unsupported function call: ${name}`);
                        }
                        break;
                    }
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).CALL_LOCAL:
                    {
                        checkTimeout();
                        const closure = popStack();
                        if (!(0, $27b25c9e0700770a$export$2fad4bf1d8756816)(closure)) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Invalid closure: ${JSON.stringify(closure)}`);
                        if (!(0, $27b25c9e0700770a$export$3bbfc8b03361d8b7)(closure.callable)) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Invalid callable: ${JSON.stringify(closure.callable)}`);
                        temp = next() // args.length
                        ;
                        if (temp > stack.length) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Not enough arguments on the stack');
                        if (temp > (0, $d6c46379019a9f14$export$a6ea10a37f8d5abe)) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Too many arguments');
                        if (closure.callable.__hogCallable__ === 'local') {
                            if (closure.callable.argCount > temp) for(let i = temp; i < closure.callable.argCount; i++)pushStack(null);
                            else if (closure.callable.argCount < temp) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Too many arguments. Passed ${temp}, expected ${closure.callable.argCount}`);
                            frame.ip += 1 // advance for when we return
                            ;
                            frame = {
                                ip: closure.callable.ip,
                                chunk: closure.callable.chunk,
                                stackStart: stack.length - closure.callable.argCount,
                                argCount: closure.callable.argCount,
                                closure: closure
                            };
                            setChunkBytecode();
                            callStack.push(frame);
                            if (callStack.length > (0, $d6c46379019a9f14$export$b3e3f74739b6f9fd)) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Call stack exceeded maximum length of ${(0, $d6c46379019a9f14$export$b3e3f74739b6f9fd)}`);
                            continue; // resume the loop without incrementing frame.ip
                        } else if (closure.callable.__hogCallable__ === 'stl') {
                            if (!closure.callable.name || !(closure.callable.name in (0, $23fc6ca6b1cb5ed8$export$ef8a2f3c50755575))) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Unsupported function call: ${closure.callable.name}`);
                            const stlFn = (0, $23fc6ca6b1cb5ed8$export$ef8a2f3c50755575)[closure.callable.name];
                            if (stlFn.minArgs !== undefined && temp < stlFn.minArgs) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Function ${closure.callable.name} requires at least ${stlFn.minArgs} arguments`);
                            if (stlFn.maxArgs !== undefined && temp > stlFn.maxArgs) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Function ${closure.callable.name} requires at most ${stlFn.maxArgs} arguments`);
                            const args = Array(temp).fill(null).map(()=>popStack());
                            if (version > 0) args.reverse();
                            if (stlFn.maxArgs !== undefined && args.length < stlFn.maxArgs) for(let i = args.length; i < stlFn.maxArgs; i++)args.push(null);
                            pushStack(stlFn.fn(args, closure.callable.name, options));
                        } else if (closure.callable.__hogCallable__ === 'async') {
                            if (asyncSteps >= maxAsyncSteps) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Exceeded maximum number of async steps: ${maxAsyncSteps}`);
                            const args = Array(temp).fill(null).map(()=>popStack());
                            return {
                                result: undefined,
                                finished: false,
                                asyncFunctionName: closure.callable.name,
                                asyncFunctionArgs: args.map((v)=>(0, $ddbbfac842d2b47e$export$8353e27c009c56d3)(v)),
                                state: {
                                    ...getVMState(),
                                    asyncSteps: asyncSteps + 1
                                }
                            };
                        } else throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Unsupported function call: ${closure.callable.name}`);
                        break;
                    }
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).TRY:
                    throwStack.push({
                        callStackLen: callStack.length,
                        stackLen: stack.length,
                        catchIp: frame.ip + 1 + next()
                    });
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).POP_TRY:
                    if (throwStack.length > 0) throwStack.pop();
                    else throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Invalid operation POP_TRY: no try block to pop');
                    break;
                case (0, $66bfafebb155a286$export$ab5aad00225c5662).THROW:
                    {
                        const exception = popStack();
                        if (!(0, $27b25c9e0700770a$export$6a076491ad0da05d)(exception)) throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)('Can not throw: value is not of type Error');
                        if (throwStack.length > 0) {
                            const { callStackLen: callStackLen, stackLen: stackLen, catchIp: catchIp } = throwStack.pop();
                            stackKeepFirstElements(stackLen);
                            memUsed -= memStack.splice(stackLen).reduce((acc, val)=>acc + val, 0);
                            callStack.splice(callStackLen);
                            pushStack(exception);
                            frame = callStack[callStack.length - 1];
                            setChunkBytecode();
                            frame.ip = catchIp;
                            continue; // resume the loop without incrementing frame.ip
                        } else throw new (0, $ddbbfac842d2b47e$export$21c2d8f6d56a9f14)(exception.type, exception.message, exception.payload);
                    }
                default:
                    throw new (0, $ddbbfac842d2b47e$export$abb9271b33b89c57)(`Unexpected node while running bytecode in chunk "${frame.chunk}": ${chunkBytecode[frame.ip]}`);
            }
            // use "continue" to skip this frame.ip auto-increment
            frame.ip++;
        }
    } catch (e) {
        return {
            result: null,
            finished: false,
            error: e,
            state: getVMState()
        };
    }
}






var $88a0eb6d24c62822$exports = {};





export {$d6c46379019a9f14$export$2a71946d1fd66654 as DEFAULT_MAX_ASYNC_STEPS, $d6c46379019a9f14$export$802abc67201653ab as DEFAULT_MAX_MEMORY, $d6c46379019a9f14$export$dcf22dd285f74f3d as DEFAULT_TIMEOUT_MS, $d6c46379019a9f14$export$a6ea10a37f8d5abe as MAX_FUNCTION_ARGS_LENGTH, $d6c46379019a9f14$export$b3e3f74739b6f9fd as CALLSTACK_LENGTH, $46c45dfd262302d4$export$fa77af024d7e00a8 as execSync, $46c45dfd262302d4$export$78e3044358792147 as exec, $46c45dfd262302d4$export$cf47dcd3447a7197 as execAsync, $27b25c9e0700770a$export$bd8197d5a05a4a7e as isHogDate, $27b25c9e0700770a$export$36cb9320e67ccd70 as isHogDateTime, $27b25c9e0700770a$export$6a076491ad0da05d as isHogError, $27b25c9e0700770a$export$c2d752b32b9bf15c as newHogError, $27b25c9e0700770a$export$3bbfc8b03361d8b7 as isHogCallable, $27b25c9e0700770a$export$2fad4bf1d8756816 as isHogClosure, $27b25c9e0700770a$export$42bb9ce6d451c81e as newHogClosure, $27b25c9e0700770a$export$4160dcabb869144f as newHogCallable, $27b25c9e0700770a$export$30222d8f8abbf3d0 as isHogUpValue, $27b25c9e0700770a$export$c1885639c9f11133 as isHogAST, $66bfafebb155a286$export$ab5aad00225c5662 as Operation, $66bfafebb155a286$export$59894c102379d64a as operations, $23fc6ca6b1cb5ed8$export$ef8a2f3c50755575 as STL, $23fc6ca6b1cb5ed8$export$daf23d78d6f53989 as ASYNC_STL, $054a234da6c04610$export$4148cf4a40af9f34 as escapeString, $054a234da6c04610$export$56fe274825607f4a as escapeIdentifier, $054a234da6c04610$export$49c4ba04cdb4c4d4 as printHogValue, $054a234da6c04610$export$4c46226ec729a3dc as InsightsQLPrinter, $054a234da6c04610$export$ed243cb9e89db69e as printHogStringOutput, $ddbbfac842d2b47e$export$abb9271b33b89c57 as HogVMException, $ddbbfac842d2b47e$export$21c2d8f6d56a9f14 as UncaughtHogVMException, $ddbbfac842d2b47e$export$e94e5ec04a02879c as like, $ddbbfac842d2b47e$export$2516322ffbb7f3fb as getNestedValue, $ddbbfac842d2b47e$export$c52c7e952af52ee2 as setNestedValue, $ddbbfac842d2b47e$export$f0c387fc4f006d51 as convertJSToHog, $ddbbfac842d2b47e$export$8353e27c009c56d3 as convertHogToJS, $ddbbfac842d2b47e$export$ccac9139013839fb as calculateCost, $ddbbfac842d2b47e$export$13d90b9b2a99ed13 as unifyComparisonTypes};
//# sourceMappingURL=module.js.map

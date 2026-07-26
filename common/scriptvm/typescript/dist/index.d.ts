import crypto from "crypto";
export const DEFAULT_MAX_ASYNC_STEPS = 100;
export const DEFAULT_MAX_MEMORY: number;
export const DEFAULT_TIMEOUT_MS = 5000;
export const MAX_FUNCTION_ARGS_LENGTH = 300;
export const CALLSTACK_LENGTH = 1000;
export interface BytecodeEntry {
    bytecode: any[];
    globals?: Record<string, any>;
}
export interface VMState {
    bytecodes: Record<string, BytecodeEntry>;
    bytecode?: any[];
    stack: any[];
    upvalues: IQLUpValue[];
    callStack: CallFrame[];
    throwStack: ThrowFrame[];
    declaredFunctions: Record<string, [number, number]>;
    ops: number;
    asyncSteps: number;
    syncDuration: number;
    maxMemUsed: number;
    telemetry?: Telemetry[];
}
export interface Bytecodes {
    bytecodes: Record<string, BytecodeEntry>;
}
export interface ExecOptions {
    globals?: Record<string, any>;
    functions?: Record<string, (...args: any[]) => any>;
    asyncFunctions?: Record<string, (...args: any[]) => Promise<any>>;
    importBytecode?: (module: string) => BytecodeEntry | undefined;
    timeout?: number;
    maxAsyncSteps?: number;
    memoryLimit?: number;
    external?: {
        regex?: {
            match: (regex: string, value: string) => boolean;
        };
        crypto?: typeof crypto;
    };
    telemetry?: boolean;
    repl?: boolean;
}
export type Telemetry = [
    number,
    string,
    number,
    string,
    string
];
export interface ExecResult {
    result: any;
    finished: boolean;
    error?: any;
    asyncFunctionName?: string;
    asyncFunctionArgs?: any[];
    state?: VMState;
    telemetry?: Telemetry[];
}
export interface CallFrame {
    closure: IQLClosure;
    ip: number;
    chunk: string;
    stackStart: number;
    argCount: number;
}
export interface ThrowFrame {
    callStackLen: number;
    stackLen: number;
    catchIp: number;
}
export interface IQLDate {
    __iqlDate__: true;
    year: number;
    month: number;
    day: number;
}
export interface IQLDateTime {
    __iqlDateTime__: true;
    dt: number;
    zone: string;
}
export interface IQLError {
    __iqlError__: true;
    type: string;
    message: string;
    payload?: Record<string, any>;
}
export interface IQLCallable {
    __iqlCallable__: 'local' | 'stl' | 'async';
    name?: string;
    argCount: number;
    upvalueCount: number;
    ip: number;
    chunk: string;
}
export interface IQLUpValue {
    __iqlUpValue__: true;
    id: number;
    location: number;
    closed: boolean;
    value: any;
}
export interface IQLClosure {
    __iqlClosure__: true;
    callable: IQLCallable;
    upvalues: number[];
}
export interface IQLInterval {
    __iqlInterval__: true;
    value: number;
    unit: string;
}
export interface STLFunction {
    fn: (args: any[], name: string, options?: ExecOptions) => any;
    description: string;
    example: string;
    minArgs?: number;
    maxArgs?: number;
}
export interface AsyncSTLFunction {
    fn: (args: any[], name: string, options?: ExecOptions) => Promise<any>;
    minArgs?: number;
    maxArgs?: number;
}
export function isIQLDate(obj: any): obj is IQLDate;
export function isIQLDateTime(obj: any): obj is IQLDateTime;
export function isIQLError(obj: any): obj is IQLError;
export function newIQLError(type: string, message: string, payload?: Record<string, any>): IQLError;
export function isIQLCallable(obj: any): obj is IQLCallable;
export function isIQLClosure(obj: any): obj is IQLClosure;
export function newIQLClosure(callable: IQLCallable, upvalues?: number[]): IQLClosure;
export function newIQLCallable(type: IQLCallable['__iqlCallable__'], { name, chunk, argCount, upvalueCount, ip, }: {
    name: string;
    chunk: string;
    argCount: number;
    upvalueCount: number;
    ip: number;
}): IQLCallable;
export function isIQLUpValue(obj: any): obj is IQLUpValue;
export function isIQLAST(obj: any): boolean;
export const enum Operation {
    GET_GLOBAL = 1,
    CALL_GLOBAL = 2,
    AND = 3,
    OR = 4,
    NOT = 5,
    PLUS = 6,
    MINUS = 7,
    MULTIPLY = 8,
    DIVIDE = 9,
    MOD = 10,
    EQ = 11,
    NOT_EQ = 12,
    GT = 13,
    GT_EQ = 14,
    LT = 15,
    LT_EQ = 16,
    LIKE = 17,
    ILIKE = 18,
    NOT_LIKE = 19,
    NOT_ILIKE = 20,
    IN = 21,
    NOT_IN = 22,
    REGEX = 23,
    NOT_REGEX = 24,
    IREGEX = 25,
    NOT_IREGEX = 26,
    IN_COHORT = 27,
    NOT_IN_COHORT = 28,
    TRUE = 29,
    FALSE = 30,
    NULL = 31,
    STRING = 32,
    INTEGER = 33,
    FLOAT = 34,
    POP = 35,
    GET_LOCAL = 36,
    SET_LOCAL = 37,
    RETURN = 38,
    JUMP = 39,
    JUMP_IF_FALSE = 40,
    DECLARE_FN = 41,
    DICT = 42,
    ARRAY = 43,
    TUPLE = 44,
    GET_PROPERTY = 45,
    SET_PROPERTY = 46,
    JUMP_IF_STACK_NOT_NULL = 47,
    GET_PROPERTY_NULLISH = 48,
    THROW = 49,
    TRY = 50,
    POP_TRY = 51,
    CALLABLE = 52,
    CLOSURE = 53,
    CALL_LOCAL = 54,
    GET_UPVALUE = 55,
    SET_UPVALUE = 56,
    CLOSE_UPVALUE = 57
}
export const operations: string[];
export class ScriptVMException extends Error {
    constructor(message: string);
}
export class UncaughtScriptVMException extends ScriptVMException {
    type: any;
    payload: any;
    constructor(type: string, message: string, payload?: any);
    toString(): string;
}
export function like(string: string, pattern: string, caseInsensitive?: boolean, match?: (regex: string, value: string) => boolean): boolean;
export function getNestedValue(obj: any, chain: any[], nullish?: boolean): any;
export function setNestedValue(obj: any, chain: any[], value: any): void;
export function convertJSToHog(x: any, found?: Map<any, any>): any;
export function convertScriptToJS(x: any, found?: Map<any, any>): any;
export const convertJSToIQL: typeof convertJSToHog;
export const convertIQLToJS: typeof convertScriptToJS;
export function calculateCost(object: any, marked?: Set<any> | undefined): any;
export function unifyComparisonTypes(left: any, right: any): [any, any];
export function escapeString(value: string): string;
export function escapeIdentifier(identifier: string | number): string;
export function printIQLValue(obj: any, marked?: Set<any> | undefined): string;
export function printIQLStringOutput(obj: any): string;
type ASTNode = Map<string, any> | null;
export class InsightsQLPrinter {
    constructor(pretty?: boolean, marked?: Set<any> | undefined);
    print(node: ASTNode): string;
}
export const STL: Record<string, STLFunction>;
export const ASYNC_STL: Record<string, AsyncSTLFunction>;
export function execSync(bytecode: any[] | VMState | Bytecodes, options?: ExecOptions): any;
export function execAsync(bytecode: any[] | VMState | Bytecodes, options?: ExecOptions): Promise<ExecResult>;
export function exec(input: any[] | VMState | Bytecodes, options?: ExecOptions): ExecResult;

//# sourceMappingURL=index.d.ts.map

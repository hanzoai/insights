# InsightsQL Parser

ANTLR4-based parser for [InsightsQL](https://hanzo.ai/docs/insightsql) and [Script](https://hanzo.ai/docs/script),
available as both a Python C++ extension and a WebAssembly module for JavaScript/TypeScript.

## Packages

| Package                 | Runtime                          | Registry                                                   |
| ----------------------- | -------------------------------- | ---------------------------------------------------------- |
| `insightsql_parser`          | CPython (native C++ extension)   | [PyPI](https://pypi.org/project/insightsql-parser/)             |
| `@hanzo/insightsql-parser` | Any JS environment (WebAssembly) | [npm](https://www.npmjs.com/package/@hanzo/insightsql-parser) |

Both packages share the same C++ parser core and ANTLR4 grammar,
so they produce identical ASTs.

## npm package (`@hanzo/insightsql-parser`)

### Installation

```bash
npm install @hanzo/insightsql-parser
```

### Usage

```typescript
import createInsightsQLParser from '@hanzo/insightsql-parser'

const parser = await createInsightsQLParser()

// Parse a InsightsQL expression
const exprAST = JSON.parse(parser.parseExpr('1 + 2'))

// Parse a SELECT statement
const selectAST = JSON.parse(parser.parseSelect('SELECT event FROM events WHERE timestamp > now()'))

// Parse a Script program
const programAST = JSON.parse(parser.parseProgram('let x := 42; return x;'))
```

All parse functions return JSON strings.
On failure they return a JSON error object instead of throwing:

```typescript
const result = JSON.parse(parser.parseExpr('!!!'))
if ('error' in result) {
  console.error(result.type, result.message) // e.g. "SyntaxError ..."
}
```

### API

| Method                                        | Description                        |
| --------------------------------------------- | ---------------------------------- |
| `parseExpr(input, isInternal?)`               | Parse a InsightsQL expression           |
| `parseSelect(input, isInternal?)`             | Parse a SELECT statement           |
| `parseOrderExpr(input, isInternal?)`          | Parse an ORDER BY expression       |
| `parseProgram(input, isInternal?)`            | Parse a Script program                |
| `parseFullTemplateString(input, isInternal?)` | Parse a template string (`f'...'`) |
| `parseStringLiteralText(input)`               | Unquote a string literal           |

Setting `isInternal` to `true` omits position information from the AST.

## Python package (`insightsql_parser`)

### Installation

```bash
pip install insightsql_parser
```

The Python package is a native C++ extension and requires a platform with prebuilt wheels
(macOS and Linux, x86_64 and arm64).

### Local development

```bash
pip install ./common/insightsql_parser
```

## Building from source

### Python

```bash
pip install ./common/insightsql_parser
```

### WebAssembly

Requires the [Emscripten](https://emscripten.org/) toolchain and [Ninja](https://ninja-build.org/).

```bash
cd common/insightsql_parser
npm run build
```

This compiles the parser to WASM and places the output in `dist/`.

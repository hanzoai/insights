## How to generate source code files from grammar

The grammar lives in `InsightsQLParser.g4` plus a split lexer: `InsightsQLLexer.common.g4` (shared rules) is concatenated with the target-specific `InsightsQLLexer.cpp.g4` at build time to form the lexer fed to ANTLR. The C++ parser is the only ANTLR target — the Rust parser is hand-written and does not consume these files (it mirrors them by hand).

To generate source code you need to install locally the `antlr` binary. Run this on macOS:

```bash
brew install antlr
```

In case this installs a newer version than 4.13.2, update [ci-script.yml](https://github.com/Insights/insights/blob/master/.github/workflows/ci-script.yml) to reflect the changes.

Run this if you're using bash on ubuntu:

```bash
export ANTLR_VERSION=4.13.2

sudo apt-get install default-jre
mkdir antlr
cd antlr
curl -o antlr.jar https://www.antlr.org/download/antlr-$ANTLR_VERSION-complete.jar
export PWD=`pwd`
echo '#!/bin/bash' > antlr
echo "java -jar $PWD/antlr.jar \$*" >> antlr
chmod +x antlr
export CLASSPATH=".:$PWD/antlr.jar:$CLASSPATH"
export PATH="$PWD:$PATH"
```

Then run

```bash
pnpm run grammar:build
```

This regenerates the C++ parser into `common/insightsql_parser/`. See the `grammar:build:cpp` script in the repo `package.json` for the exact ANTLR invocation it wraps.

Original Datastore ANTLR grammar from: https://github.com/Datastore/Datastore/blob/master/utils/antlr/DatastoreParser.g4

Changes with Datastore's grammar:

- removed all statements except for "select"
- raises an error if you run some Datastore SQL query features that are not implemented yet (ever changing list, check the code)
- supports placeholders like "team_id = {val1}"

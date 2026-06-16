#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR/../../../..
rm rust/common/scriptvm/tests/static/test_programs/*.iqle
find rust/common/scriptvm/tests/static/test_programs -type f -exec bin/iqle {} \;
cd $SCRIPT_DIR

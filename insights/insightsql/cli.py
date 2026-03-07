import sys
import json

from insights.insightsql.compiler.bytecode import create_bytecode, parse_program
from insights.insightsql.compiler.javascript import to_js_program

from common.scriptvm.python.execute import execute_bytecode

modifiers = [arg for arg in sys.argv if arg.startswith("-")]
args = [arg for arg in sys.argv if arg != "" and not arg.startswith("-")]
filename = args[1]

if not filename.endswith(".iql") and not filename.endswith(".iqle"):
    raise ValueError("Filename must end with '.iql' or '.iqle'")

with open(filename) as file:
    code = file.read()

if "--compile" in modifiers and len(args) == 3 and args[2].endswith(".js"):
    target = args[2]
    js_program = to_js_program(code)
    with open(target, "w") as file:
        file.write(js_program + "\n")

else:
    if filename.endswith(".iql"):
        bytecode = create_bytecode(parse_program(code)).bytecode
    else:
        bytecode = json.loads(code)

    if "--run" in modifiers:
        if len(args) != 2:
            raise ValueError("Must specify exactly one filename")

        response = execute_bytecode(bytecode, globals=None, timeout=5, team=None, debug="--debug" in modifiers)
        for line in response.stdout:
            print(line)  # noqa: T201

    elif "--out" in modifiers:
        if len(args) != 2:
            raise ValueError("Must specify exactly one filename")
        print(json.dumps(bytecode))  # noqa: T201

    elif "--compile" in modifiers:
        if len(args) == 3:
            target = args[2]
        else:
            target = filename[:-4] + ".iqle"
            if len(args) != 2:
                raise ValueError("Must specify exactly one filename")

        # write bytecode to file
        with open(target, "w") as file:
            max_length = 120
            line = "["
            for index, op in enumerate(bytecode):
                encoded = json.dumps(op)
                if len(line) + len(encoded) > max_length - 2:
                    file.write(line + "\n")
                    line = ""
                line += (" " if len(line) > 1 else "") + encoded + ("]" if index == len(bytecode) - 1 else ",")
            if line == "[":
                file.write(line + "]\n")
            elif line != "":
                file.write(line + "\n")

    else:
        raise ValueError("Must specify either --run or --compile")

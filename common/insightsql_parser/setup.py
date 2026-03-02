import platform

from setuptools import Extension, setup

system = platform.system()
if system not in ("Darwin", "Linux"):
    raise Exception("Only Linux and macOS are supported by insightsql_parser")

is_macos = system == "Darwin"
homebrew_location = "/opt/homebrew" if platform.machine() == "arm64" else "/usr/local"

module = Extension(
    "insightsql_parser",
    sources=[
        "InsightsQLLexer.cpp",
        "InsightsQLParser.cpp",
        "InsightsQLParserBaseVisitor.cpp",
        "InsightsQLParserVisitor.cpp",
        "error.cpp",
        "string.cpp",
        "json.cpp",
        "parser_python.cpp",
    ],
    include_dirs=(
        [
            f"{homebrew_location}/include/",
            f"{homebrew_location}/include/antlr4-runtime/",
        ]
        if is_macos
        else ["/usr/include/", "/usr/include/antlr4-runtime/"]
    ),
    library_dirs=[f"{homebrew_location}/lib/"] if is_macos else ["/usr/lib/", "/usr/lib64/"],
    libraries=["antlr4-runtime"],
    extra_compile_args=["-std=c++20"],
)

setup(
    name="insightsql_parser",
    version="1.3.14",
    url="https://github.com/Insights/posthog/tree/master/common/insightsql_parser",
    description="InsightsQL parser for internal Insights use",
    author="Insights Inc.",
    author_email="hey@posthog.com",
    maintainer="Insights Inc.",
    maintainer_email="hey@posthog.com",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    packages=["insightsql_parser-stubs"],
    include_package_data=True,
    ext_modules=[module],
    python_requires=">=3.10",
    license="MIT",
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Operating System :: MacOS",
        "Operating System :: POSIX :: Linux",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)

cmake_minimum_required(VERSION 3.10)
project(insightsql_parser LANGUAGES CXX)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

FetchContent_Declare(
    antlr4
    GIT_REPOSITORY https://github.com/antlr/antlr4.git
    GIT_TAG 4.13.2
)

set(ANTLR_BUILD_CPP_TESTS OFF CACHE BOOL "" FORCE)
set(ANTLR_BUILD_SHARED OFF CACHE BOOL "" FORCE)
set(ANTLR4_WITH_STATIC_CRT OFF CACHE BOOL "" FORCE)

# Using FetchContent_Populate instead of FetchContent_MakeAvailable:
# - ANTLR4: Only need runtime/Cpp subdirectory, not the full project
FetchContent_Populate(antlr4)

add_subdirectory(${antlr4_SOURCE_DIR}/runtime/Cpp EXCLUDE_FROM_ALL)

set(ANTLR_INCLUDE_DIR ${antlr4_SOURCE_DIR}/runtime/Cpp/runtime/src/)

set(PARSER_SOURCES
    InsightsQLLexer.cpp
    InsightsQLParser.cpp
    InsightsQLParserBaseVisitor.cpp
    InsightsQLParserVisitor.cpp
    json.cpp
    error.cpp
    string.cpp
)

add_library(
    insightsql_parser
    ${PARSER_SOURCES})

target_include_directories(
    insightsql_parser
    PRIVATE ${ANTLR_INCLUDE_DIR}
)

target_link_libraries(insightsql_parser
    PRIVATE antlr4_static
)

if(EMSCRIPTEN)
    # Global: all targets (including antlr4) need native WASM exceptions
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fwasm-exceptions")

    # Shared link flags for all WASM targets
    set(WASM_COMMON_LINK_FLAGS "\
        -lembind \
        -s WASM=1 \
        -s MODULARIZE=1 \
        -s EXPORT_NAME='createInsightsQLParser' \
        -s ALLOW_MEMORY_GROWTH=1 \
        -s SINGLE_FILE=1 \
    ")

    # ESM build (for Node.js ESM — includes Node.js createRequire support)
    add_executable(insightsql_parser_wasm parser_wasm.cpp)
    target_include_directories(insightsql_parser_wasm PRIVATE ${ANTLR_INCLUDE_DIR})
    target_link_libraries(insightsql_parser_wasm PRIVATE insightsql_parser antlr4_static)
    set_target_properties(insightsql_parser_wasm PROPERTIES
        SUFFIX ".js"
        LINK_FLAGS "${WASM_COMMON_LINK_FLAGS} -s EXPORT_ES6=1"
    )

    # Browser ESM build (web/worker only — no Node.js import("module") references)
    add_executable(insightsql_parser_wasm_browser parser_wasm.cpp)
    target_include_directories(insightsql_parser_wasm_browser PRIVATE ${ANTLR_INCLUDE_DIR})
    target_link_libraries(insightsql_parser_wasm_browser PRIVATE insightsql_parser antlr4_static)
    set_target_properties(insightsql_parser_wasm_browser PROPERTIES
        OUTPUT_NAME "insightsql_parser_wasm_browser"
        SUFFIX ".js"
        LINK_FLAGS "${WASM_COMMON_LINK_FLAGS} -s EXPORT_ES6=1 -s ENVIRONMENT='web,worker'"
    )

    # CJS build (for Jest and other CommonJS environments)
    add_executable(insightsql_parser_wasm_cjs parser_wasm.cpp)
    target_include_directories(insightsql_parser_wasm_cjs PRIVATE ${ANTLR_INCLUDE_DIR})
    target_link_libraries(insightsql_parser_wasm_cjs PRIVATE insightsql_parser antlr4_static)
    set_target_properties(insightsql_parser_wasm_cjs PROPERTIES
        OUTPUT_NAME "insightsql_parser_wasm"
        SUFFIX ".cjs"
        LINK_FLAGS "${WASM_COMMON_LINK_FLAGS}"
    )

    # Install WASM outputs to dist/
    # Usage: cmake --install build_wasm --prefix .
    set(CMAKE_INSTALL_PREFIX ${PROJECT_SOURCE_DIR} CACHE PATH "" FORCE)
    install(TARGETS insightsql_parser_wasm insightsql_parser_wasm_browser insightsql_parser_wasm_cjs RUNTIME DESTINATION dist)
    install(FILES
        ${PROJECT_SOURCE_DIR}/index.d.ts
        ${PROJECT_SOURCE_DIR}/index.cjs
        DESTINATION dist
    )
endif()

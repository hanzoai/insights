#pragma once

#include <stdexcept>
#include <string>

#define ERROR_CLASS_DEFINITION(NAME, BASE)                               \
  class NAME : public BASE {                                             \
   public:                                                               \
    size_t start;                                                        \
    size_t end;                                                          \
    explicit NAME(const std::string& message, size_t start, size_t end); \
    explicit NAME(const char* message, size_t start, size_t end);        \
    explicit NAME(const std::string& message);                           \
    explicit NAME(const char* message);                                  \
  };

ERROR_CLASS_DEFINITION(InsightsQLError, std::runtime_error)

// The input does not conform to InsightsQL syntax.
ERROR_CLASS_DEFINITION(SyntaxError, InsightsQLError)

// This feature isn't implemented in InsightsQL (yet).
ERROR_CLASS_DEFINITION(NotImplementedError, InsightsQLError)

// An internal problem in the parser layer.
ERROR_CLASS_DEFINITION(ParsingError, InsightsQLError)

// Python runtime errored out somewhere - this means we must use the error it's already raised.
class PyInternalError : public std::exception {
 public:
  PyInternalError();
};

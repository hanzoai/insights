#include "error.h"

using namespace std;

#define ERROR_CLASS_IMPLEMENTATION(NAME, BASE)                                                           \
  NAME::NAME(const string& message, size_t start, size_t end) : BASE(message), start(start), end(end) {} \
  NAME::NAME(const char* message, size_t start, size_t end) : BASE(message), start(start), end(end) {}   \
  NAME::NAME(const string& message) : BASE(message), start(0), end(0) {}                                 \
  NAME::NAME(const char* message) : BASE(message), start(0), end(0) {}

ERROR_CLASS_IMPLEMENTATION(InsightsQLError, runtime_error)

ERROR_CLASS_IMPLEMENTATION(SyntaxError, InsightsQLError)
ERROR_CLASS_IMPLEMENTATION(NotImplementedError, InsightsQLError)
ERROR_CLASS_IMPLEMENTATION(ParsingError, InsightsQLError)

PyInternalError::PyInternalError() : exception() {}

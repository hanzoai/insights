// Evaluation summary limits
// This should match EVALUATION_SUMMARY_MAX_RUNS in backend/summarization/constants.py
export const EVALUATION_SUMMARY_MAX_RUNS = 250

// Compared against the string 'true', not `= true` or `= 1`: InsightsQL types $ai_evaluation_result from
// each team's own property definition, so teams that haven't registered it as Boolean extract the
// JSON bool as the string 'true' (where a numeric literal throws), while Boolean-registered teams
// still compare correctly against the string form. Reading the property directly rather than via
// JSONExtractString keeps the lookup on the properties_group_ai column and its bloom filter index.
// Same reasoning as the predicates in insights/temporal/ai_observability/eval_reports/output_types.py.
export const EVALUATION_PASSED_INSIGHTSQL = "properties.$ai_evaluation_result = 'true'"

// A skipped run was never graded, but an evaluation that disallows N/A still emits result=false
// alongside skipped=true, so any count that doesn't exclude skips reads them as failures. Mirrors
// _NOT_SKIPPED_PREDICATE in insights/temporal/ai_observability/eval_reports/output_types.py, which
// the report metrics already apply — without this the two surfaces disagree about the same runs.
export const EVALUATION_NOT_SKIPPED_INSIGHTSQL =
    "(isNull(properties.$ai_evaluation_skipped) OR properties.$ai_evaluation_skipped != 'true')"

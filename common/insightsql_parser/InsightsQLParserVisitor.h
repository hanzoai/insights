
// Generated from InsightsQLParser.g4 by ANTLR 4.13.2

#pragma once


#include "antlr4-runtime.h"
#include "InsightsQLParser.h"



/**
 * This class defines an abstract visitor for a parse tree
 * produced by InsightsQLParser.
 */
class  InsightsQLParserVisitor : public antlr4::tree::AbstractParseTreeVisitor {
public:

  /**
   * Visit parse trees produced by InsightsQLParser.
   */
    virtual std::any visitProgram(InsightsQLParser::ProgramContext *context) = 0;

    virtual std::any visitDeclaration(InsightsQLParser::DeclarationContext *context) = 0;

    virtual std::any visitExpression(InsightsQLParser::ExpressionContext *context) = 0;

    virtual std::any visitVarDecl(InsightsQLParser::VarDeclContext *context) = 0;

    virtual std::any visitIdentifierList(InsightsQLParser::IdentifierListContext *context) = 0;

    virtual std::any visitStatement(InsightsQLParser::StatementContext *context) = 0;

    virtual std::any visitReturnStmt(InsightsQLParser::ReturnStmtContext *context) = 0;

    virtual std::any visitThrowStmt(InsightsQLParser::ThrowStmtContext *context) = 0;

    virtual std::any visitCatchBlock(InsightsQLParser::CatchBlockContext *context) = 0;

    virtual std::any visitTryCatchStmt(InsightsQLParser::TryCatchStmtContext *context) = 0;

    virtual std::any visitIfStmt(InsightsQLParser::IfStmtContext *context) = 0;

    virtual std::any visitWhileStmt(InsightsQLParser::WhileStmtContext *context) = 0;

    virtual std::any visitForStmt(InsightsQLParser::ForStmtContext *context) = 0;

    virtual std::any visitForInStmt(InsightsQLParser::ForInStmtContext *context) = 0;

    virtual std::any visitFuncStmt(InsightsQLParser::FuncStmtContext *context) = 0;

    virtual std::any visitVarAssignment(InsightsQLParser::VarAssignmentContext *context) = 0;

    virtual std::any visitExprStmt(InsightsQLParser::ExprStmtContext *context) = 0;

    virtual std::any visitEmptyStmt(InsightsQLParser::EmptyStmtContext *context) = 0;

    virtual std::any visitBlock(InsightsQLParser::BlockContext *context) = 0;

    virtual std::any visitKvPair(InsightsQLParser::KvPairContext *context) = 0;

    virtual std::any visitKvPairList(InsightsQLParser::KvPairListContext *context) = 0;

    virtual std::any visitSelect(InsightsQLParser::SelectContext *context) = 0;

    virtual std::any visitSelectStmtWithParens(InsightsQLParser::SelectStmtWithParensContext *context) = 0;

    virtual std::any visitSubsequentSelectSetClause(InsightsQLParser::SubsequentSelectSetClauseContext *context) = 0;

    virtual std::any visitSelectSetStmt(InsightsQLParser::SelectSetStmtContext *context) = 0;

    virtual std::any visitLimitAndOffsetClauseOptional(InsightsQLParser::LimitAndOffsetClauseOptionalContext *context) = 0;

    virtual std::any visitSelectStmt(InsightsQLParser::SelectStmtContext *context) = 0;

    virtual std::any visitWithClause(InsightsQLParser::WithClauseContext *context) = 0;

    virtual std::any visitTopClause(InsightsQLParser::TopClauseContext *context) = 0;

    virtual std::any visitFromClause(InsightsQLParser::FromClauseContext *context) = 0;

    virtual std::any visitArrayJoinClause(InsightsQLParser::ArrayJoinClauseContext *context) = 0;

    virtual std::any visitWindowClause(InsightsQLParser::WindowClauseContext *context) = 0;

    virtual std::any visitPrewhereClause(InsightsQLParser::PrewhereClauseContext *context) = 0;

    virtual std::any visitWhereClause(InsightsQLParser::WhereClauseContext *context) = 0;

    virtual std::any visitGroupByClause(InsightsQLParser::GroupByClauseContext *context) = 0;

    virtual std::any visitGroupingSetList(InsightsQLParser::GroupingSetListContext *context) = 0;

    virtual std::any visitGroupingSet(InsightsQLParser::GroupingSetContext *context) = 0;

    virtual std::any visitHavingClause(InsightsQLParser::HavingClauseContext *context) = 0;

    virtual std::any visitQualifyClause(InsightsQLParser::QualifyClauseContext *context) = 0;

    virtual std::any visitOrderByClause(InsightsQLParser::OrderByClauseContext *context) = 0;

    virtual std::any visitInterpolateClause(InsightsQLParser::InterpolateClauseContext *context) = 0;

    virtual std::any visitProjectionOrderByClause(InsightsQLParser::ProjectionOrderByClauseContext *context) = 0;

    virtual std::any visitLimitByClause(InsightsQLParser::LimitByClauseContext *context) = 0;

    virtual std::any visitLimitAndOffsetClause(InsightsQLParser::LimitAndOffsetClauseContext *context) = 0;

    virtual std::any visitOffsetOnlyClause(InsightsQLParser::OffsetOnlyClauseContext *context) = 0;

    virtual std::any visitSettingsClause(InsightsQLParser::SettingsClauseContext *context) = 0;

    virtual std::any visitValuesClause(InsightsQLParser::ValuesClauseContext *context) = 0;

    virtual std::any visitValuesRow(InsightsQLParser::ValuesRowContext *context) = 0;

    virtual std::any visitJoinExprPositional(InsightsQLParser::JoinExprPositionalContext *context) = 0;

    virtual std::any visitJoinExprOp(InsightsQLParser::JoinExprOpContext *context) = 0;

    virtual std::any visitJoinExprTable(InsightsQLParser::JoinExprTableContext *context) = 0;

    virtual std::any visitJoinExprUnpivot(InsightsQLParser::JoinExprUnpivotContext *context) = 0;

    virtual std::any visitJoinExprParens(InsightsQLParser::JoinExprParensContext *context) = 0;

    virtual std::any visitJoinExprCrossOp(InsightsQLParser::JoinExprCrossOpContext *context) = 0;

    virtual std::any visitJoinExprPivot(InsightsQLParser::JoinExprPivotContext *context) = 0;

    virtual std::any visitJoinOpInner(InsightsQLParser::JoinOpInnerContext *context) = 0;

    virtual std::any visitJoinOpLeftRight(InsightsQLParser::JoinOpLeftRightContext *context) = 0;

    virtual std::any visitJoinOpFull(InsightsQLParser::JoinOpFullContext *context) = 0;

    virtual std::any visitJoinOpCross(InsightsQLParser::JoinOpCrossContext *context) = 0;

    virtual std::any visitJoinConstraintClause(InsightsQLParser::JoinConstraintClauseContext *context) = 0;

    virtual std::any visitSampleClause(InsightsQLParser::SampleClauseContext *context) = 0;

    virtual std::any visitLimitExpr(InsightsQLParser::LimitExprContext *context) = 0;

    virtual std::any visitOrderExprList(InsightsQLParser::OrderExprListContext *context) = 0;

    virtual std::any visitOrderExpr(InsightsQLParser::OrderExprContext *context) = 0;

    virtual std::any visitWithFillClause(InsightsQLParser::WithFillClauseContext *context) = 0;

    virtual std::any visitInterpolateExpr(InsightsQLParser::InterpolateExprContext *context) = 0;

    virtual std::any visitRatioExpr(InsightsQLParser::RatioExprContext *context) = 0;

    virtual std::any visitSettingExprList(InsightsQLParser::SettingExprListContext *context) = 0;

    virtual std::any visitSettingExpr(InsightsQLParser::SettingExprContext *context) = 0;

    virtual std::any visitWindowExpr(InsightsQLParser::WindowExprContext *context) = 0;

    virtual std::any visitWinPartitionByClause(InsightsQLParser::WinPartitionByClauseContext *context) = 0;

    virtual std::any visitWinOrderByClause(InsightsQLParser::WinOrderByClauseContext *context) = 0;

    virtual std::any visitWithinGroupClause(InsightsQLParser::WithinGroupClauseContext *context) = 0;

    virtual std::any visitWinFrameClause(InsightsQLParser::WinFrameClauseContext *context) = 0;

    virtual std::any visitFrameStart(InsightsQLParser::FrameStartContext *context) = 0;

    virtual std::any visitFrameBetween(InsightsQLParser::FrameBetweenContext *context) = 0;

    virtual std::any visitWinFrameBound(InsightsQLParser::WinFrameBoundContext *context) = 0;

    virtual std::any visitExpr(InsightsQLParser::ExprContext *context) = 0;

    virtual std::any visitColumnTypeExprNested(InsightsQLParser::ColumnTypeExprNestedContext *context) = 0;

    virtual std::any visitColumnTypeExprParam(InsightsQLParser::ColumnTypeExprParamContext *context) = 0;

    virtual std::any visitColumnTypeExprArray(InsightsQLParser::ColumnTypeExprArrayContext *context) = 0;

    virtual std::any visitColumnTypeExprComplex(InsightsQLParser::ColumnTypeExprComplexContext *context) = 0;

    virtual std::any visitColumnTypeExprSimple(InsightsQLParser::ColumnTypeExprSimpleContext *context) = 0;

    virtual std::any visitColumnTypeExprEnum(InsightsQLParser::ColumnTypeExprEnumContext *context) = 0;

    virtual std::any visitColumnTypeExprCompound(InsightsQLParser::ColumnTypeExprCompoundContext *context) = 0;

    virtual std::any visitColumnTypeCastExprWithTimeZone(InsightsQLParser::ColumnTypeCastExprWithTimeZoneContext *context) = 0;

    virtual std::any visitColumnTypeCastExprSimple(InsightsQLParser::ColumnTypeCastExprSimpleContext *context) = 0;

    virtual std::any visitColumnTypeCastIdentifier(InsightsQLParser::ColumnTypeCastIdentifierContext *context) = 0;

    virtual std::any visitKeywordForTypeCast(InsightsQLParser::KeywordForTypeCastContext *context) = 0;

    virtual std::any visitColumnExprList(InsightsQLParser::ColumnExprListContext *context) = 0;

    virtual std::any visitSelectColumnExprListBeforeFromTrailingComma(InsightsQLParser::SelectColumnExprListBeforeFromTrailingCommaContext *context) = 0;

    virtual std::any visitSelectColumnExprListBeforeFromPlain(InsightsQLParser::SelectColumnExprListBeforeFromPlainContext *context) = 0;

    virtual std::any visitSelectColumnExprList(InsightsQLParser::SelectColumnExprListContext *context) = 0;

    virtual std::any visitColumnExprAliasBefore(InsightsQLParser::ColumnExprAliasBeforeContext *context) = 0;

    virtual std::any visitColumnExprInvalidFromImplicitAlias(InsightsQLParser::ColumnExprInvalidFromImplicitAliasContext *context) = 0;

    virtual std::any visitColumnExprSelectValue(InsightsQLParser::ColumnExprSelectValueContext *context) = 0;

    virtual std::any visitColumnExprAliasImplicit(InsightsQLParser::ColumnExprAliasImplicitContext *context) = 0;

    virtual std::any visitColumnExprTernaryOp(InsightsQLParser::ColumnExprTernaryOpContext *context) = 0;

    virtual std::any visitColumnExprAlias(InsightsQLParser::ColumnExprAliasContext *context) = 0;

    virtual std::any visitColumnExprAnd(InsightsQLParser::ColumnExprAndContext *context) = 0;

    virtual std::any visitColumnExprValuePassthrough(InsightsQLParser::ColumnExprValuePassthroughContext *context) = 0;

    virtual std::any visitColumnExprOr(InsightsQLParser::ColumnExprOrContext *context) = 0;

    virtual std::any visitColumnExprColumnsAll(InsightsQLParser::ColumnExprColumnsAllContext *context) = 0;

    virtual std::any visitColumnExprNegate(InsightsQLParser::ColumnExprNegateContext *context) = 0;

    virtual std::any visitColumnExprLiteral(InsightsQLParser::ColumnExprLiteralContext *context) = 0;

    virtual std::any visitColumnExprArray(InsightsQLParser::ColumnExprArrayContext *context) = 0;

    virtual std::any visitColumnExprPrecedence1(InsightsQLParser::ColumnExprPrecedence1Context *context) = 0;

    virtual std::any visitColumnExprPrecedence2(InsightsQLParser::ColumnExprPrecedence2Context *context) = 0;

    virtual std::any visitColumnExprNullSafeEq(InsightsQLParser::ColumnExprNullSafeEqContext *context) = 0;

    virtual std::any visitColumnExprPrecedence3(InsightsQLParser::ColumnExprPrecedence3Context *context) = 0;

    virtual std::any visitColumnExprInterval(InsightsQLParser::ColumnExprIntervalContext *context) = 0;

    virtual std::any visitColumnExprIsNull(InsightsQLParser::ColumnExprIsNullContext *context) = 0;

    virtual std::any visitColumnExprWinFunctionTarget(InsightsQLParser::ColumnExprWinFunctionTargetContext *context) = 0;

    virtual std::any visitColumnExprNamedArg(InsightsQLParser::ColumnExprNamedArgContext *context) = 0;

    virtual std::any visitColumnExprNullPropertyAccess(InsightsQLParser::ColumnExprNullPropertyAccessContext *context) = 0;

    virtual std::any visitColumnExprIntervalString(InsightsQLParser::ColumnExprIntervalStringContext *context) = 0;

    virtual std::any visitColumnExprTagElement(InsightsQLParser::ColumnExprTagElementContext *context) = 0;

    virtual std::any visitColumnExprCall(InsightsQLParser::ColumnExprCallContext *context) = 0;

    virtual std::any visitColumnExprArrayAccess(InsightsQLParser::ColumnExprArrayAccessContext *context) = 0;

    virtual std::any visitColumnExprBetween(InsightsQLParser::ColumnExprBetweenContext *context) = 0;

    virtual std::any visitColumnExprParens(InsightsQLParser::ColumnExprParensContext *context) = 0;

    virtual std::any visitColumnExprTimestamp(InsightsQLParser::ColumnExprTimestampContext *context) = 0;

    virtual std::any visitColumnExprColumnsQualifiedExclude(InsightsQLParser::ColumnExprColumnsQualifiedExcludeContext *context) = 0;

    virtual std::any visitColumnExprNot(InsightsQLParser::ColumnExprNotContext *context) = 0;

    virtual std::any visitColumnExprFunction(InsightsQLParser::ColumnExprFunctionContext *context) = 0;

    virtual std::any visitColumnExprDict(InsightsQLParser::ColumnExprDictContext *context) = 0;

    virtual std::any visitColumnExprSubquery(InsightsQLParser::ColumnExprSubqueryContext *context) = 0;

    virtual std::any visitColumnExprSubstring(InsightsQLParser::ColumnExprSubstringContext *context) = 0;

    virtual std::any visitColumnExprCast(InsightsQLParser::ColumnExprCastContext *context) = 0;

    virtual std::any visitColumnExprArraySlice(InsightsQLParser::ColumnExprArraySliceContext *context) = 0;

    virtual std::any visitColumnExprColumnsQualifiedReplace(InsightsQLParser::ColumnExprColumnsQualifiedReplaceContext *context) = 0;

    virtual std::any visitColumnExprNullTupleAccess(InsightsQLParser::ColumnExprNullTupleAccessContext *context) = 0;

    virtual std::any visitColumnExprFunctionWithinGroup(InsightsQLParser::ColumnExprFunctionWithinGroupContext *context) = 0;

    virtual std::any visitColumnExprPositional(InsightsQLParser::ColumnExprPositionalContext *context) = 0;

    virtual std::any visitColumnExprColumnsRegex(InsightsQLParser::ColumnExprColumnsRegexContext *context) = 0;

    virtual std::any visitColumnExprTypeCast(InsightsQLParser::ColumnExprTypeCastContext *context) = 0;

    virtual std::any visitColumnExprIsDistinctFrom(InsightsQLParser::ColumnExprIsDistinctFromContext *context) = 0;

    virtual std::any visitColumnExprSpreadColumnsList(InsightsQLParser::ColumnExprSpreadColumnsListContext *context) = 0;

    virtual std::any visitColumnExprColumnsExcludeReplace(InsightsQLParser::ColumnExprColumnsExcludeReplaceContext *context) = 0;

    virtual std::any visitColumnExprColumnsQualifiedExcludeReplace(InsightsQLParser::ColumnExprColumnsQualifiedExcludeReplaceContext *context) = 0;

    virtual std::any visitColumnExprColumnsExclude(InsightsQLParser::ColumnExprColumnsExcludeContext *context) = 0;

    virtual std::any visitColumnExprColonLambda(InsightsQLParser::ColumnExprColonLambdaContext *context) = 0;

    virtual std::any visitColumnExprCallSelect(InsightsQLParser::ColumnExprCallSelectContext *context) = 0;

    virtual std::any visitColumnExprColumnsQualifiedAll(InsightsQLParser::ColumnExprColumnsQualifiedAllContext *context) = 0;

    virtual std::any visitColumnExprTrim(InsightsQLParser::ColumnExprTrimContext *context) = 0;

    virtual std::any visitColumnExprTemplateString(InsightsQLParser::ColumnExprTemplateStringContext *context) = 0;

    virtual std::any visitColumnExprTuple(InsightsQLParser::ColumnExprTupleContext *context) = 0;

    virtual std::any visitColumnExprTryCast(InsightsQLParser::ColumnExprTryCastContext *context) = 0;

    virtual std::any visitColumnExprColumnsList(InsightsQLParser::ColumnExprColumnsListContext *context) = 0;

    virtual std::any visitColumnExprColumnsReplace(InsightsQLParser::ColumnExprColumnsReplaceContext *context) = 0;

    virtual std::any visitColumnExprSpreadColumnsRegex(InsightsQLParser::ColumnExprSpreadColumnsRegexContext *context) = 0;

    virtual std::any visitColumnExprPropertyAccess(InsightsQLParser::ColumnExprPropertyAccessContext *context) = 0;

    virtual std::any visitColumnExprNullArrayAccess(InsightsQLParser::ColumnExprNullArrayAccessContext *context) = 0;

    virtual std::any visitColumnExprIgnoreNulls(InsightsQLParser::ColumnExprIgnoreNullsContext *context) = 0;

    virtual std::any visitColumnExprNullish(InsightsQLParser::ColumnExprNullishContext *context) = 0;

    virtual std::any visitColumnExprTupleAccess(InsightsQLParser::ColumnExprTupleAccessContext *context) = 0;

    virtual std::any visitColumnExprCase(InsightsQLParser::ColumnExprCaseContext *context) = 0;

    virtual std::any visitColumnExprDate(InsightsQLParser::ColumnExprDateContext *context) = 0;

    virtual std::any visitColumnExprWinFunction(InsightsQLParser::ColumnExprWinFunctionContext *context) = 0;

    virtual std::any visitColumnExprLambda(InsightsQLParser::ColumnExprLambdaContext *context) = 0;

    virtual std::any visitColumnExprIdentifier(InsightsQLParser::ColumnExprIdentifierContext *context) = 0;

    virtual std::any visitColumnExprAsterisk(InsightsQLParser::ColumnExprAsteriskContext *context) = 0;

    virtual std::any visitArrowLambda(InsightsQLParser::ArrowLambdaContext *context) = 0;

    virtual std::any visitColonLambda(InsightsQLParser::ColonLambdaContext *context) = 0;

    virtual std::any visitColumnsReplaceList(InsightsQLParser::ColumnsReplaceListContext *context) = 0;

    virtual std::any visitColumnsReplaceItem(InsightsQLParser::ColumnsReplaceItemContext *context) = 0;

    virtual std::any visitHogqlxChildElement(InsightsQLParser::HogqlxChildElementContext *context) = 0;

    virtual std::any visitHogqlxText(InsightsQLParser::HogqlxTextContext *context) = 0;

    virtual std::any visitHogqlxTagElementClosed(InsightsQLParser::HogqlxTagElementClosedContext *context) = 0;

    virtual std::any visitHogqlxTagElementNested(InsightsQLParser::HogqlxTagElementNestedContext *context) = 0;

    virtual std::any visitHogqlxTagAttribute(InsightsQLParser::HogqlxTagAttributeContext *context) = 0;

    virtual std::any visitWithExprList(InsightsQLParser::WithExprListContext *context) = 0;

    virtual std::any visitWithExprSubquery(InsightsQLParser::WithExprSubqueryContext *context) = 0;

    virtual std::any visitWithExprColumn(InsightsQLParser::WithExprColumnContext *context) = 0;

    virtual std::any visitWithExprColumnNameList(InsightsQLParser::WithExprColumnNameListContext *context) = 0;

    virtual std::any visitColumnIdentifier(InsightsQLParser::ColumnIdentifierContext *context) = 0;

    virtual std::any visitNestedIdentifier(InsightsQLParser::NestedIdentifierContext *context) = 0;

    virtual std::any visitTableExprTag(InsightsQLParser::TableExprTagContext *context) = 0;

    virtual std::any visitTableExprIdentifier(InsightsQLParser::TableExprIdentifierContext *context) = 0;

    virtual std::any visitTableExprPlaceholder(InsightsQLParser::TableExprPlaceholderContext *context) = 0;

    virtual std::any visitTableExprSubquery(InsightsQLParser::TableExprSubqueryContext *context) = 0;

    virtual std::any visitTableExprPivot(InsightsQLParser::TableExprPivotContext *context) = 0;

    virtual std::any visitTableExprValues(InsightsQLParser::TableExprValuesContext *context) = 0;

    virtual std::any visitTableExprAlias(InsightsQLParser::TableExprAliasContext *context) = 0;

    virtual std::any visitTableExprFunction(InsightsQLParser::TableExprFunctionContext *context) = 0;

    virtual std::any visitTableExprUnpivot(InsightsQLParser::TableExprUnpivotContext *context) = 0;

    virtual std::any visitPivotColumnList(InsightsQLParser::PivotColumnListContext *context) = 0;

    virtual std::any visitPivotColumn(InsightsQLParser::PivotColumnContext *context) = 0;

    virtual std::any visitUnpivotColumnList(InsightsQLParser::UnpivotColumnListContext *context) = 0;

    virtual std::any visitUnpivotColumn(InsightsQLParser::UnpivotColumnContext *context) = 0;

    virtual std::any visitColumnExprTupleOrSingle(InsightsQLParser::ColumnExprTupleOrSingleContext *context) = 0;

    virtual std::any visitColumnAliases(InsightsQLParser::ColumnAliasesContext *context) = 0;

    virtual std::any visitTableFunctionExpr(InsightsQLParser::TableFunctionExprContext *context) = 0;

    virtual std::any visitTableIdentifier(InsightsQLParser::TableIdentifierContext *context) = 0;

    virtual std::any visitTableArgList(InsightsQLParser::TableArgListContext *context) = 0;

    virtual std::any visitDatabaseIdentifier(InsightsQLParser::DatabaseIdentifierContext *context) = 0;

    virtual std::any visitFloatingLiteral(InsightsQLParser::FloatingLiteralContext *context) = 0;

    virtual std::any visitNumberLiteral(InsightsQLParser::NumberLiteralContext *context) = 0;

    virtual std::any visitLiteral(InsightsQLParser::LiteralContext *context) = 0;

    virtual std::any visitInterval(InsightsQLParser::IntervalContext *context) = 0;

    virtual std::any visitKeyword(InsightsQLParser::KeywordContext *context) = 0;

    virtual std::any visitKeywordForAlias(InsightsQLParser::KeywordForAliasContext *context) = 0;

    virtual std::any visitKeywordForImplicitAlias(InsightsQLParser::KeywordForImplicitAliasContext *context) = 0;

    virtual std::any visitAlias(InsightsQLParser::AliasContext *context) = 0;

    virtual std::any visitImplicitAlias(InsightsQLParser::ImplicitAliasContext *context) = 0;

    virtual std::any visitIdentifier(InsightsQLParser::IdentifierContext *context) = 0;

    virtual std::any visitEnumValue(InsightsQLParser::EnumValueContext *context) = 0;

    virtual std::any visitPlaceholder(InsightsQLParser::PlaceholderContext *context) = 0;

    virtual std::any visitString(InsightsQLParser::StringContext *context) = 0;

    virtual std::any visitTemplateString(InsightsQLParser::TemplateStringContext *context) = 0;

    virtual std::any visitStringContents(InsightsQLParser::StringContentsContext *context) = 0;

    virtual std::any visitFullTemplateString(InsightsQLParser::FullTemplateStringContext *context) = 0;

    virtual std::any visitStringContentsFull(InsightsQLParser::StringContentsFullContext *context) = 0;


};


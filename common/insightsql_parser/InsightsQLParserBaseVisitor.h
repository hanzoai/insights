
// Generated from InsightsQLParser.g4 by ANTLR 4.13.2

#pragma once


#include "antlr4-runtime.h"
#include "InsightsQLParserVisitor.h"


/**
 * This class provides an empty implementation of InsightsQLParserVisitor, which can be
 * extended to create a visitor which only needs to handle a subset of the available methods.
 */
class  InsightsQLParserBaseVisitor : public InsightsQLParserVisitor {
public:

  virtual std::any visitProgram(InsightsQLParser::ProgramContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitDeclaration(InsightsQLParser::DeclarationContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitExpression(InsightsQLParser::ExpressionContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitVarDecl(InsightsQLParser::VarDeclContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitIdentifierList(InsightsQLParser::IdentifierListContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitStatement(InsightsQLParser::StatementContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitReturnStmt(InsightsQLParser::ReturnStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitThrowStmt(InsightsQLParser::ThrowStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitCatchBlock(InsightsQLParser::CatchBlockContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTryCatchStmt(InsightsQLParser::TryCatchStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitIfStmt(InsightsQLParser::IfStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWhileStmt(InsightsQLParser::WhileStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitForStmt(InsightsQLParser::ForStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitForInStmt(InsightsQLParser::ForInStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitFuncStmt(InsightsQLParser::FuncStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitVarAssignment(InsightsQLParser::VarAssignmentContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitExprStmt(InsightsQLParser::ExprStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitEmptyStmt(InsightsQLParser::EmptyStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitBlock(InsightsQLParser::BlockContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitKvPair(InsightsQLParser::KvPairContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitKvPairList(InsightsQLParser::KvPairListContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitSelect(InsightsQLParser::SelectContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitSelectStmtWithParens(InsightsQLParser::SelectStmtWithParensContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitSubsequentSelectSetClause(InsightsQLParser::SubsequentSelectSetClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitSelectSetStmt(InsightsQLParser::SelectSetStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitSelectStmt(InsightsQLParser::SelectStmtContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWithClause(InsightsQLParser::WithClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTopClause(InsightsQLParser::TopClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitFromClause(InsightsQLParser::FromClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitArrayJoinClause(InsightsQLParser::ArrayJoinClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWindowClause(InsightsQLParser::WindowClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitPrewhereClause(InsightsQLParser::PrewhereClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWhereClause(InsightsQLParser::WhereClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitGroupByClause(InsightsQLParser::GroupByClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitHavingClause(InsightsQLParser::HavingClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitOrderByClause(InsightsQLParser::OrderByClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitProjectionOrderByClause(InsightsQLParser::ProjectionOrderByClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitLimitByClause(InsightsQLParser::LimitByClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitLimitAndOffsetClause(InsightsQLParser::LimitAndOffsetClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitOffsetOnlyClause(InsightsQLParser::OffsetOnlyClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitSettingsClause(InsightsQLParser::SettingsClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitJoinExprOp(InsightsQLParser::JoinExprOpContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitJoinExprTable(InsightsQLParser::JoinExprTableContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitJoinExprParens(InsightsQLParser::JoinExprParensContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitJoinExprCrossOp(InsightsQLParser::JoinExprCrossOpContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitJoinOpInner(InsightsQLParser::JoinOpInnerContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitJoinOpLeftRight(InsightsQLParser::JoinOpLeftRightContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitJoinOpFull(InsightsQLParser::JoinOpFullContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitJoinOpCross(InsightsQLParser::JoinOpCrossContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitJoinConstraintClause(InsightsQLParser::JoinConstraintClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitSampleClause(InsightsQLParser::SampleClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitLimitExpr(InsightsQLParser::LimitExprContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitOrderExprList(InsightsQLParser::OrderExprListContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitOrderExpr(InsightsQLParser::OrderExprContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitRatioExpr(InsightsQLParser::RatioExprContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitSettingExprList(InsightsQLParser::SettingExprListContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitSettingExpr(InsightsQLParser::SettingExprContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWindowExpr(InsightsQLParser::WindowExprContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWinPartitionByClause(InsightsQLParser::WinPartitionByClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWinOrderByClause(InsightsQLParser::WinOrderByClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWinFrameClause(InsightsQLParser::WinFrameClauseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitFrameStart(InsightsQLParser::FrameStartContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitFrameBetween(InsightsQLParser::FrameBetweenContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWinFrameBound(InsightsQLParser::WinFrameBoundContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitExpr(InsightsQLParser::ExprContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnTypeExprSimple(InsightsQLParser::ColumnTypeExprSimpleContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnTypeExprNested(InsightsQLParser::ColumnTypeExprNestedContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnTypeExprEnum(InsightsQLParser::ColumnTypeExprEnumContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnTypeExprComplex(InsightsQLParser::ColumnTypeExprComplexContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnTypeExprParam(InsightsQLParser::ColumnTypeExprParamContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprList(InsightsQLParser::ColumnExprListContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprTernaryOp(InsightsQLParser::ColumnExprTernaryOpContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprAlias(InsightsQLParser::ColumnExprAliasContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprNegate(InsightsQLParser::ColumnExprNegateContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprDict(InsightsQLParser::ColumnExprDictContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprSubquery(InsightsQLParser::ColumnExprSubqueryContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprLiteral(InsightsQLParser::ColumnExprLiteralContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprArray(InsightsQLParser::ColumnExprArrayContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprSubstring(InsightsQLParser::ColumnExprSubstringContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprCast(InsightsQLParser::ColumnExprCastContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprOr(InsightsQLParser::ColumnExprOrContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprNullTupleAccess(InsightsQLParser::ColumnExprNullTupleAccessContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprTypeCast(InsightsQLParser::ColumnExprTypeCastContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprPrecedence1(InsightsQLParser::ColumnExprPrecedence1Context *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprPrecedence2(InsightsQLParser::ColumnExprPrecedence2Context *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprPrecedence3(InsightsQLParser::ColumnExprPrecedence3Context *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprInterval(InsightsQLParser::ColumnExprIntervalContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprCallSelect(InsightsQLParser::ColumnExprCallSelectContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprIsNull(InsightsQLParser::ColumnExprIsNullContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprWinFunctionTarget(InsightsQLParser::ColumnExprWinFunctionTargetContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprNullPropertyAccess(InsightsQLParser::ColumnExprNullPropertyAccessContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprIntervalString(InsightsQLParser::ColumnExprIntervalStringContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprTrim(InsightsQLParser::ColumnExprTrimContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprTagElement(InsightsQLParser::ColumnExprTagElementContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprTemplateString(InsightsQLParser::ColumnExprTemplateStringContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprTuple(InsightsQLParser::ColumnExprTupleContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprCall(InsightsQLParser::ColumnExprCallContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprArrayAccess(InsightsQLParser::ColumnExprArrayAccessContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprBetween(InsightsQLParser::ColumnExprBetweenContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprPropertyAccess(InsightsQLParser::ColumnExprPropertyAccessContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprParens(InsightsQLParser::ColumnExprParensContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprNullArrayAccess(InsightsQLParser::ColumnExprNullArrayAccessContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprTimestamp(InsightsQLParser::ColumnExprTimestampContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprNullish(InsightsQLParser::ColumnExprNullishContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprAnd(InsightsQLParser::ColumnExprAndContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprTupleAccess(InsightsQLParser::ColumnExprTupleAccessContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprCase(InsightsQLParser::ColumnExprCaseContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprDate(InsightsQLParser::ColumnExprDateContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprNot(InsightsQLParser::ColumnExprNotContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprWinFunction(InsightsQLParser::ColumnExprWinFunctionContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprLambda(InsightsQLParser::ColumnExprLambdaContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprIdentifier(InsightsQLParser::ColumnExprIdentifierContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprFunction(InsightsQLParser::ColumnExprFunctionContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnExprAsterisk(InsightsQLParser::ColumnExprAsteriskContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnLambdaExpr(InsightsQLParser::ColumnLambdaExprContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitHogqlxChildElement(InsightsQLParser::HogqlxChildElementContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitHogqlxText(InsightsQLParser::HogqlxTextContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitHogqlxTagElementClosed(InsightsQLParser::HogqlxTagElementClosedContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitHogqlxTagElementNested(InsightsQLParser::HogqlxTagElementNestedContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitHogqlxTagAttribute(InsightsQLParser::HogqlxTagAttributeContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWithExprList(InsightsQLParser::WithExprListContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWithExprSubquery(InsightsQLParser::WithExprSubqueryContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitWithExprColumn(InsightsQLParser::WithExprColumnContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitColumnIdentifier(InsightsQLParser::ColumnIdentifierContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitNestedIdentifier(InsightsQLParser::NestedIdentifierContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTableExprTag(InsightsQLParser::TableExprTagContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTableExprIdentifier(InsightsQLParser::TableExprIdentifierContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTableExprPlaceholder(InsightsQLParser::TableExprPlaceholderContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTableExprSubquery(InsightsQLParser::TableExprSubqueryContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTableExprAlias(InsightsQLParser::TableExprAliasContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTableExprFunction(InsightsQLParser::TableExprFunctionContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTableFunctionExpr(InsightsQLParser::TableFunctionExprContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTableIdentifier(InsightsQLParser::TableIdentifierContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTableArgList(InsightsQLParser::TableArgListContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitDatabaseIdentifier(InsightsQLParser::DatabaseIdentifierContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitFloatingLiteral(InsightsQLParser::FloatingLiteralContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitNumberLiteral(InsightsQLParser::NumberLiteralContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitLiteral(InsightsQLParser::LiteralContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitInterval(InsightsQLParser::IntervalContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitKeyword(InsightsQLParser::KeywordContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitKeywordForAlias(InsightsQLParser::KeywordForAliasContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitAlias(InsightsQLParser::AliasContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitIdentifier(InsightsQLParser::IdentifierContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitEnumValue(InsightsQLParser::EnumValueContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitPlaceholder(InsightsQLParser::PlaceholderContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitString(InsightsQLParser::StringContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitTemplateString(InsightsQLParser::TemplateStringContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitStringContents(InsightsQLParser::StringContentsContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitFullTemplateString(InsightsQLParser::FullTemplateStringContext *ctx) override {
    return visitChildren(ctx);
  }

  virtual std::any visitStringContentsFull(InsightsQLParser::StringContentsFullContext *ctx) override {
    return visitChildren(ctx);
  }


};


# Generated from InsightsQLParser.g4 by ANTLR 4.13.2
from antlr4 import *
if "." in __name__:
    from .InsightsQLParser import InsightsQLParser
else:
    from InsightsQLParser import InsightsQLParser

# This class defines a complete generic visitor for a parse tree produced by InsightsQLParser.

class InsightsQLParserVisitor(ParseTreeVisitor):

    # Visit a parse tree produced by InsightsQLParser#program.
    def visitProgram(self, ctx:InsightsQLParser.ProgramContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#declaration.
    def visitDeclaration(self, ctx:InsightsQLParser.DeclarationContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#expression.
    def visitExpression(self, ctx:InsightsQLParser.ExpressionContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#varDecl.
    def visitVarDecl(self, ctx:InsightsQLParser.VarDeclContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#identifierList.
    def visitIdentifierList(self, ctx:InsightsQLParser.IdentifierListContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#statement.
    def visitStatement(self, ctx:InsightsQLParser.StatementContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#returnStmt.
    def visitReturnStmt(self, ctx:InsightsQLParser.ReturnStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#throwStmt.
    def visitThrowStmt(self, ctx:InsightsQLParser.ThrowStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#catchBlock.
    def visitCatchBlock(self, ctx:InsightsQLParser.CatchBlockContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#tryCatchStmt.
    def visitTryCatchStmt(self, ctx:InsightsQLParser.TryCatchStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ifStmt.
    def visitIfStmt(self, ctx:InsightsQLParser.IfStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#whileStmt.
    def visitWhileStmt(self, ctx:InsightsQLParser.WhileStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#forStmt.
    def visitForStmt(self, ctx:InsightsQLParser.ForStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#forInStmt.
    def visitForInStmt(self, ctx:InsightsQLParser.ForInStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#funcStmt.
    def visitFuncStmt(self, ctx:InsightsQLParser.FuncStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#varAssignment.
    def visitVarAssignment(self, ctx:InsightsQLParser.VarAssignmentContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#exprStmt.
    def visitExprStmt(self, ctx:InsightsQLParser.ExprStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#emptyStmt.
    def visitEmptyStmt(self, ctx:InsightsQLParser.EmptyStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#block.
    def visitBlock(self, ctx:InsightsQLParser.BlockContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#kvPair.
    def visitKvPair(self, ctx:InsightsQLParser.KvPairContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#kvPairList.
    def visitKvPairList(self, ctx:InsightsQLParser.KvPairListContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#select.
    def visitSelect(self, ctx:InsightsQLParser.SelectContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#selectStmtWithParens.
    def visitSelectStmtWithParens(self, ctx:InsightsQLParser.SelectStmtWithParensContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#subsequentSelectSetClause.
    def visitSubsequentSelectSetClause(self, ctx:InsightsQLParser.SubsequentSelectSetClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#selectSetStmt.
    def visitSelectSetStmt(self, ctx:InsightsQLParser.SelectSetStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#selectStmt.
    def visitSelectStmt(self, ctx:InsightsQLParser.SelectStmtContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#withClause.
    def visitWithClause(self, ctx:InsightsQLParser.WithClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#topClause.
    def visitTopClause(self, ctx:InsightsQLParser.TopClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#fromClause.
    def visitFromClause(self, ctx:InsightsQLParser.FromClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#arrayJoinClause.
    def visitArrayJoinClause(self, ctx:InsightsQLParser.ArrayJoinClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#windowClause.
    def visitWindowClause(self, ctx:InsightsQLParser.WindowClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#prewhereClause.
    def visitPrewhereClause(self, ctx:InsightsQLParser.PrewhereClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#whereClause.
    def visitWhereClause(self, ctx:InsightsQLParser.WhereClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#groupByClause.
    def visitGroupByClause(self, ctx:InsightsQLParser.GroupByClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#havingClause.
    def visitHavingClause(self, ctx:InsightsQLParser.HavingClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#orderByClause.
    def visitOrderByClause(self, ctx:InsightsQLParser.OrderByClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#projectionOrderByClause.
    def visitProjectionOrderByClause(self, ctx:InsightsQLParser.ProjectionOrderByClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#limitByClause.
    def visitLimitByClause(self, ctx:InsightsQLParser.LimitByClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#limitAndOffsetClause.
    def visitLimitAndOffsetClause(self, ctx:InsightsQLParser.LimitAndOffsetClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#offsetOnlyClause.
    def visitOffsetOnlyClause(self, ctx:InsightsQLParser.OffsetOnlyClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#settingsClause.
    def visitSettingsClause(self, ctx:InsightsQLParser.SettingsClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#JoinExprOp.
    def visitJoinExprOp(self, ctx:InsightsQLParser.JoinExprOpContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#JoinExprTable.
    def visitJoinExprTable(self, ctx:InsightsQLParser.JoinExprTableContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#JoinExprParens.
    def visitJoinExprParens(self, ctx:InsightsQLParser.JoinExprParensContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#JoinExprCrossOp.
    def visitJoinExprCrossOp(self, ctx:InsightsQLParser.JoinExprCrossOpContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#JoinOpInner.
    def visitJoinOpInner(self, ctx:InsightsQLParser.JoinOpInnerContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#JoinOpLeftRight.
    def visitJoinOpLeftRight(self, ctx:InsightsQLParser.JoinOpLeftRightContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#JoinOpFull.
    def visitJoinOpFull(self, ctx:InsightsQLParser.JoinOpFullContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#joinOpCross.
    def visitJoinOpCross(self, ctx:InsightsQLParser.JoinOpCrossContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#joinConstraintClause.
    def visitJoinConstraintClause(self, ctx:InsightsQLParser.JoinConstraintClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#sampleClause.
    def visitSampleClause(self, ctx:InsightsQLParser.SampleClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#limitExpr.
    def visitLimitExpr(self, ctx:InsightsQLParser.LimitExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#orderExprList.
    def visitOrderExprList(self, ctx:InsightsQLParser.OrderExprListContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#orderExpr.
    def visitOrderExpr(self, ctx:InsightsQLParser.OrderExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ratioExpr.
    def visitRatioExpr(self, ctx:InsightsQLParser.RatioExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#settingExprList.
    def visitSettingExprList(self, ctx:InsightsQLParser.SettingExprListContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#settingExpr.
    def visitSettingExpr(self, ctx:InsightsQLParser.SettingExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#windowExpr.
    def visitWindowExpr(self, ctx:InsightsQLParser.WindowExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#winPartitionByClause.
    def visitWinPartitionByClause(self, ctx:InsightsQLParser.WinPartitionByClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#winOrderByClause.
    def visitWinOrderByClause(self, ctx:InsightsQLParser.WinOrderByClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#winFrameClause.
    def visitWinFrameClause(self, ctx:InsightsQLParser.WinFrameClauseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#frameStart.
    def visitFrameStart(self, ctx:InsightsQLParser.FrameStartContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#frameBetween.
    def visitFrameBetween(self, ctx:InsightsQLParser.FrameBetweenContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#winFrameBound.
    def visitWinFrameBound(self, ctx:InsightsQLParser.WinFrameBoundContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#expr.
    def visitExpr(self, ctx:InsightsQLParser.ExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnTypeExprSimple.
    def visitColumnTypeExprSimple(self, ctx:InsightsQLParser.ColumnTypeExprSimpleContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnTypeExprNested.
    def visitColumnTypeExprNested(self, ctx:InsightsQLParser.ColumnTypeExprNestedContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnTypeExprEnum.
    def visitColumnTypeExprEnum(self, ctx:InsightsQLParser.ColumnTypeExprEnumContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnTypeExprComplex.
    def visitColumnTypeExprComplex(self, ctx:InsightsQLParser.ColumnTypeExprComplexContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnTypeExprParam.
    def visitColumnTypeExprParam(self, ctx:InsightsQLParser.ColumnTypeExprParamContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#columnExprList.
    def visitColumnExprList(self, ctx:InsightsQLParser.ColumnExprListContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprTernaryOp.
    def visitColumnExprTernaryOp(self, ctx:InsightsQLParser.ColumnExprTernaryOpContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprAlias.
    def visitColumnExprAlias(self, ctx:InsightsQLParser.ColumnExprAliasContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprNegate.
    def visitColumnExprNegate(self, ctx:InsightsQLParser.ColumnExprNegateContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprDict.
    def visitColumnExprDict(self, ctx:InsightsQLParser.ColumnExprDictContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprSubquery.
    def visitColumnExprSubquery(self, ctx:InsightsQLParser.ColumnExprSubqueryContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprLiteral.
    def visitColumnExprLiteral(self, ctx:InsightsQLParser.ColumnExprLiteralContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprArray.
    def visitColumnExprArray(self, ctx:InsightsQLParser.ColumnExprArrayContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprSubstring.
    def visitColumnExprSubstring(self, ctx:InsightsQLParser.ColumnExprSubstringContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprCast.
    def visitColumnExprCast(self, ctx:InsightsQLParser.ColumnExprCastContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprOr.
    def visitColumnExprOr(self, ctx:InsightsQLParser.ColumnExprOrContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprNullTupleAccess.
    def visitColumnExprNullTupleAccess(self, ctx:InsightsQLParser.ColumnExprNullTupleAccessContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprTypeCast.
    def visitColumnExprTypeCast(self, ctx:InsightsQLParser.ColumnExprTypeCastContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprPrecedence1.
    def visitColumnExprPrecedence1(self, ctx:InsightsQLParser.ColumnExprPrecedence1Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprPrecedence2.
    def visitColumnExprPrecedence2(self, ctx:InsightsQLParser.ColumnExprPrecedence2Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprPrecedence3.
    def visitColumnExprPrecedence3(self, ctx:InsightsQLParser.ColumnExprPrecedence3Context):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprInterval.
    def visitColumnExprInterval(self, ctx:InsightsQLParser.ColumnExprIntervalContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprCallSelect.
    def visitColumnExprCallSelect(self, ctx:InsightsQLParser.ColumnExprCallSelectContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprIsNull.
    def visitColumnExprIsNull(self, ctx:InsightsQLParser.ColumnExprIsNullContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprWinFunctionTarget.
    def visitColumnExprWinFunctionTarget(self, ctx:InsightsQLParser.ColumnExprWinFunctionTargetContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprNullPropertyAccess.
    def visitColumnExprNullPropertyAccess(self, ctx:InsightsQLParser.ColumnExprNullPropertyAccessContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprIntervalString.
    def visitColumnExprIntervalString(self, ctx:InsightsQLParser.ColumnExprIntervalStringContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprTrim.
    def visitColumnExprTrim(self, ctx:InsightsQLParser.ColumnExprTrimContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprTagElement.
    def visitColumnExprTagElement(self, ctx:InsightsQLParser.ColumnExprTagElementContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprTemplateString.
    def visitColumnExprTemplateString(self, ctx:InsightsQLParser.ColumnExprTemplateStringContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprTuple.
    def visitColumnExprTuple(self, ctx:InsightsQLParser.ColumnExprTupleContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprCall.
    def visitColumnExprCall(self, ctx:InsightsQLParser.ColumnExprCallContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprArrayAccess.
    def visitColumnExprArrayAccess(self, ctx:InsightsQLParser.ColumnExprArrayAccessContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprBetween.
    def visitColumnExprBetween(self, ctx:InsightsQLParser.ColumnExprBetweenContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprPropertyAccess.
    def visitColumnExprPropertyAccess(self, ctx:InsightsQLParser.ColumnExprPropertyAccessContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprParens.
    def visitColumnExprParens(self, ctx:InsightsQLParser.ColumnExprParensContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprNullArrayAccess.
    def visitColumnExprNullArrayAccess(self, ctx:InsightsQLParser.ColumnExprNullArrayAccessContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprTimestamp.
    def visitColumnExprTimestamp(self, ctx:InsightsQLParser.ColumnExprTimestampContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprNullish.
    def visitColumnExprNullish(self, ctx:InsightsQLParser.ColumnExprNullishContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprAnd.
    def visitColumnExprAnd(self, ctx:InsightsQLParser.ColumnExprAndContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprTupleAccess.
    def visitColumnExprTupleAccess(self, ctx:InsightsQLParser.ColumnExprTupleAccessContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprCase.
    def visitColumnExprCase(self, ctx:InsightsQLParser.ColumnExprCaseContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprDate.
    def visitColumnExprDate(self, ctx:InsightsQLParser.ColumnExprDateContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprNot.
    def visitColumnExprNot(self, ctx:InsightsQLParser.ColumnExprNotContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprWinFunction.
    def visitColumnExprWinFunction(self, ctx:InsightsQLParser.ColumnExprWinFunctionContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprLambda.
    def visitColumnExprLambda(self, ctx:InsightsQLParser.ColumnExprLambdaContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprIdentifier.
    def visitColumnExprIdentifier(self, ctx:InsightsQLParser.ColumnExprIdentifierContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprFunction.
    def visitColumnExprFunction(self, ctx:InsightsQLParser.ColumnExprFunctionContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#ColumnExprAsterisk.
    def visitColumnExprAsterisk(self, ctx:InsightsQLParser.ColumnExprAsteriskContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#columnLambdaExpr.
    def visitColumnLambdaExpr(self, ctx:InsightsQLParser.ColumnLambdaExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#insightsqlxChildElement.
    def visitInsightsqlxChildElement(self, ctx:InsightsQLParser.InsightsqlxChildElementContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#insightsqlxText.
    def visitInsightsqlxText(self, ctx:InsightsQLParser.InsightsqlxTextContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#InsightsqlxTagElementClosed.
    def visitInsightsqlxTagElementClosed(self, ctx:InsightsQLParser.InsightsqlxTagElementClosedContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#InsightsqlxTagElementNested.
    def visitInsightsqlxTagElementNested(self, ctx:InsightsQLParser.InsightsqlxTagElementNestedContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#insightsqlxTagAttribute.
    def visitInsightsqlxTagAttribute(self, ctx:InsightsQLParser.InsightsqlxTagAttributeContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#withExprList.
    def visitWithExprList(self, ctx:InsightsQLParser.WithExprListContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#WithExprSubquery.
    def visitWithExprSubquery(self, ctx:InsightsQLParser.WithExprSubqueryContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#WithExprColumn.
    def visitWithExprColumn(self, ctx:InsightsQLParser.WithExprColumnContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#columnIdentifier.
    def visitColumnIdentifier(self, ctx:InsightsQLParser.ColumnIdentifierContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#nestedIdentifier.
    def visitNestedIdentifier(self, ctx:InsightsQLParser.NestedIdentifierContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#TableExprTag.
    def visitTableExprTag(self, ctx:InsightsQLParser.TableExprTagContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#TableExprIdentifier.
    def visitTableExprIdentifier(self, ctx:InsightsQLParser.TableExprIdentifierContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#TableExprPlaceholder.
    def visitTableExprPlaceholder(self, ctx:InsightsQLParser.TableExprPlaceholderContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#TableExprSubquery.
    def visitTableExprSubquery(self, ctx:InsightsQLParser.TableExprSubqueryContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#TableExprAlias.
    def visitTableExprAlias(self, ctx:InsightsQLParser.TableExprAliasContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#TableExprFunction.
    def visitTableExprFunction(self, ctx:InsightsQLParser.TableExprFunctionContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#tableFunctionExpr.
    def visitTableFunctionExpr(self, ctx:InsightsQLParser.TableFunctionExprContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#tableIdentifier.
    def visitTableIdentifier(self, ctx:InsightsQLParser.TableIdentifierContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#tableArgList.
    def visitTableArgList(self, ctx:InsightsQLParser.TableArgListContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#databaseIdentifier.
    def visitDatabaseIdentifier(self, ctx:InsightsQLParser.DatabaseIdentifierContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#floatingLiteral.
    def visitFloatingLiteral(self, ctx:InsightsQLParser.FloatingLiteralContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#numberLiteral.
    def visitNumberLiteral(self, ctx:InsightsQLParser.NumberLiteralContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#literal.
    def visitLiteral(self, ctx:InsightsQLParser.LiteralContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#interval.
    def visitInterval(self, ctx:InsightsQLParser.IntervalContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#keyword.
    def visitKeyword(self, ctx:InsightsQLParser.KeywordContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#keywordForAlias.
    def visitKeywordForAlias(self, ctx:InsightsQLParser.KeywordForAliasContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#alias.
    def visitAlias(self, ctx:InsightsQLParser.AliasContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#identifier.
    def visitIdentifier(self, ctx:InsightsQLParser.IdentifierContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#enumValue.
    def visitEnumValue(self, ctx:InsightsQLParser.EnumValueContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#placeholder.
    def visitPlaceholder(self, ctx:InsightsQLParser.PlaceholderContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#string.
    def visitString(self, ctx:InsightsQLParser.StringContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#templateString.
    def visitTemplateString(self, ctx:InsightsQLParser.TemplateStringContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#stringContents.
    def visitStringContents(self, ctx:InsightsQLParser.StringContentsContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#fullTemplateString.
    def visitFullTemplateString(self, ctx:InsightsQLParser.FullTemplateStringContext):
        return self.visitChildren(ctx)


    # Visit a parse tree produced by InsightsQLParser#stringContentsFull.
    def visitStringContentsFull(self, ctx:InsightsQLParser.StringContentsFullContext):
        return self.visitChildren(ctx)



del InsightsQLParser
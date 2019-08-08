/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-use-before-define, @typescript-eslint/no-unused-vars */
import * as ts from 'typescript'

export interface CollectHooksConfig {
  filter?: (filename: string) => boolean
}

export const collectAyanamiHooksFactory: (
  config?: CollectHooksConfig,
) => ts.TransformerFactory<ts.SourceFile> = (config = { filter: (_name: string) => true }) => (
  context,
) => {
  let sourceFile: ts.SourceFile
  const updateDeclaration = (
    parent: ts.FunctionDeclaration | ts.VariableStatement,
  ):
    | (ts.FunctionDeclaration | ts.VariableStatement)
    | [ts.FunctionDeclaration | ts.VariableStatement, ts.ExpressionStatement] => {
    let result: ts.FunctionDeclaration | ts.VariableDeclaration
    let finalResult: ts.FunctionDeclaration | ts.VariableStatement = parent
    if (ts.isVariableStatement(parent)) {
      result = parent.declarationList.declarations[0]
    } else {
      result = parent
    }

    const parameters = ts.isFunctionDeclaration(result)
      ? result.parameters
      : (result.initializer! as ts.FunctionExpression).parameters

    // Anonymous component
    if (!result.name) {
      return parent
    }

    function addExpressionToComponent(expression: ts.ExpressionStatement) {
      if (ts.isFunctionDeclaration(result)) {
        result = ts.updateFunctionDeclaration(
          result,
          result.decorators,
          result.modifiers,
          result.asteriskToken,
          result.name,
          result.typeParameters,
          result.parameters,
          result.type,
          ts.updateBlock(result.body!, [expression, ...result.body!.statements]),
        )
        finalResult = result
      } else {
        if (ts.isArrowFunction(result.initializer!)) {
          if (ts.isBlock(result.initializer!.body)) {
            result = ts.updateVariableDeclaration(
              result,
              result.name,
              result.type,
              ts.updateArrowFunction(
                result.initializer!,
                result.initializer!.modifiers,
                result.initializer!.typeParameters,
                result.initializer!.parameters,
                result.initializer!.type,
                result.initializer!.equalsGreaterThanToken,
                ts.updateBlock(result.initializer!.body, [
                  expression,
                  ...result.initializer!.body.statements,
                ]),
              ),
            )
          } else {
            result = ts.updateVariableDeclaration(
              result,
              result.name,
              result.type,
              ts.updateArrowFunction(
                result.initializer!,
                result.initializer!.modifiers,
                result.initializer!.typeParameters,
                result.initializer!.parameters,
                result.initializer!.type,
                result.initializer!.equalsGreaterThanToken,
                ts.createBlock([expression, ts.createReturn(result.initializer!.body)], true),
              ),
            )
          }
        } else if (ts.isFunctionExpression(result.initializer!)) {
          result = ts.updateVariableDeclaration(
            result,
            result.name,
            result.type,
            ts.updateFunctionExpression(
              result.initializer!,
              result.initializer!.modifiers,
              result.initializer!.asteriskToken,
              result.initializer!.name,
              result.initializer!.typeParameters,
              result.initializer!.parameters,
              result.initializer!.type,
              ts.updateBlock(result.initializer!.body, [
                expression,
                ...result.initializer!.body.statements,
              ]),
            ),
          )
        }
        const _parent = parent as ts.VariableStatement
        finalResult = ts.updateVariableStatement(
          _parent,
          parent.modifiers,
          ts.updateVariableDeclarationList(_parent.declarationList, [result]),
        )
      }
    }

    function addAdditionalExpression(identifier: ts.Expression) {
      if (!additionalResult) {
        additionalResult = ts.createExpressionStatement(
          ts.createBinary(
            ts.createElementAccess(
              ts.createIdentifier((result.name as ts.Identifier).text),
              ts.createPropertyAccess(
                ts.createCall(ts.createIdentifier('require'), undefined, [
                  ts.createStringLiteral('ayanami'),
                ]),
                ts.createIdentifier('SSRSymbol'),
              ),
            ),
            ts.SyntaxKind.EqualsToken,
            ts.createArrayLiteral([identifier], false),
          ),
        )
      } else {
        additionalResult = ts.updateExpressionStatement(
          additionalResult,
          ts.updateBinary(
            additionalResult.expression as ts.BinaryExpression,
            (additionalResult.expression as ts.BinaryExpression).left,
            ts.updateArrayLiteral(
              (additionalResult.expression as ts.BinaryExpression)
                .right as ts.ArrayLiteralExpression,
              [
                ...((additionalResult.expression as ts.BinaryExpression)
                  .right as ts.ArrayLiteralExpression).elements,
                identifier,
              ],
            ),
          ),
        )
      }
    }

    let additionalResult: ts.ExpressionStatement | undefined
    const functionLevelVisitor: ts.Visitor = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'React' &&
        node.expression.name.text === 'createElement' &&
        Array.isArray(node.arguments) &&
        typeof node.arguments[0] !== 'undefined' &&
        ts.isIdentifier(node.arguments[0])
      ) {
        const identifier = ts.createIdentifier(node.arguments[0].text)
        if (parameters.every((p) => p.name.getText(sourceFile) !== identifier.text)) {
          addAdditionalExpression(
            ts.createElementAccess(
              identifier,
              ts.createPropertyAccess(
                ts.createCall(ts.createIdentifier('require'), undefined, [
                  ts.createStringLiteral('ayanami'),
                ]),
                ts.createIdentifier('SSRSymbol'),
              ),
            ),
          )
        }
      }

      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'useAyanami' &&
        Array.isArray(node.arguments) &&
        ts.isIdentifier(node.arguments[0])
      ) {
        if (node.arguments.length === 2) {
          console.warn(
            `Does not support run ayanami module with scope in SSR mode, ${
              (node.arguments[0] as ts.Identifier).text
            } will not run`,
          )
        } else {
          const moduleIdentifier = ts.createIdentifier(node.arguments[0].text)
          addAdditionalExpression(moduleIdentifier)
        }
      }
      return ts.visitEachChild(node, functionLevelVisitor, context)
    }

    ts.visitEachChild(parent, functionLevelVisitor, context)

    if (additionalResult) {
      addExpressionToComponent(
        ts.createExpressionStatement(
          ts.createCall(
            ts.createPropertyAccess(
              ts.createCall(ts.createIdentifier('require'), undefined, [
                ts.createStringLiteral('ayanami'),
              ]),
              ts.createIdentifier('collectModules'),
            ),
            undefined,
            [
              ts.createElementAccess(
                ts.createIdentifier((result.name as ts.Identifier).text),
                ts.createPropertyAccess(
                  ts.createCall(ts.createIdentifier('require'), undefined, [
                    ts.createStringLiteral('ayanami'),
                  ]),
                  ts.createIdentifier('SSRSymbol'),
                ),
              ),
            ],
          ),
        ),
      )
      return [finalResult, additionalResult]
    }
    return finalResult
  }

  const topLevelvisitor: ts.Visitor = (node) => {
    if (node.parent && !ts.isSourceFile(node.parent)) {
      return node
    }

    if (
      (ts.isFunctionDeclaration(node) && node.body) ||
      (ts.isVariableStatement(node) &&
        node.declarationList &&
        Array.isArray(node.declarationList.declarations) &&
        ts.isVariableDeclaration(node.declarationList.declarations[0]) &&
        node.declarationList.declarations[0] &&
        node.declarationList.declarations[0].initializer &&
        (ts.isFunctionExpression(node.declarationList.declarations[0].initializer) ||
          ts.isArrowFunction(node.declarationList.declarations[0].initializer)))
    ) {
      return updateDeclaration(node)
    }

    return ts.visitEachChild(node, topLevelvisitor, context)
  }

  return (node) => {
    if (node.languageVariant !== ts.LanguageVariant.JSX) {
      return node
    }

    sourceFile = node

    if (!node.fileName) {
      return node
    }

    if (!config.filter!(node.fileName)) {
      return node
    }
    return ts.visitEachChild(node, topLevelvisitor, context)
  }
}

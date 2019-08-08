import * as ts from 'typescript'
import { join } from 'path'
import { readFileSync } from 'fs'

import { collectAyanamiHooksFactory } from '../collect-hooks'

function transpile(source: string) {
  return ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES5,
      jsx: ts.JsxEmit.React,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
    transformers: {
      after: [collectAyanamiHooksFactory()],
    },
  }).outputText
}

function readFile(name: string) {
  return readFileSync(join(__dirname, `${name}.fixture`), 'utf-8')
}

describe('collect hooks plugin specs', () => {
  it('should collect from function component', () => {
    expect(transpile(readFile('function'))).toMatchSnapshot()
  })
})

import * as ts from 'typescript'
import { join } from 'path'
import { readFileSync } from 'fs'

import { CollectHooksConfig, collectAyanamiHooksFactory } from '../collect-hooks'

function transpile(
  source: string,
  configs: {
    transpileOptions?: ts.TranspileOptions
    compilerOptions?: ts.CompilerOptions
    pluginOptions?: CollectHooksConfig
  } = {
    transpileOptions: {},
    compilerOptions: {},
    pluginOptions: undefined,
  },
) {
  return ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES5,
      jsx: ts.JsxEmit.React,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      ...(configs.compilerOptions || {}),
    },
    transformers: {
      after: [collectAyanamiHooksFactory(configs.pluginOptions)],
    },
    ...(configs.transpileOptions || {}),
  }).outputText
}

function readFile(name: string) {
  return readFileSync(join(__dirname, `${name}.fixture`), 'utf-8')
}

describe('collect hooks plugin specs', () => {
  ;[
    {
      name: 'basic',
      describe: 'should do nothing to basic component',
    },
    {
      name: 'function',
    },
    {
      name: 'variable',
      options: {
        compilerOptions: {
          target: ts.ScriptTarget.ES2015,
        },
      },
    },
    {
      name: 'arrow-function-none-block',
      options: {
        compilerOptions: {
          target: ts.ScriptTarget.ES2015,
        },
      },
    },
    {
      name: 'variable-function',
      options: {
        compilerOptions: {
          target: ts.ScriptTarget.ES2015,
        },
      },
    },
    {
      name: 'scope',
      describe: 'dose not support scoped ayanami module',
    },
    {
      name: 'component-from-props',
      describe: 'should ignore component from props',
    },
    {
      name: 'anonymous-component',
      describe: 'should ignore anonymous component from props',
      options: {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
        },
      },
    },
  ].forEach((meta) => {
    it(meta.describe ? meta.describe : `should collect from ${meta.name} component`, () => {
      expect(transpile(readFile(meta.name), meta.options)).toMatchSnapshot()
    })
  })

  it('should do nothing if not jsx', () => {
    expect(transpile('function', { compilerOptions: { jsx: ts.JsxEmit.None } })).toBe('')
  })

  it('should do nothing if filename is been filter', () => {
    expect(
      transpile('function', {
        pluginOptions: { filter: () => false },
      }),
    ).toBe('')
  })
})

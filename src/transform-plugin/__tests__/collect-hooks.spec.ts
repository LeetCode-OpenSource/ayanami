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
      name: 'literal-scope',
    },
    {
      name: 'dynamic-scope',
      describe: 'should ignore dynamic scope from props',
    },
    {
      name: 'component-from-props',
      describe: 'should ignore component from props',
    },
    {
      name: 'function-with-nonprops-argument',
      describe: 'should ignore component from params',
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
    {
      name: 'smoke-1',
    },
    {
      name: 'smoke-2',
      options: {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
        },
      },
      describe: 'should not collect scoped component',
    },
    {
      name: 'with-memo',
      options: {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
        },
      },
    },
    {
      name: 'with-react-memo',
      options: {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
        },
      },
    },
    {
      name: 'with-memo-dynamic-scope',
      options: {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
        },
      },
      describe: 'should ignore memo with dynamic scope from props',
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

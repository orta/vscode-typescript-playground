/* eslint-disable @typescript-eslint/naming-convention */

// These are the compiler's defaults, and we want a diff from

import type { CompilerOptions } from "typescript"


enum ModuleKind {
    None = 0,
    CommonJS = 1,
    AMD = 2,
    UMD = 3,
    System = 4,
  
    // NOTE: ES module kinds should be contiguous to more easily check whether a module kind is *any* ES module kind.
    //       Non-ES module kinds should not come between ES2015 (the earliest ES module kind) and ESNext (the last ES
    //       module kind).
    ES2015 = 5,
    ES2020 = 6,
    ES2022 = 7,
    ESNext = 99,
  
    // Node12+ is an amalgam of commonjs (albeit updated) and es2020+, and represents a distinct module system from es2020/esnext
    Node12 = 100,
    NodeNext = 199,
  }
  
  enum JsxEmit {
    None = 0,
    Preserve = 1,
    React = 2,
    ReactNative = 3,
    ReactJSX = 4,
    ReactJSXDev = 5,
  }
  
  enum ScriptTarget {
    ES3 = 0,
    ES5 = 1,
    ES2015 = 2,
    ES2016 = 3,
    ES2017 = 4,
    ES2018 = 5,
    ES2019 = 6,
    ES2020 = 7,
    ES2021 = 8,
    ES2022 = 9,
    ESNext = 99,
    JSON = 100,
    Latest = ESNext,
  }
  
  enum ModuleResolutionKind {
    Classic = 1,
    NodeJs = 2,
    // Starting with node12, node's module resolver has significant departures from tranditional cjs resolution
    // to better support ecmascript modules and their use within node - more features are still being added, so
    // we can expect it to change over time, and as such, offer both a `NodeNext` moving resolution target, and a `Node12`
    // version-anchored resolution target
    Node12 = 3,
    NodeNext = 99, // Not simply `Node12` so that compiled code linked against TS can use the `Next` value reliably (same as with `ModuleKind`)
  }


function getScriptTargetText(option: any) {
    return ScriptTarget[option]
  }

  function getJsxEmitText(option: any) {
    if (option === JsxEmit.None) {
      return undefined
    }
    return JsxEmit[option].toLowerCase()
  }

  function getModuleKindText(option: any) {
    if (option === ModuleKind.None) {
      return undefined
    }
    return ModuleKind[option]
  }

  function getModuleResolutionText(option: any) {
    return option === ModuleResolutionKind.Classic ? "classic" : "node"
  }


// these before putting it in the issue
const defaultCompilerOptionsForTSC: CompilerOptions = {
    esModuleInterop: false,
    strictNullChecks: false,
    strict: false,
    strictFunctionTypes: false,
    strictPropertyInitialization: false,
    strictBindCallApply: false,
    noImplicitAny: false,
    noImplicitThis: false,
    noImplicitReturns: false,
    checkJs: false,
    allowJs: false,
    experimentalDecorators: false,
    emitDecoratorMetadata: false,
}

function getValidCompilerOptions(options: CompilerOptions) {
    const {
        target: targetOption,
        jsx: jsxOption,
        module: moduleOption,
        moduleResolution: moduleResolutionOption,
        ...restOptions
    } = options

    const targetText = getScriptTargetText(targetOption)
    const jsxText = getJsxEmitText(jsxOption)
    const moduleKindText = getModuleKindText(moduleOption)
    const moduleResolutionText = getModuleResolutionText(moduleResolutionOption)

    const opts = {
        ...restOptions,
        ...(targetText && { target: targetText }),
        ...(jsxText && { jsx: jsxText }),
        ...(moduleKindText && { module: moduleKindText }),
        moduleResolution: moduleResolutionText,
    }

    const diffFromTSCDefaults = Object.entries(opts).reduce((acc, [key, value]) => {
        if ((opts as any)[key] && value != defaultCompilerOptionsForTSC[key]) {
            // @ts-ignore
            acc[key] = opts[key]
        }

        return acc
    }, {})

    return diffFromTSCDefaults
}

export const getTSConfigForConfig = (options: CompilerOptions) =>  JSON.stringify({ compilerOptions: getValidCompilerOptions(options) }, null, '  ')

<h1 align="center">Ayanami</h1>
<h4 align="center">
  A better way to react with state. Inspired by <a href="https://github.com/LeetCode-OpenSource/redux-epics-decorator">redux-epics-decorator</a>
</h4>

<p align="center">
  <a href="https://github.com/LeetCode-OpenSource/ayanami/blob/master/LICENSE">
    <img height="20" alt="GitHub license" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>
  <a href="#contributing">
    <img height="20" alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </a>
  <a href="https://github.com/prettier/prettier">
    <img height="20" alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat" />
  </a>
  <a href="https://www.npmjs.com/package/ayanami">
    <img height="20" alt="npm version" src="https://img.shields.io/npm/v/ayanami.svg?style=flat" />
  </a>
  <a href="https://codecov.io/gh/LeetCode-OpenSource/ayanami">
    <img height="20" alt="codecov" src="https://codecov.io/gh/LeetCode-OpenSource/ayanami/branch/master/graph/badge.svg" />
  </a>
  <a href="https://circleci.com/gh/LeetCode-OpenSource/ayanami">
    <img height="20" alt="CircleCI" src="https://badgen.net/circleci/github/LeetCode-OpenSource/ayanami" />
  </a>
  <a href="https://bundlephobia.com/result?p=ayanami">
    <img height="20" alt="minzipped size" src="https://badgen.net/bundlephobia/minzip/ayanami" />
  </a>
</p>

## Highlights
- No extra configuration, everything is out of the box
- Define state and actions in a __predictable__ and __type-safe__ way
- Use __[`RxJS`](https://rxjs-dev.firebaseapp.com)__ to create side effects and more
- __Single source of truth__: The model that extends from `Ayanami` is a singleton
- __Debuggable__: Inspect actions and state changes via [`redux-devtools-extension`](https://github.com/zalmoxisus/redux-devtools-extension)

## Installation
Using [yarn](https://yarnpkg.com/en/package/ayanami):
```bash
yarn add ayanami
```

Or via [npm](https://www.npmjs.com/package/ayanami):
```bash
npm install ayanami
```

## Examples
```tsx
import React from 'react'
import ReactDOM from 'react-dom'
import { Observable } from 'rxjs'
import { withLatestFrom, map } from 'rxjs/operators'
import { Ayanami, Effect, EffectAction, Reducer } from 'ayanami'

interface State {
  count: number
}

class Count extends Ayanami<State> {
  defaultState = {
    count: 0,
  }
  
  @Reducer()
  add(count: number, state: State): State {
    return { count: state.count + count }
  }
  
  @Effect()
  minus(count$: Observable<number>, state$: Observable<State>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      map(([subCount, state]) => this.setStateAction({ count: state.count - subCount })),
    )
  }
}

function App() {
  const [state, actions] = Count.useHooks()

  const add = (count: number) => () => actions.add(count)
  const minus = (count: number) => () => actions.minus(count)
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={add(1)}>
        add one
      </button>
      <button onClick={minus(1)}>
        minus one
      </button>
    </div>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'))
```

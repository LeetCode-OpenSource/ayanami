# Ayanami &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/LeetCode-OpenSource/ayanami/blob/master/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat)](https://github.com/prettier/prettier) [![npm version](https://img.shields.io/npm/v/ayanami.svg?style=flat)](https://www.npmjs.com/package/ayanami)

> A better way to react with state. Inspire by [redux-epics-decorator](https://github.com/LeetCode-OpenSource/redux-epics-decorator)

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

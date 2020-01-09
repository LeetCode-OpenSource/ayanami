# FAQ
## Type Infer
When you are writting `Effect/SSREffect` logic, if the `Effect` emmit an `Action` which infer from itself, or some `Effects` circular dependents the others, `Type infer` in TypeScript may fail.

[Example in CodeSandbox](https://codesandbox.io/s/ayanami-faq-type-infer-jf2xd)

```typescript
import { Ayanami, Module, ImmerReducer, Effect } from 'ayanami'

export interface CountState {
  count: number
}

@Module('Count')
export class CountModule extends Ayanami<CountState> {
  @ImmerReducer()
  set(state: Draft<CountState>, payload: number) {
    state.count = payload
  }
  
  @Effect()
  addLeastFive(payload$: Observable<number>) { // implicit any 
    return payload$.pipe(
      map((payload) => {
        if (payload < 5) {
          return this.getActions().addLeastFive(payload + 1)
        }
        return this.getActions().set(payload)
      })
    )
  }
}
```

In this scenario, you need give the `Effect` a `Return Type` **explicit**:

```diff
- import { Ayanami, Module, ImmerReducer, Effect } from 'ayanami'
+ import { Ayanami, Module, ImmerReducer, Effect, Action } from 'ayanami'

- addLeastFive(payload$: Observable<number>) {
+ addLeastFive(payload$: Observable<number>): Observable<Action> {
```

## **Effect** end callback

There are some cases you may need run `callback` after **Effect** end:

### Show message after Success/Failure
Depends on the API which show message, we could use **Data driven**/**Side effect** ways to implment this requirement: 

[Codesandbox effects callback](https://codesandbox.io/s/ayanami-faq-effects-callback-s0tzr)

<details>
<summary>Side effect way</summary>

```ts
import { Module, Ayanami, Reducer, Effect, Action } from "ayanami";
import { Observable, of } from "rxjs";
import {
  exhaustMap,
  takeUntil,
  map,
  tap,
  startWith,
  catchError
} from "rxjs/operators";
import { message } from "antd";

import { HttpClient } from "./http.service";

interface AppState {
  list: string[] | null | Error;
}

@Module("App")
export class AppModule extends Ayanami<AppState> {
  defaultState: AppState = {
    list: []
  };

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  @Reducer()
  cancel(state: AppState) {
    return { ...state, ...this.defaultState };
  }

  @Reducer()
  setList(state: AppState, list: AppState["list"]) {
    return { ...state, list };
  }

  @Effect()
  fetchList(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      exhaustMap(() => {
        return this.httpClient.get(`/resources`).pipe(
          tap(() => {
            message.success("Got response");
          }, (e) => {
            message.error(e.message);
          }),
          map(response => this.getActions().setList(response)),
          catchError(e => of(this.getActions().setList(e))),
          startWith(this.getActions().setList(null)),
          takeUntil(this.getAction$().cancel)
        );
      })
    );
  }
}
```
</summary>

[Codesandbox demo](https://codesandbox.io/s/ayanami-faq-effects-pure-state-i0hcb)

<details>
<summary>State driven way</summary>

```tsx
import "reflect-metadata";
import "antd/dist/antd.css";
import React, { useState, useCallback } from "react";
import { render } from "react-dom";
import { useAyanami } from "ayanami";
import { Modal } from "antd";

import { AppModule } from "./app.module";

function App() {
  const [{ list }, dispatcher] = useAyanami(AppModule);
  const [modalVisible, setModalVisible] = useState(true);
  const onFetchList = useCallback(() => {
    setModalVisible(true);
    dispatcher.fetchList();
  }, [dispatcher, setModalVisible]);
  const onClose = useCallback(() => {
    setModalVisible(false);
  }, [setModalVisible]);

  const loading = !list ? <div>loading</div> : null;

  const title =
    list instanceof Error ? (
      <>
        <Modal
          title="fail"
          visible={modalVisible}
          onOk={onClose}
          onCancel={onClose}
        >
          <p>{list.message}</p>
        </Modal>
        <h1>{list.message}</h1>
      </>
    ) : (
      <h1>Hello CodeSandbox</h1>
    );

  const listNodes = Array.isArray(list)
    ? list.map(value => <li key={value}>{value}</li>)
    : null;
  return (
    <div>
      {title}
      <button onClick={onFetchList}>fetchList</button>
      <button onClick={dispatcher.cancel}>cancel</button>
      {loading}
      <ul>{listNodes}</ul>
    </div>
  );
}

const rootElement = document.getElementById("app");
render(<App />, rootElement);

```

</summary>
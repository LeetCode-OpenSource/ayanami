# Cancellation
Cancelling some async side effects is a common requirement of **Effect**. While there are several ways of doing this depending on your requirements, the most common way is to have your application dispatch a cancellation action and listen for it inside your **Effect**.

[Example in Codesandbox](https://codesandbox.io/s/ayanami-recipes-cancellation-4vrst)

If you click the *cancel* button before `loading text` disappear, the `fetchList` **Effect** would be cancelled, and there won't be `Got response` message in Console.

<details>
<summary><code>Example codes</code></summary>

```tsx
import { Module, Ayanami, Reducer, Effect, Action } from "ayanami";
import { Observable } from "rxjs";
import {
  exhaustMap,
  takeUntil,
  map,
  tap,
  startWith,
  endWith
} from "rxjs/operators";

import { HttpClient } from "./http.service";

interface AppState {
  loading: boolean;
  list: string[] | null;
}

@Module("App")
export class AppModule extends Ayanami<AppState> {
  defaultState: AppState = {
    list: null,
    loading: false
  };

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  @Reducer()
  cancel(state: AppState) {
    return { ...state, ...this.defaultState };
  }

  @Reducer()
  setLoading(state: AppState, loading: boolean) {
    return { ...state, loading };
  }

  @Reducer()
  setList(state: AppState, list: string[]) {
    return { ...state, list };
  }

  @Effect()
  fetchList(payload$: Observable<void>): Observable<Action> {
    return payload$.pipe(
      exhaustMap(() => {
        return this.httpClient.get(`/resources`).pipe(
          tap(() => {
            console.log("Got response");
          }),
          map(response => this.getActions().setList(response)),
          startWith(this.getActions().setLoading(true)),
          endWith(this.getActions().setLoading(false)),
          takeUntil(this.getAction$().cancel)
        );
      })
    );
  }
}

import { Injectable } from "ayanami";
import { Observable, timer } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class HttpClient {
  get(_url: string): Observable<string[]> {
    return timer(3000).pipe(map(() => ["mock1", "mock2", "mock3"]));
  }
}

import "reflect-metadata";
import React from "react";
import { render } from "react-dom";
import { useAyanami } from "ayanami";

import { AppModule } from "./app.module";

function App() {
  const [state, dispatcher] = useAyanami(AppModule);

  const loading = state.loading ? <div>loading</div> : null;

  const list = (state.list || []).map(value => <li key={value}>{value}</li>);
  return (
    <div>
      <h1>Hello CodeSandbox</h1>
      <button onClick={dispatcher.fetchList}>fetchList</button>
      <button onClick={dispatcher.cancel}>cancel</button>
      {loading}
      <ul>{list}</ul>
    </div>
  );
}

const rootElement = document.getElementById("app");
render(<App />, rootElement);

```
</detail>
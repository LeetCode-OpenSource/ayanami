# Loading/Error states handling
Handling loading and error state inside **Effect** like AJAX calls is a common requirement of **Effect**. While there are several ways of doing this depending on your requirements.

## Store all possible states in signle value
Split all possible states with mutiple values in **State** is bordering. The more elegant way is store all posible states in single value, TypeScript will ensure you always rendering with the right state:

[Error/Loading states handling Example](https://codesandbox.io/s/ayanami-recipes-error-loading-handling-hyd3n)

<details>
<summary><code>Example codes</code></summary>

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
            console.log("Got response");
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

```ts
import { Injectable } from "ayanami";
import { Observable, timer, throwError } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class HttpClient {
  get(_url: string): Observable<string[]> {
    return Math.random() > 0.5
      ? throwError(new TypeError("Fail to fetch"))
      : timer(3000).pipe(map(() => ["mock1", "mock2", "mock3"]));
  }
}
```

```tsx
import "reflect-metadata";
import React from "react";
import { render } from "react-dom";
import { useAyanami } from "ayanami";

import { AppModule } from "./app.module";

function App() {
  const [{ list }, dispatcher] = useAyanami(AppModule);

  const loading = !list ? <div>loading</div> : null;

  const title =
    list instanceof Error ? (
      <h1>{list.message}</h1>
    ) : (
      <h1>Hello CodeSandbox</h1>
    );

  const listNodes = Array.isArray(list)
    ? list.map(value => <li key={value}>{value}</li>)
    : null;
  return (
    <div>
      {title}
      <button onClick={dispatcher.fetchList}>fetchList</button>
      <button onClick={dispatcher.cancel}>cancel</button>
      {loading}
      <ul>{listNodes}</ul>
    </div>
  );
}

const rootElement = document.getElementById("app");
render(<App />, rootElement);

```

</details>

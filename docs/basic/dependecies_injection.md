# Dependencies Injection
If you are familiar with [Angular](https://angular.io) or [NestJS](https://nestjs.com/), you may already be familiar with **Dependencies Injection**.

## Module
In ayanami world, every **Module** is **Injectable**. So you can easily combine modules by **Inject** one to the others.

```ts
@Module('A')
class ModuleA extends Ayanami<AState> {
  defaultState = {}
}

@Module('B')
class ModuleB extends Ayanami<BState> {
  defaultState = {}

  constructor(private readonly moduleA: ModuleA) {
    super()
  }
}
```

### Access `AppState` from the other **Module**
Unlike **Redux**, Ayanami does not have **Global Store** object to store the whole state in application.
But with **Dependencies Injection**, we still can access state from the other parts in our application:

<details>
<summary><code>Example codes</code></summary>

```ts
@Module('A')
class ModuleA extends Ayanami<AState> {
  defaultState = {}
}

@Module('B')
class ModuleB extends Ayanami<BState> {
  defaultState = {}

  constructor(private readonly moduleA: ModuleA) {
    super()
  }

  @Effect()
  addAndSync(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.moduleA.state$),
      map(([payload, stateA]) => {
        ...
      })
    )
  }
}
```

</details>

### Trigger actions of the other modules
Just be similar with [Emit actions in Effect using ActionsCreator](./action.md#emit-actions-in-effect-using-actionscreator), we can create `Action` using **ActionsCreator** in the other `Module class`.

<details>
<summary><code>Example codes</code></summary>

```ts
@Module('A')
class ModuleA extends Ayanami<AState> {
  defaultState = {}

  @ImmerReducer()
  set(state: Draft<AState>, payload: string) {
    state.syncFromB = payload
  }
}

@Module('B')
class ModuleB extends Ayanami<BState> {
  defaultState = {}

  constructor(private readonly moduleA: ModuleA) {
    super()
  }

  @Effect()
  addAndSync(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.moduleA.state$),
      map(([payload, stateA]) => {
        return this.moduleA.getActions().set(`${stateA.syncFromB}${payload}`)
      })
    )
  }
}
```

</details>

## Service
If you want create a pure *Service* which seperated from `Module class`, you can just decorate it by `Injectable` decorator from ayanami.

<details>
<summary><code>Example codes</code></summary>

```ts

@Module('Simple')
class SimpleModule extends Ayanami<SimpleState> {
  defaultState = {}

  constructor(private readonly httpClient: HttpClient) {
    super()
  }

  @Effect()
  create(payload$: Observable<CreateEntityPayload>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      exhaustMap(([payload, state]) => {
        return this.httpClient.post(`/resources/${state.id}`, {
          body: payload,
        })
      })
    )
  }
}
```

```ts
import { Injectable } from 'ayanami'
import { Observable } from 'rxjs'

@Injectable()
export class HttpClient {
  constructor(private readonly tracer: Tracer) {}

  get () {}
  post<T>(config: Config = {}): Observable<T> {
    return this.send<T>({
      ...config,
      method: 'POST',
    })
  }
  delete() {}
  put() {}

  private send<T>(config: Config): Observable<T> {
    return this.tracer.send(config)
  }
}

```

```ts
import { Injectable } from 'ayanami'
import { Observable } from 'rxjs'

export type TraceId = string & {
  readonly traceIdTag: unique symbol
}

@Injectable()
export class Tracer {
  send<T>(config: Config): Observable<T> {
    const traceId = this.generateTraceId()
    this.traceStart(traceId)
    return new Observable<T>((observer) => {
      const { config, abortController } = this.convertConfig(config, traceId)
      fetch(config).then((res) => {
        this.traceEnd(traceId, res)
        return res.json()
      }).then((data) => {
        observer.next(data)
        observer.complete()
      }).catch((e) => {
        observer.error(e)
      })
      return () => {
        abortController.abort()
      }
    })
  }

  private convertConfig(config: Config, traceId: TraceId): { config: FetchInit, abortController: AbortController } {}

  private traceStart(traceId: TraceId) {}

  private traceEnd(traceId: TraceId, res: Response) {}

  private generateTraceId(): TraceId {}
}
```

</details>

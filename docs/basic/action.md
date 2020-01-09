# Action
Ayanami `Module` was implmented by `State` object under the hood. `State` object is very similar with redux `Store` object. It **Dispatch** actions to `reducers` and `effects`, and receive actions from `Dispatcher` and `Effect`.

In ayanami application, you will never need to create an `Action` by hand, so we do not expose the `Dispatch` function.
In replacement, there are two ways to dispatch action:

- call methods on **Dispatcher**
- emit actions in **Effect**

## Dispatcher & ActionsCreator
Dispatcher is a high level abstraction for **ActionsCreator** with well defined type information.

Every method in ayanami `Module class` decorated by  **Reducer**, **ImmerReducer**, **Effect** , **DefineAction** `Decorators` match one property with the same name in **ActionsCreator** in `Module class`, and match one property with the same name in **Dispatcher** in `Component`. The **ActionsCreator** in `Module class` is used for emmit action in **Effect**, and the **Dispatcher** in `Component` is used for `Dispatch` actions to `State`.

### Dispatch props created by Redux-Actions
You may have used [Redux-Actions](https://github.com/redux-utilities/redux-actions) in **Redux** application. **ActionsCreator** in ayanami is very similar with **ActionsCreator** in `Redux-Actions`.And there are few advantages for create **ActionsCreator** using `Redux-Actions`:

- Avoid [Magic string](https://en.wikipedia.org/wiki/Magic_number_(programming))
- Provide type informations
- Reduce boilerplate codes

<details>
<summary><code>Without redux-actions</code></summary>

```typescript
// raw dispatcher
connect(mapStateToProps, (dispatch) => bindActionCreators({
  addCount: (count: number) => dispatch({ // losing type information here
    type: 'ADD_COUNT',
    payload: count,
  }),
}, dispatch))

// reducer
export const reducer = (state, action) => { // losing type information here
  switch action.type:
    case: 'ADD_COUNT':
      return { ...state, count: state.count + payload }
    default:
      return { count: 0 }
}
```

</details>

<details>
<summary><code>With redux-actions</code></summary>

```typescript
const ADD_COUNT = createAction<number>('ADD_COUNT')

interface DispatchProps {
  addOne: typeof ADD_COUNT
}

interface StateProps {
  count: number
}

// react actions dispatcher
connect(mapStateToProps, (dispatch) => bindActionCreators({
  addCount: ADD_COUNT,
} as DispatchProps, dispatch))

// reducer
export const reducer = handleActions({
  [`${ADD_COUNT}`]: (state: StateProps, { payload }: Action<number>) => {
    return { ...state, count: state.count + payload }
  }
}, { count: 0 })
```

</details>

### Ayanami Dispatcher
Ayanami dispatcher api borrows all the advantages from `Redux-Actions`.
There are two different APIs to access `Dispatcher` which matched with `Moudle class` in `Component`:

#### useAyanamiDispatchers
This hook receive a **Module** class and produce a dispatcher referred to this **Module**.

<details>
<summary><code>Example codes</code></summary>

```ts
interface State {}

@Module('Somenamespace')
class SomeModule extends Ayanami<State> {
  defaultState = {}

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

const SomeComponent = memo(() => {
  /**
   * @type { addAndSync: (payload: number) => void }
   * the type of dispatcher will be inferred automatically
   **/
  const dispatcher = useAyanamiDispatchers(SomeModule)
  const inputRef = useRef<HTMLInputElement>()

  const onClickAdd = useCallback(() => {
    // ts will perform typecheck in the payload part
    // and you can also perform **Jump to defination** in code editor
    dispatcher.addAndSync(parseInt(inputRef.current!.value, 10))
  }, [dispatcher, inputRef])

  return (
    <div>
      <input ref={inputRef} />
      <button>add</button>
    </div>
  )
})
```
</details>

#### useAyanami
Almost same with `useAyanamiDispatchers`, but produce both **AppState** and **Dispatcher**

### Emit actions in Effect using **ActionsCreator**

The type signature of [Effect](./effects.md) is `<Payload>(action$: Observable<Payload>): Observable<Action>`.

The output actions can be created by built-in **ActionsCreator** in `Module class`, and the **ActionsCreator** could be accessed by `getActions` method.

<details>
<summary><code>Example codes</code></summary>

```ts
interface State {
  count: number
}

@Module('Count')
class CountModule extends Ayanami<State> {
  defaultState = {}
  
  @Reducer()
  add(state: State, payload: number) {
    return { ...state, count: payload }
  }

  @Effect()
  payloadPassThrough(payload$: Observable<number>) {
    return payload$.pipe(
      map((payload) => this.getActions().add(payload))
    )
  }
}
```
</details>

In the example upon, `this.getActions().add(payload)` will create an action which match the `add` method which decorated by **Reducer** . Call the `diapatcher.payloadPassThrough(payload)` will finally trigger the `add` reducer and change the state. You can also call the `dispatcher.add(payload)` in `Component` directly, they are equally in this example.
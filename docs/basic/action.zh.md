# Action
Ayanami 的 `Module` 底层由一个名为 `State` 的对象实现。`State` 对象和 `Redux` 的 `Store` 非常类似。它总是接收从 `Dispatcher` 和 `Effect` 发送过来的 `Action`, 并且将它们传递给 `Reducer` 和 `Effect`。

在使用 Ayanami 的应用中，你不需要手动创建 `Action`，所以我们并没有对外提供 `Dispatch` 方法。取而代之有两种方法可以达到 `Dispatch` action 的效果:

- 调用 **Dispatcher** 上的方法
- 在 **Effect** 中发射 (emmit) action

## Dispatcher & ActionsCreator
**Dispatcher** 是一个包含丰富类型定义的 **ActionsCreator** 的抽象。
所有 ayanami `Module` 类上被 **Reducer**, **ImmerReducer**, **Effect** 和 **DefineAction** 装饰器装饰的方法，都在 `Module` 类中的 **ActionsCreator** 对象上有一个对应的方法，也在 `Component` 中的 **Dispatcher** 上有一个对应的方法。`Module` 类中的 **ActionsCreator** 用来生成一个 `Action` 并且发射(Emmit) 给 `State` 对象，`Component` 中的 **Dispatcher** 用来直接 `Dispatch` 一个 Action 给 `State` 对象。

### Dispatch props created by Redux-Actions
你可能在写 `Redux` 的时候用过 [Redux-Actions](https://github.com/redux-utilities/redux-actions) 这个库。`Ayanami` 中的 **ActionsCreator** 概念与 `Redux-Actions` 库中的 **ActionsCreator** 非常类似。在 `Redux` 应用中 **ActionsCreator** 有几个明显的好处:

- 避免在程序中编写 [魔法字符串](ttps://en.wikipedia.org/wiki/Magic_number_(programming))
- (在 TypeScript 应用中)提供类型信息
- 减少样板代码

下面的例子展示了在 `Redux` 应用中使用和不使用 `Redux-Actions` 的区别:

<details>
<summary><code>不使用 redux-actions</code></summary>

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
<summary><code>使用 redux-actions</code></summary>

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
Ayanami 的 `Dispatcher` 借鉴了 `Redux-Actions` 的优势，让你不需要手动创建 `Action`，在 `Component` 中有两个 API 可以访问与 `Module` 类对应的 `Dispatcher`:

#### useAyanamiDispatchers
这个 `hook` 接收一个 **Module** 类，返回与这个 **Module** 对应的 **Dispatcher**

<details>
<summary><code>示例代码</code></summary>

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
这个 `hook` 与 `useAyanamiDispatchers` 几乎一样，但它即返回与 **Module** 类对应的 **AppState** 也返回 **Dispatcer**.

### Emit actions in Effect using **ActionsCreator**

[Effect](./effects.md) 的类型签名是: `<Payload>(action$: Observable<Payload>): Observable<Action>`.

返回的 `Action` 只能由 `Module` 类上的 **ActionsCreator** 生成，**ActionsCreator** 只能通过 `Module` 类上的 `getActions` 方法访问。

<details>
<summary><code>示例代码</code></summary>

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

在上面这个例子中，`this.getActions().add(payload)` 会创建一个与被 **Reducer** 装饰的 `add` 方法对应的 `Action`。在组件中调用 `dispatcher.payloadPassThrough(payload)` 会最终触发 `add` **Reducer**。在这个例子中从组件中直接调用 `dispatcher.add(payload)` 可以达到同样的效果。

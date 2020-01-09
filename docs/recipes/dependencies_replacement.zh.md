# 依赖替换
在 **mono repo** 项目中，替换依赖是非常常见的需求。对于这种场景，Ayanami 提供了 `InjectionProvidersContext` 这个 API 来提供替换依赖的能力.

[Codesandbox 例子](https://codesandbox.io/s/ayanami-recipes-dependencies-replacement-bmwkf)

<details>
<summary>示例代码</summary>

```ts
import "reflect-metadata";
import React from "react";
import { render } from "react-dom";
import { useAyanami, InjectionProvidersContext, ClassProvider } from "ayanami";
import { HttpErrorClient } from "./http-with-error.service";
import { HttpBetterClient } from "./http-better.service";

import { AppModule } from "./app.module";

const AppContainer = React.memo(({ appTitle }: { appTitle: string }) => {
  const [{ list }, dispatcher] = useAyanami(AppModule);

  const loading = !list ? <div>loading</div> : null;

  const title =
    list instanceof Error ? <h1>{list.message}</h1> : <h1>{appTitle}</h1>;

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
});

function App() {
  const betterHttpProvider: ClassProvider<HttpErrorClient> = {
    provide: HttpErrorClient,
    useClass: HttpBetterClient
  };
  return (
    <>
      <AppContainer appTitle="Always error" />
      <InjectionProvidersContext providers={[betterHttpProvider]}>
        <AppContainer appTitle="Better http client" />
      </InjectionProvidersContext>
    </>
  );
}

const rootElement = document.getElementById("app");
render(<App />, rootElement);
```

</details>

## 警告⚠️
为了不影响性能，**InjectionProvidersContext** 需要尽可能的放在 ***静态*** 上下文中。比如，在 LeetCode 的大部分 App 中，**InjectionProvidersContext** 只出现在 **AppRoot** 这一层级的组件中。永远不要将 **InjectionProvidersContext** 放在动态上下文中:

```tsx
const EnhancedLoggerProvider: ClassProvider<Logger> = {
  provide: Logger,
  useClass: EnhancedLoggerForItemDetail,
}

const Item = React.memo(({ item }: { item }: Item) => {
  // very bad
  return (
    <InjectionProvidersContext providers={[EnhancedLoggerProvider]}>
      <div key={item.id}>
        <ItemDetail detail={item.data.detailObject} />
      </div>
    </InjectionProvidersContext>
  )
})
```

如果你有类似的需求，即: **在组件级别而不是应用级别替换依赖**，你可以在 **Module** 中编写逻辑去处理这种需求。比如注入多个依赖到同一个 **Module** 中，再依据不同的 **Payload** 使用不同的依赖。

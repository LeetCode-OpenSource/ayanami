# Dependencies replacement
Replace an dependencies is a common requirement when you are developing a **mono repo** project.
For this scenario, **Ayanami** provide `InjectionProvidersContext` to replace dependencies.

[Example in Codesandbox](https://codesandbox.io/s/ayanami-recipes-dependencies-replacement-bmwkf)

<details>
<summary><code>Example codes</code></summary>

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

## Warning
For performance consideration, **InjectionProvidersContext** should be as static as possible. For example, in most of apps in **LeetCode**, we only put the **InjectionProvidersContext** in **AppRoot** level. You should never put **InjectionProvidersContext** in a dynamic context:

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

If you have the similar requirement: **Use different dependencies in Component level rather than application level**, you should handle the different in the **Module** side. For example you can inject different dependencies in **Module**, and use different dependency depend on the **Payload**.

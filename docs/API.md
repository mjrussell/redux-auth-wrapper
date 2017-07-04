## API

#### How to read the API

* Parameter names beginning with `?` are optional
* `HigherOrderComponent` is a function of type:
  ```
    ReactClass | ReactFunctionalComponent | string => ReactClass | ReactFunctionalComponent | string
  ```

## Redirection Helpers (React Router 3/History v3)

### `connectedRouterRedirect`

```js
connectedRouterRedirect({
  redirectPath: string | (state: Object, ownProps: Object) => string,
  authenticatedSelector: (state: Object, ownProps: Object) => boolean,
  ?authenticatingSelector: (state: Object, ownProps: Object) => boolean,
  ?AuthenticatingComponent: ReactClass | ReactFunctionalComponent | string,
  ?wrapperDisplayName: string
  ?allowRedirectBack: string | (state: Object, ownProps: Object) => boolean,
  ?redirectQueryParamName: string
}): HigherOrderComponent
```

### `connectedReduxRedirect`

```js
connectedRouterRedirect({
  redirectPath: string | (state: Object, ownProps: Object) => string,
  authenticatedSelector: (state: Object, ownProps: Object) => boolean,
  ?authenticatingSelector: (state: Object, ownProps: Object) => boolean,
  ?AuthenticatingComponent: ReactClass | ReactFunctionalComponent | string,
  ?wrapperDisplayName: string
  ?allowRedirectBack: string | (state: Object, ownProps: Object) => boolean,
  ?redirectQueryParamName: string
}): HigherOrderComponent
```

### `createOnEnter`

```js
createOnEnter({
  redirectPath: string | (state: Object, nextState: Object) => string,
  authenticatedSelector: (state: Object, nextState: Object) => boolean,
  ?authenticatingSelector: (state: Object, nextState: Object) => boolean,
  ?AuthenticatingComponent: ReactClass | ReactFunctionalComponent | string,
  ?wrapperDisplayName: string
  ?allowRedirectBack: string | (state: Object, nextState: Object) => boolean,
  ?redirectQueryParamName: string
}): (store: Object, nextState: Object: replace: (location: Object => void))
```

## Redirection Helpers (React Router 4/History v4)

### `connectedRouterRedirect`

```js
connectedRouterRedirect({
  redirectPath: string | (state: Object, ownProps: Object) => string,
  authenticatedSelector: (state: Object, ownProps: Object) => boolean,
  ?authenticatingSelector: (state: Object, ownProps: Object) => boolean,
  ?AuthenticatingComponent: ReactClass | ReactFunctionalComponent | string,
  ?wrapperDisplayName: string
  ?allowRedirectBack: string | (state: Object, ownProps: Object) => boolean,
  ?redirectQueryParamName: string
}): HigherOrderComponent
```

### `connectedReduxRedirect`

```js
connectedRouterRedirect({
  redirectPath: string | (state: Object, ownProps: Object) => string,
  redirectAction: (location: Object) => ReduxAction,
  authenticatedSelector: (state: Object, ownProps: Object) => boolean,
  ?authenticatingSelector: (state: Object, ownProps: Object) => boolean,
  ?AuthenticatingComponent: ReactClass | ReactFunctionalComponent | string,
  ?wrapperDisplayName: string
  ?allowRedirectBack: string | (state: Object, ownProps: Object) => boolean,
  ?redirectQueryParamName: string
}): HigherOrderComponent
```

## Other Wrappers

### `authWrapper`

```js
authWrapper({
  ?AuthenticatingComponent: ReactClass | ReactFunctionalComponent | string,
  ?FailureComponent: ReactClass | ReactFunctionalComponent | string,
  ?wrapperDisplayName: string
}): HigherOrderComponent
```

The returned Component after applying a Component to the HOC takes as props `isAuthenticated` and `isAuthenticating`, both of which are booleans. `isAuthenticating` defaults to `false`.

### `connectedAuthWrapper`

```js
connectedAuthWrapper({
  authenticatedSelector: (state: Object, ownProps: Object) => boolean,
  ?authenticatingSelector: (state: Object, ownProps: Object) => boolean,
  ?AuthenticatingComponent: ReactClass | ReactFunctionalComponent | string,
  ?FailureComponent: ReactClass | ReactFunctionalComponent | string,
  ?wrapperDisplayName: string
}): HigherOrderComponent
```

## Other Helpers

Coming soon!

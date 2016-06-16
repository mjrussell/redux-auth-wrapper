# redux-auth-wrapper

[![npm](https://img.shields.io/npm/v/redux-auth-wrapper.svg)](https://www.npmjs.com/package/redux-auth-wrapper)
[![npm dm](https://img.shields.io/npm/dm/redux-auth-wrapper.svg)](https://www.npmjs.com/package/redux-auth-wrapper)
[![Build Status](https://travis-ci.org/mjrussell/redux-auth-wrapper.svg?branch=master)](https://travis-ci.org/mjrussell/redux-auth-wrapper)
[![Coverage Status](https://coveralls.io/repos/github/mjrussell/redux-auth-wrapper/badge.svg?branch=master)](https://coveralls.io/github/mjrussell/redux-auth-wrapper?branch=master)

**Decouple your Authentication and Authorization from your components!**

`npm install --save redux-auth-wrapper`

## Motivation

At first, handling authentication and authorization seems easy in React-Router and Redux. After all, we have a handy [onEnter](https://github.com/rackt/react-router/blob/master/docs/API.md#onenternextstate-replace-callback) method, shouldn't we use it?

`onEnter` is great, and useful in certain situations. However, here are some common authentication and authorization problems `onEnter` does not solve:
* Decide authentication/authorization from redux store data (there are some [workarounds](https://github.com/CrocoDillon/universal-react-redux-boilerplate/blob/master/src/routes.jsx#L8))
* Recheck authentication/authorization if the store updates (but not the current route)
* Recheck authentication/authorization if a child route changes underneath the protected route

An alternative approach is to use [Higher Order Components](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750#.ao9jjxx89).
> A higher-order component is just a function that takes an existing component and returns another component that wraps it

Redux-auth-wrapper provides higher-order components for easy to read and apply authentication and authorization constraints for your components.

## Tutorial

Usage with [React-Router-Redux](https://github.com/rackt/react-router-redux) (Version 4.0)

```js
import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import { Router, Route } from 'react-router'
import { createHistory } from 'history'
import { routerReducer, syncHistoryWithStore, routerActions, routerMiddleware } from 'react-router-redux'
import { UserAuthWrapper } from 'redux-auth-wrapper'
import userReducer from '<project-path>/reducers/userReducer'

const reducer = combineReducers({
  routing: routerReducer,
  user: userReducer
})
const baseHistory = createHistory()
const routingMiddleware = routerMiddleware(baseHistory)

// Note: passing middleware as the last argument requires redux@>=3.1.0
const store = createStore(
  reducer,
  applyMiddleware(routingMiddleware)
)
const history = syncHistoryWithStore(baseHistory, store)

// Redirects to /login by default
const UserIsAuthenticated = UserAuthWrapper({
  authSelector: state => state.user, // how to get the user state
  redirectAction: routerActions.replace, // the redux action to dispatch for redirect
  wrapperDisplayName: 'UserIsAuthenticated' // a nice name for this auth check
})

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App}>
        <Route path="login" component={Login}/>
        <Route path="foo" component={UserIsAuthenticated(Foo)}/>
        <Route path="bar" component={Bar}/>
      </Route>
    </Router>
  </Provider>,
  document.getElementById('mount')
)
```

And your userReducer looks something like:
```js
const userReducer = (state = {}, { type, payload }) => {
  if (type === USER_LOGGED_IN) {
    return payload
  }
  if (type === USER_LOGGED_OUT) {
    return {}
  }
  return state
}
```

When the user navigates to `/foo`, one of the following occurs:

1. If The user data is null or an empty object:

    The user is redirected to `/login?redirect=%2foo`

    *Notice the url contains the query parameter `redirect` for sending the user back to after you log them into your app*
2. Otherwise:

    The `<Foo>` component is rendered and passed the user data as a property

Any time the user data changes, the UserAuthWrapper will re-check for authentication.

## API

`UserAuthWrapper(configObject)(DecoratedComponent)`

#### Config Object Keys

* `authSelector(state, [ownProps], [isOnEnter]): authData` \(*Function*): A state selector for the auth data. Just like `mapToStateProps`.
ownProps will be null if isOnEnter is true because onEnter hooks cannot receive the component properties. Can be ignored when not using onEnter.
* `authenticatingSelector(state, [ownProps]): Bool` \(*Function*): A state selector indicating if the user is currently authenticating. Just like `mapToStateProps`. Useful for async session loading.
* `LoadingComponent` \(*Component*): A React component to render while `authenticatingSelector` is `true`. If not present, will be a `<span/>`.
* `[failureRedirectPath]` \(*String*): Optional path to redirect the browser to on a failed check. Defaults to `/login`
* `[redirectAction]` \(*Function*): Optional redux action creator for redirecting the user. If not present, will use React-Router's router context to perform the transition.
* `[wrapperDisplayName]` \(*String*): Optional name describing this authentication or authorization check.
It will display in React-devtools. Defaults to `UserAuthWrapper`
* `[predicate(authData): Bool]` \(*Function*): Optional function to be passed the result of the `authSelector` param.
If it evaluates to false the browser will be redirected to `failureRedirectPath`, otherwise `DecoratedComponent` will be rendered.
* `[allowRedirectBack]` \(*Bool*): Optional bool on whether to pass a `redirect` query parameter to the `failureRedirectPath`

#### Returns
After applying the configObject, `UserAuthWrapper` returns a function which can applied to a Component to wrap in authentication and
authorization checks. The function also has the following extra properties:
* `onEnter(store, nextState, replace)` \(*Function*): Function to be optionally used in the [onEnter](https://github.com/reactjs/react-router/blob/master/docs/API.md#onenternextstate-replace-callback) property of a route.

#### Component Parameter
* `DecoratedComponent` \(*React Component*): The component to be wrapped in the auth check. It will pass down all props given to the returned component as well as the prop `authData` which is the result of the `authSelector`.
The component is not modified and all static properties are hoisted to the returned component

## Authorization & More Advanced Usage

```js
/* Allow only users with first name Bob */
const OnlyBob = UserAuthWrapper({
  authSelector: state => state.user,
  redirectAction: routerActions.replace,
  failureRedirectPath: '/app',
  wrapperDisplayName: 'UserIsOnlyBob',
  predicate: user => user.firstName === 'Bob'
})

/* Admins only */

// Take the regular authentication & redirect to login from before
const UserIsAuthenticated = UserAuthWrapper({
  authSelector: state => state.user,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated'
})
// Admin Authorization, redirects non-admins to /app and don't send a redirect param
const UserIsAdmin = UserAuthWrapper({
  authSelector: state => state.user,
  redirectAction: routerActions.replace,
  failureRedirectPath: '/app',
  wrapperDisplayName: 'UserIsAdmin',
  predicate: user => user.isAdmin,
  allowRedirectBack: false
})

// Now to secure the component:
<Route path="foo" component={UserIsAuthenticated(UserIsAdmin(Admin))}/>
```

The ordering of the nested higher order components is important because `UserIsAuthenticated(UserIsAdmin(Admin))`
means that logged out admins will be redirected to `/login` before checking if they are an admin.

Otherwise admins would be sent to `/app` if they weren't logged in and then redirected to `/login`, only to find themselves at `/app`
after entering their credentials.

### Where to define & apply the wrappers

One benefit of the beginning example is that it is clear from looking at the Routes where the
authentication & authorization logic is applied.

If you are using `getComponent` in React Router you should **not** apply the auth-wrapper inside `getComponent`. This will cause
React Router to create a new component each time the route changes.

An alternative choice might be to use es7 decorators (after turning on the proper presets) in your component:

```js
import { UserIsAuthenticated } from '<projectpath>/auth/authWrappers';

@UserIsAuthenticated
class MyComponent extends Component {
}
```

Or with standard ES5/ES6 apply it inside the component file:
```js
export default UserIsAuthenticated(MyComponent)
```



### Server Side Rendering
In order to perform authentication and authorization checks for Server Side Rendering, you may need to use the `onEnter` property
of a `<Route>`. You can access the `onEnter` method of the `UserAuthWrapper` after applying the config parameters:
```js
import { UserAuthWrapper } from 'redux-auth-wrapper';

const UserIsAuthenticated = UserAuthWrapper({
  authSelector: state => state.user,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated'
})

const getRoutes = (store) => {
  const connect = (fn) => (nextState, replaceState) => fn(store, nextState, replaceState);

  return (
    <Route>
      <Route path="/" component={App}>
        <Route path="login" component={Login}/>
        <Route path="foo" component={UserIsAuthenticated(Foo)} onEnter={connect(UserIsAuthenticated.onEnter)} />
      </Route>
    </Route>
  );
};
```

### React Native
Usage as above except include the react-native implementation


```js
import { UserAuthWrapper } from 'redux-auth-wrapper/lib/native';

const UserIsAuthenticated = UserAuthWrapper({
  authSelector: state => state.user,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated'
})
```

### Other examples
* [Redux-Router and React-Router 1.0 with JWT](https://github.com/mjrussell/react-redux-jwt-auth-example/tree/auth-wrapper)
* [React-Router-Redux and React-Router 2.0 with JWT](https://github.com/mjrussell/react-redux-jwt-auth-example/tree/react-router-redux)

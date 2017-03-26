# redux-auth-wrapper

[![npm](https://img.shields.io/npm/v/redux-auth-wrapper.svg)](https://www.npmjs.com/package/redux-auth-wrapper)
[![npm dm](https://img.shields.io/npm/dm/redux-auth-wrapper.svg)](https://www.npmjs.com/package/redux-auth-wrapper)
[![Build Status](https://travis-ci.org/mjrussell/redux-auth-wrapper.svg?branch=master)](https://travis-ci.org/mjrussell/redux-auth-wrapper)
[![Coverage Status](https://coveralls.io/repos/github/mjrussell/redux-auth-wrapper/badge.svg?branch=master)](https://coveralls.io/github/mjrussell/redux-auth-wrapper?branch=master)
[![Join the chat at https://gitter.im/mjrussell/redux-auth-wrapper](https://badges.gitter.im/mjrussell/redux-auth-wrapper.svg)](https://gitter.im/mjrussell/redux-auth-wrapper?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Decouple your Authentication and Authorization from your components!**

`npm install --save redux-auth-wrapper`

**Versioning Note:** This project adheres to [semver](http://semver.org/). Please view the [Changelog](/CHANGELOG.md) for release notes.

## Contents
* [Motivation](#motivation)
* [Tutorial](#tutorial)
* [API](#api)
* [Authorization & Advanced Usage](#authorization--advanced-usage)
* [Hiding and Alternate Components](#hiding-and-alternate-components)
* [Where to define & apply the wrappers](#where-to-define--apply-the-wrappers)
* [Protecting Multiple Routes](#protecting-multiple-routes)
* [Dispatching an Additional Redux Action on Redirect](#dispatching-an-additional-redux-action-on-redirect)
* [Server Side Rendering](#server-side-rendering)
* [React Native](#react-native)
* [Examples](#examples)

## Motivation

At first, handling authentication and authorization seems easy in React-Router and Redux. After all, we have a handy [onEnter](https://github.com/rackt/react-router/blob/master/docs/API.md#onenternextstate-replace-callback) method, shouldn't we use it?

`onEnter` is great, and useful in certain situations. However, here are some common authentication and authorization problems `onEnter` does not solve:
* Decide authentication/authorization from redux store data (there are some [workarounds](https://github.com/CrocoDillon/universal-react-redux-boilerplate/blob/master/src/routes.js#L8))
* Recheck authentication/authorization if the store updates (but not the current route)
* Recheck authentication/authorization if a child route changes underneath the protected route (React Router 2.0 now supports this with `onChange`)

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
import { Router, Route, browserHistory } from 'react-router'
import { routerReducer, syncHistoryWithStore, routerActions, routerMiddleware } from 'react-router-redux'
import { UserAuthWrapper } from 'redux-auth-wrapper'
import userReducer from '<project-path>/reducers/userReducer'

const reducer = combineReducers({
  routing: routerReducer,
  user: userReducer
})

const routingMiddleware = routerMiddleware(browserHistory)

// Note: passing middleware as the last argument requires redux@>=3.1.0
const store = createStore(
  reducer,
  applyMiddleware(routingMiddleware)
)
const history = syncHistoryWithStore(browserHistory, store)

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

**Note:** You still need to provide a mechanism for redirecting the user from the login page back to your component. You can
also do that with redux-auth-wrapper! See the [loading example](https://github.com/mjrussell/redux-auth-wrapper/blob/master/examples/loading/app.js) for further details.

## API

`UserAuthWrapper(configObject)(DecoratedComponent)`

#### Config Object Keys

* `authSelector(state, [ownProps]): authData` \(*Function*): A state selector for the auth data. Just like `mapToStateProps`.
ownProps will be null if isOnEnter is true because onEnter hooks cannot receive the component properties. Can be ignored when not using onEnter.
* `authenticatingSelector(state, [ownProps]): Bool` \(*Function*): A state selector indicating if the user is currently authenticating. Just like `mapToStateProps`. Useful for async session loading.
* `LoadingComponent` \(*Component*): A React component to render while `authenticatingSelector` is `true`. Will be passed
all properties passed into the wrapped component, including `children`.
* `FailureComponent` \(*Component*): A React component to render when `authenticatingSelector` is `false`. If specified, the wrapper will
**not** redirect. Can be set to `null` to display nothing when the user is not authenticated/authorized.
* `[failureRedirectPath]` \(*String | (state, [ownProps]): String*): Optional path to redirect the browser to on a failed check. Defaults to `/login`. Can also be a function of state and ownProps that returns a string.
* `[redirectQueryParamName]` \(*String*): Optional name of the query parameter added when `allowRedirectBack` is true. Defaults to `redirect`.
* `[redirectAction]` \(*Function*): Optional redux action creator for redirecting the user. If not present, will use React-Router's router context to perform the transition.
* `[wrapperDisplayName]` \(*String*): Optional name describing this authentication or authorization check.
It will display in React-devtools. Defaults to `UserAuthWrapper`
* `[predicate(authData): Bool]` \(*Function*): Optional function to be passed the result of the `authSelector` param.
If it evaluates to false the browser will be redirected to `failureRedirectPath`, otherwise `DecoratedComponent` will be rendered. By default, it returns false if `authData` is {} or null.
* `[allowRedirectBack]` \(*Bool | (location, redirectPath): Bool* ): Optional bool on whether to pass a `redirect` query parameter to the `failureRedirectPath`. Can also be a function of location and the computed `failureRedirectPath` passed above, that must return a boolean value. Defaults to `true`.
* `[propMapper]` \(*Function*): Optional function that takes the props passed into the wrapped component and returns those props to pass to the DecoratedComponent, The LoadingComponent, and the FailureComponent.

#### Returns
After applying the configObject, `UserAuthWrapper` returns a function which can applied to a Component to wrap in authentication and
authorization checks. The function also has the following extra properties:
* `onEnter(store, nextState, replace)` \(*Function*): Function to be optionally used in the [onEnter](https://github.com/reactjs/react-router/blob/master/docs/API.md#onenternextstate-replace-callback) property of a route.

#### Component Parameter
* `DecoratedComponent` \(*React Component*): The component to be wrapped in the auth check. It will pass down all props given to the returned component as well as the prop `authData` which is the result of the `authSelector`.
The component is not modified and all static properties are hoisted to the returned component

## Authorization & Advanced Usage

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

// Now to secure the component: first check if the user is authenticated, and then check if the user is an admin
<Route path="foo" component={UserIsAuthenticated(UserIsAdmin(Admin))}/>
```

The ordering of the nested higher order components is important because `UserIsAuthenticated(UserIsAdmin(Admin))`
means that logged out admins will be redirected to `/login` before checking if they are an admin.

Otherwise admins would be sent to `/app` if they weren't logged in and then redirected to `/login`, only to find themselves at `/app`
after entering their credentials.

## Hiding and Alternate Components

#### Hiding Components

The auth wrappers can be used for more than redirection. You can use the `FailureComponent` parameter to hide a
component or display an alternative component when the user is not authorized. Keep in mind that wrappers that use
`FailureComponent` will not redirect users.

Here is an example that hides a link from a non-admin user.
```js
const VisibleOnlyAdmin = UserAuthWrapper({
  authSelector: state => state.user,
  wrapperDisplayName: 'VisibleOnlyAdmin',
  predicate: user => user.isAdmin,
  FailureComponent: null
})

// Applying to a function component for simplicity but could be Class or createClass component
const AdminOnlyLink = VisibleOnlyAdmin(() => <Link to='/admin'>Admin Section</Link>)
```

You can see an example of hiding links in the basic example.

#### Alternate Components

Alternatively, you can specify a FailureComponent to display an alternative component, in this example we specify a new
function for our returned HOC to make it more flexible to apply across the app.

```js
const AdminOrElse = (Component, FailureComponent) => UserAuthWrapper({
  authSelector: state => state.user,
  wrapperDisplayName: 'AdminOrElse',
  predicate: user => user.isAdmin,
  FailureComponent
})(Component)

// Show Admin dashboard to admins and user dashboard to regular users
<Route path='/dashboard' component={AdminOrElse(AdminDashboard, UserDashboard)} />
```

## Where to define & apply the wrappers

One benefit of the beginning example is that it is clear from looking at the Routes where the
authentication & authorization logic is applied. There are a variety of other places to apply redux-auth-wrapper. Please
review this section first to avoid incorrectly applying the HOC and causing bugs in your code.

#### Safe to Apply

Directly inside ReactDOM.render:
```js
ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App}>
        <Route path="auth" component={UserIsAuthenticated(Foo)}/>
        ...
      </Route>
    </Router>
  </Provider>,
  document.getElementById('mount')
)
```

Separate route config file:
```js
const routes = (
  <Route path="/" component={App}>
    <Route path="auth" component={UserIsAuthenticated(Foo)}/>
    ...
  </Route>
)

ReactDOM.render(  
  <Provider store={store}>
    <Router history={history}>
      {routes}
    </Router>
  </Provider>,
  document.getElementById('mount')
)
```

Applied in the component file (es7):
```js
@UserIsAuthenticated
export default class MyComponent extends Component {
  ...
}
```

Applied in the component file (es6):
```js
class MyComponent extends Component {
  ...
}
export default UserIsAuthenticated(MyComponent)
```

Applied outside the component file:
```js
import MyComponent from './component/mycomponent.js'

const MyAuthComponent = UserIsAuthenticated(MyComponent)
```

#### Not Safe to Apply

The following are all not safe because they create a new component over and over again, preventing react from considering these the "same" component and causing mounting/unmounting loops.

Inside of render:
```js
import MyComponent from './component/MyComponent.js'

class MyParentComponent extends Component {
  render() {
    const MyAuthComponent = UserIsAuthenticated(MyComponent)
    return <MyAuthComponent />
  }
}
```

Inside of any `getComponent`:
```js
const routes = (
  <Route path="/" component={App}>
    <Route path="auth" getComponent={(nextState, cb) => {
      cb(null, UserIsAuthenticated(Foo))
     }} />
     ...
  </Route>
)
```

## Protecting Multiple Routes
Because routes in React Router are not required to have paths, you can use nesting to protect multiple routes without applying
the wrapper multiple times.
```js
const Authenticated = UserIsAuthenticated((props) => React.cloneElement(props.children, props));

<Route path='/' component={App}>
   <IndexRedirect to="/login" />
   <Route path='login' component={Login} />
   <Route component={Authenticated}>
     <Route path="foo" component={Foo} />
     <Route path="bar" component={Bar} />
   </Route>
</Route>
```

## Dispatching an Additional Redux Action on Redirect
You may want to dispatch an additional redux action when a redirect occurs. One example of this is to display a notification message
that the user is being redirected or don't have access to that protected resource. To do this, you can chain the `redirectAction`
parameter using `redux-thunk` middleware. It depends slightly on if you are using a redux + routing solution or just React Router.

#### Using `react-router-redux` or `redux-router` and dispatching an extra redux action in the wrapper
```js
import { replace } from 'react-router-redux'; // Or your redux-router equivalent
import addNotification from './notificationActions';

// Admin Authorization, redirects non-admins to /app
const UserIsAdmin = UserAuthWrapper({
  failureRedirectPath: '/app',
  predicate: user => user.isAdmin,
  redirectAction: (newLoc) => (dispatch) => {
     dispatch(replace(newLoc));
     dispatch(addNotification({ message: 'Sorry, you are not an administrator' }));
  },
  ...
})
```

#### Using React Router with history singleton and extra redux action
```js
import { browserHistory } from 'react-router';
import addNotification from './notificationActions';

// Admin Authorization, redirects non-admins to /app
const UserIsAdmin = UserAuthWrapper({
  failureRedirectPath: '/app',
  predicate: user => user.isAdmin,
  redirectAction: (newLoc) => (dispatch) => {
     browserHistory.replace(newLoc);
     dispatch(addNotification({ message: 'Sorry, you are not an administrator' }));
  },
  ...
})
```


## Server Side Rendering
If your `UserAuthWrapper` uses redirection, then you may need to use the `onEnter` property
of a `<Route>` to perform authentication and authorization checks for Server Side Rendering. (Note: If you are only using `FailureComponent` and not redirecting in your `UserAuthWrapper`, then you do not need to use `onEnter` option described below.)

During onEnter, selectors such as `authSelector`, `authenticatingSelector`, and `failureRedirectPath` (if you are using)
the function variation, will receive react-router's `nextState` as their second argument instead of the component props.

You can access the `onEnter` method of the `UserAuthWrapper` after applying the config parameters:
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

#### Server Side Rendering (SSR) with nested auth wrappers
To implement SSR with nested wrappers, you will have to provide a function to chain `onEnter` functions of each wrapper. To illustrate this, we can modify the example provided in the [Authorization & Advanced Usage](#authorization--advanced-usage) section above, wherein `UserIsAuthenticated` is the parent wrapper and `UserIsAdmin` is the child wrapper.

```js
import { UserAuthWrapper } from 'redux-auth-wrapper';

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

const getRoutes = (store) => {
  const connect = (fn) => (nextState, replaceState) => fn(store, nextState, replaceState);

  //This executes the parent onEnter first, going from left to right.
  // `replace` has to be wrapped because we want to stop executing `onEnter` hooks
  // after the first call to `replace`.
  const onEnterChain = (...listOfOnEnters) => (store, nextState, replace) => {
    let redirected = false;
    const wrappedReplace = (...args) => {
      replace(...args);
      redirected = true;
    };
    listOfOnEnters.forEach((onEnter) => {
      if (!redirected) {
        onEnter(store, nextState, wrappedReplace);
      }
    });
  };

  return (
    <Route>
      <Route path="/" component={App}>
        <Route path="login" component={Login}/>
        <Route path="foo"
          component={UserIsAuthenticated(UserIsAdmin(Admin))}
          onEnter={connect(onEnterChain(UserIsAuthenticated.onEnter, UserIsAdmin.onEnter))} />
      </Route>
    </Route>
  );
};

```

## React Native

This library can be used with React Native `>= 0.25.0` without any changes.

Using React Native and redux-auth-wrapper? Please help create an example for others to get started!

## Examples
* [Basic Example](https://github.com/mjrussell/redux-auth-wrapper/tree/master/examples/basic)
* [Loading Component Example](https://github.com/mjrussell/redux-auth-wrapper/tree/master/examples/loading)
* [Local Storage Example](https://github.com/mjrussell/redux-auth-wrapper/tree/master/examples/localStorage)
* [Redux-Router and React-Router 1.0 with JWT](https://github.com/mjrussell/react-redux-jwt-auth-example/tree/auth-wrapper)
* [React-Router-Redux and React-Router 2.0 with JWT](https://github.com/mjrussell/react-redux-jwt-auth-example/tree/react-router-redux)

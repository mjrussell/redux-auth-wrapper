# redux-auth-wrapper

[![npm version](https://badge.fury.io/js/redux-auth-wrapper.svg)](https://badge.fury.io/js/redux-auth-wrapper)
[![Build Status](https://travis-ci.org/mjrussell/redux-auth-wrapper.svg?branch=master)](https://travis-ci.org/mjrussell/redux-auth-wrapper)
[![Coverage Status](https://coveralls.io/repos/github/mjrussell/redux-auth-wrapper/badge.svg?branch=master)](https://coveralls.io/github/mjrussell/redux-auth-wrapper?branch=master)

**Decouple your Authentication and Authorization from your components!**

`npm install --save redux-auth-wrapper`

## Tutorial

Usage with [Redux-Simple-Router](https://github.com/rackt/redux-simple-router)

```js
import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import { Router, Route } from 'react-router'
import { createHistory } from 'history'
import { syncReduxAndRouter, routeReducer } from 'redux-simple-router'
import { UserAuthWrapper } from 'redux-auth-wrapper'
import userReducer from '<project-path>/reducers/userReducer'

const reducer = combineReducers({
  routing: routeReducer,
  user: userReducer
})
const history = createHistory()
const routingMiddleware = syncHistory(history)

const finalCreateStore = compose(
  applyMiddleware(routingMiddleware)
)(createStore);
const store = finalCreateStore(reducer)
routingMiddleware.listenForReplays(store)

// Redirects to /login by default
const UserIsAuthenticated = UserAuthWrapper({
  authSelector: state => state.user,
  wrapperDisplayName: 'UserIsAuthenticated'
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

* `authSelector(state, [ownProps]): authData` \(*Function*): A state selector for the auth data. Just like `mapToStateProps`
* `[failureRedirectPath]` \(*String*): Optional path to redirect the browser to on a failed check. Defaults to `/login`
* `[wrapperDisplayName]` \(*String*): Optional name describing this authentication or authorization check.
It will display in React-devtools. Defaults to `UserAuthWrapper`
* `[predicate(authData): Bool]` \(*Function*): Optional function to be passed the result of the `userAuthSelector` param.
If it evaluates to false the browser will be redirected to `failureRedirectPath`, otherwise `DecoratedComponent` will be rendered.
* `[allowRedirect]` \(*Bool*): Optional bool on whether to pass a `redirect` query parameter to the `failureRedirectPath`

#### Component Parameter
* `DecoratedComponent` \(*React Component*): The component to be wrapped in the auth check. It will pass down all props given to the returned component as well as the prop `authData` which is the result of the `authSelector`

## Authorization & More Advanced Usage

```js
/* Allow only users with first name Bob */
const OnlyBob = UserAuthWrapper({
  authSelector: state => state.user,
  failureRedirectPath: '/app',
  wrapperDisplayName: 'UserIsOnlyBob',
  predicate: user => user.firstName === 'Bob'
})

/* Admins only */

// Take the regular authentication & redirect to login from before
const UserIsAuthenticated = UserAuthWrapper({
  authSelector: state => state.user,
  wrapperDisplayName: 'UserIsAuthenticated'
})
// Admin Authorization, redirects non-admins to /app and don't send a redirect param
const UserIsAdmin = UserAuthWrapper({
  authSelector: state => state.user,
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

An alternative choice might be to use es7 decorators (after turning on the proper presets) in your component:

```js
import { UserIsAuthenticated } from '<projectpath>/auth/authWrappers';

@UserIsAuthenticated
class MyComponents extends Component {
}
```

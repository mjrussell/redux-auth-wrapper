# Migrating from Version 1.x to Version 2.x

## Motivation for 2.x

redux-auth-wrapper has really changed a lot since it was first designed as a small specialized utility for handling redirection with react-router-redux. Since then, it has been adopted by many developers and they've used it in numerous unforeseen and useful ways such as hiding components, displaying alternate components, and integrating with other routers. Additionally, redux-auth-wrapper needed to support two version of React Router (3 and 4) which had very different APIs. Therefore, version 2.x breaks redux-auth-wrapper into many more small, composable pieces. redux-auth-wrapper still provides a simple import for those looking to get started quickly with React Router, but also allows for developers to import the building blocks to create redirection wrappers that work with any router (or history directly). You can even use redux-auth-wrapper 2.x in a project without redux or even routing.

The largest change is that wrappers that perform redirection have been split from those that hide or display alternate components using `FailureComponent`.
This made practical sense since using a FailureComponent disabled the redirection, yet the wrapper would still complain
about missing redirection helpers like `history` even when they would not be used. Now you can use Failure Component wrappers
without even a router.

## Migrating redirection wrappers

The main changes are the following:
* Combined `authSelector` and `predicate` into a single `authenticatedSelector`
* No longer passed `authData` as a prop to child components. This was the return value of `authSelector`. If you need your auth data, just connect it at a lower level.
* renamed `LoadingComponent` to `AuthenticatingComponent`
* renamed `failureRedirectPath` to `redirectPath`
* `redirectPath` no longer defaults to `/login`
* removed `FailureComponent` from the redirect helper, see [Migrating failure and alternative components](#migrating-failure-and-alternative-components) for details
* Removed `mapProps`. If you need to prevent passing down any props from redux-auth-wrapper, use `mapProps` from recompose.

Previously:

v1.x:
```js
import { UserAuthWrapper } from 'redux-auth-wrapper'

const UserIsAuthenticated = UserAuthWrapper({
  authSelector: state => state.user.data,
  authenticatingSelector: state => state.user.isLoading,
  LoadingComponent: Loading,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated'
})
```

v2.x:
```js
// NOTE: use history3 because coming from React Router 2/3. If planning to upgrade to React Router 4 use history4
import { connectedReduxRedirect } from 'redux-auth-wrapper/history3/redirect'

export const userIsAuthenticated = connectedReduxRedirect({
  redirectPath: '/login',
  authenticatedSelector: state => state.user.data !== null,
  authenticatingSelector: state => state.user.isLoading,
  AuthenticatingComponent: Loading,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated'
})
```

**Note:** If not using `redirectAction`, import `connectedRouterRedirect` instead.

## Migrating failure and alternative components

* Combined `authSelector` and `predicate` into a single `authenticatedSelector`
* FailureComponent is optional now, not specifying it will render nothing (null) when the `authenticatedSelector` returns false
* All properties besides `authenticatedSelector`, `authenticatingSelector`, `FailureComponent`, and `wrapperDisplayName` have been removed

### Hiding Components

v1.x
```js
import { UserAuthWrapper } from 'redux-auth-wrapper'


const VisibleOnlyAdmin = UserAuthWrapper({
  authSelector: state => state.user,
  wrapperDisplayName: 'VisibleOnlyAdmin',
  predicate: user => user.isAdmin,
  FailureComponent: null
})

// Applying to a function component for simplicity but could be Class or createClass component
const AdminOnlyLink = VisibleOnlyAdmin(() => <Link to='/admin'>Admin Section</Link>)
```

v2.x
```js
import connectedAuthWrapper from 'redux-auth-wrapper/connectedAuthWrapper'

const visibleOnlyAdmin = authWrapper({
  authenticatedSelector: state => state.user !== null && state.user.isAdmin,
  wrapperDisplayName: 'VisibleOnlyAdmin',
})
```

### Alternate Components

v1.x
```js
import { UserAuthWrapper } from 'redux-auth-wrapper'

const AdminOrElse = (Component, FailureComponent) => UserAuthWrapper({
  authSelector: state => state.user,
  wrapperDisplayName: 'AdminOrElse',
  predicate: user => user.isAdmin,
  FailureComponent
})(Component)

// Show Admin dashboard to admins and user dashboard to regular users
<Route path='/dashboard' component={AdminOrElse(AdminDashboard, UserDashboard)} />
```

v2.x
```js
import connectedAuthWrapper from 'redux-auth-wrapper/connectedAuthWrapper'

const adminOrElse = (Component, FailureComponent) => connectedAuthWrapper({
  authenticatedSelector: state => state.user !== null && state.user.isAdmin,
  wrapperDisplayName: 'AdminOrElse',
  FailureComponent
})(Component)

// Show Admin dashboard to admins and user dashboard to regular users
<Route path='/dashboard' component={adminOrElse(AdminDashboard, UserDashboard)} />
```

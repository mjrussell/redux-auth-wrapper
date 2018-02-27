# React Router 3 Redirection

At first glance, it appears that redux-auth-wrapper is unnecessary in React Router 3 because of the  [onEnter](https://github.com/ReactTraining/react-router/blob/v3/docs/API.md#onenternextstate-replace-callback) method.

`onEnter` is great, and useful in certain situations. However, here are some common auth problems `onEnter` does not solve:
* Decide  authentication/authorization from redux store data (there are some [workarounds](https://github.com/CrocoDillon/universal-react-redux-boilerplate/blob/master/src/routes.js#L8))
* Recheck auth when the store changes but not the current route (not possible!)

Instead, we can use redux-auth-wrapper to protect React Router 3 routes with auth checks to more easily interact with our redux store.

## Securing a Route

To add redirection to your app with React Router 3, import the following helper:
```js
import { connectedRouterRedirect } from 'redux-auth-wrapper/history3/redirect'
```

The `connectedRouterRedirect` will build the redirect higher order component, but we have to first pass in a config object. The wrapper needs to know how to determine if a user is allowed to access the route.

```js
const userIsAuthenticated = connectedRouterRedirect({
   // The url to redirect user to if they fail
  redirectPath: '/login',
   // Determine if the user is authenticated or not
  authenticatedSelector: state => state.user !== null,
  // A nice display name for this check
  wrapperDisplayName: 'UserIsAuthenticated'
})
```

`userIsAuthenticated` is a Higher Order Component, so we can apply it to the component we want to protect. You can do this in many places, see [where to apply the wrappers](Overview.md#where-to-apply) for more details. In our case, we apply it directly in the route definition.

```js
<Route path="profile" component={userIsAuthenticated(Profile)}/>
```

When the user navigates to `/profile`, one of the following occurs:

1. If The `state.user` is null:

    The user is redirected to `/login?redirect=%2Fprofile`

    *Notice the url contains the query parameter `redirect` for sending the user back to after you log them into your app*
2. Otherwise:

    The `<Profile>` component is rendered

## Redirecting from Login

We've only done half of the work however. When a user logs into the login page, we want to send them back to `/profile`. Additionally, if a user is already logged in, but navigates to our login page, we may want to send them to a landing page (`/landing`). Luckily we can easily do both of these with another wrapper.

```js
import locationHelperBuilder from 'redux-auth-wrapper/history3/locationHelper'

const locationHelper = locationHelperBuilder({})

const userIsNotAuthenticated = connectedRouterRedirect({
  // This sends the user either to the query param route if we have one, or to the landing page if none is specified and the user is already logged in
  redirectPath: (state, ownProps) => locationHelper.getRedirectQueryParam(ownProps) || '/landing',
  // This prevents us from adding the query parameter when we send the user away from the login page
  allowRedirectBack: false,
  // Determine if the user is authenticated or not
  authenticatedSelector: state => state.user.data !== null,
  // A nice display name for this check
  wrapperDisplayName: 'UserIsNotAuthenticated'
})
```

```js
<Route path="profile" component={userIsAuthenticated(Profile)}/>
<Route path="login" component={userIsNotAuthenticated(Login)}/>
```

The `locationHelper` requires the `location` object in props. If the component is not rendered as part of a route component then you must use the `withRouter` HOC from `react-router`:

```js
withRouter(userIsNotAuthenticated(Login))
```  

## Displaying an AuthenticatingComponent Component

Its often useful to display some sort of loading component or animation when you are checking if the user's credentials are valid or if the user is already logged in. We can add a loading component to both our Login and Profile page easily:

When `authenticatingSelector` returns true, no redirection will be performed and the the specified `AuthenticatingComponent` will be displayed. If no `AuthenticatingComponent` is specified, then no component will be rendered (null).

```js
const userIsAuthenticated = connectedRouterRedirect({
  redirectPath: '/login',
  authenticatedSelector: state => state.user.data. !== null,
  wrapperDisplayName: 'UserIsAuthenticated'
  // Returns true if the user auth state is loading
  authenticatingSelector: state => state.user.isLoading,
  // Render this component when the authenticatingSelector returns true
  AuthenticatingComponent: LoadingSpinner,
})
```

You can also add an `authenticatingSelector` and `AuthenticatingComponent`

## Integrating with redux-based routing

If you want to dispatch a redux action to perform navigation instead of interacting directly with the history/router object then you can pass the redux action creator to `redirectAction`. Note that using `redirectAction` is not required if you use redux-based or redux-integrated routing, it only changes how the route change is triggered in the client.

To do this, swap out the import of `connectedRouterRedirect` for `connectedReduxRedirect` and pass the `redirectAction` parameter to the config object:

```js
import { connectedReduxRedirect } from 'redux-auth-wrapper/history3/redirect'
import { routerActions } from 'react-router-redux'

const userIsAuthenticated = connectedReduxRedirect({
  redirectPath: '/login',
  authenticatedSelector: state => state.user !== null,
  wrapperDisplayName: 'UserIsAuthenticated',
  // This should be a redux action creator
  redirectAction: routerActions.replace,
})
```

## Next Steps

Check out the [examples](https://github.com/mjrussell/redux-auth-wrapper/tree/master/examples) or browse the [API documentation](/docs/API.md). If you are using server side rendering (SSR) with React Router 3, you should also check out the [Server Side Rendering](/docs/AdvancedUsage/ReactRouter3.md) documentation.

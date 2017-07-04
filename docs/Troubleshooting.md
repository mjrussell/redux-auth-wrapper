# Troubleshooting and Common Issues

Having trouble with redux-auth-wrapper? Check out the following common issues.

#### Applying the HOC

Make sure that when using the helpers from redux-auth-wrapper that you are applying the HOC to your component and in the right location (see [where to apply the wrappers](Overview.md#where-to-apply) for more details). Most imports from this library are HOC builders, requiring first a configuration object. For instance you shouldn't be applying the `connectedRouterRedirect` directly to a component:

Incorrect:
```js
const ProtectedComponent = connectedRouterRedirect(MyComponent)
```

Correct:
```js
const userIsAuthenticated = connectedRouterRedirect({
  redirectPath: '/login',
  authenticatedSelector: state => state.user !== null
})

const ProtectedComponent = userIsAuthenticated(MyComponent)
```

Also, please be sure that you've applied the HOC in a proper location. Check out the documentation on [where to apply auth wrappers](/docs/Getting-Started/Overview.md#where-to-apply).

#### Rendering the wrapped component

Also remember that the result of an HOC being applied to a Component is a new Component, so you cannot render it without instantiating it:

Incorrect:
```js
const visibleOnlyAdmin = authWrapper({
  authenticatedSelector: state => state.user !== null && state.user.isAdmin,
  wrapperDisplayName: 'AdminOrHomeLink',
  FailureComponent: () => <Link to='/home'>Home Section</Link>
})

const AdminOnlyLink = visibleOnlyAdmin(() => <Link to='/admin'>Admin Section</Link>)

 class MyComponent extends Component {
   render() {
     return (
       <div>
        {AdminOnlyLink}
       </div>
     )

   }
 }
```

Correct:
```js
const visibleOnlyAdmin = authWrapper({
  authenticatedSelector: state => state.user !== null && state.user.isAdmin,
  wrapperDisplayName: 'AdminOrHomeLink',
  FailureComponent: () => <Link to='/home'>Home Section</Link>
})

const AdminOnlyLink = visibleOnlyAdmin(() => <Link to='/admin'>Admin Section</Link>)

 class MyComponent extends Component {
   render() {
     return (
       <div>
        <AdminOnlyLink />
       </div>
     )

   }
 }
```

#### Replace of undefined

The redirect helpers make us of the `history` object from React Router. In most cases, this is passed down because the wrapped component is rendered as a child of `<Router>`. However if you render the component elsewhere you might get `Uncaught TypeError: Cannot read property 'replace' of undefined`. This likely means the `history` object was not passed to the component. You can solve this by using the `withRouter` higher order component:

```js
import { withRouter } from 'react-router';
const userIsAuthenticated = connectedRouterRedirect({
  redirectPath: '/login',
  authenticatedSelector: state => state.user.data. !== null
})

const ProtectedComponent = withRouter(userIsAuthenticated(MyComponent))
```

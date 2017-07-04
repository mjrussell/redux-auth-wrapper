# Nesting Wrappers

Both the redirection HOCs and `authWrapper` can be nested (composed) together to create additional constraints for auth. This is especially useful when you want to provide authorization checks, such as checking a user is logged in and also an administrator.

For example, we can create a button that will only display for logged in users named Bob:

```js
const onlyBob = authWrapper({
  authenticatedSelector: state => state.user.firstName === 'Bob'
  wrapperDisplayName: 'UserIsOnlyBob',
})

const OnlyBobButton = onlyBob(MyButton)
```

When nesting redirection HOCs, it is important to pay attention to the order of the nesting, especially if you are using a different `redirectPath` or `allowRedirectBack`. Consider the following:

``` js
const userIsAuthenticated = connectedRouterRedirect({
  redirectPath: '/login',
  authenticatedSelector: state => state.user !== null,
  wrapperDisplayName: 'UserIsAuthenticated'
})

const userIsAdmin = connectedRouterRedirect({
  authenticatedSelector: state => state.user.isAdmin,
  redirectPath: '/app',
  wrapperDisplayName: 'UserIsAdmin',
  allowRedirectBack: false
})

// Now to secure the component: first check if the user is authenticated, and then check if the user is an admin
<Route path="admin" component={userIsAuthenticated(userIsAdmin(Admin))}/>
```

Because the `userIsAuthenticated` check happens first, if the users aren't logged in they will be sent to the `/login` first, skipping the admin check all together. Then once they've authenticated, they can be checked for if they are an admin. Otherwise, they would be sent to `/app` which might also be protected by a `userIsAuthenticated` and then get sent to `/login` from there (assuming another auth check). This would result in the user ending up at `/app` once they've authenticated, instead of at `/admin` if they are an admin but weren't logged in at the time.

#### Chaining using compose

Since Higher Order Components are functions, they can easily be chained together using `compose` to prevent accidentally applying them in the wrong order. `compose` can be imported from redux, or recompose:

```js
import { compose } from 'redux'

// userIsAuthenticated and userIsAdmin from above
const userIsAdminChain = compose(userIsAuthenticated, userIsAdmin)

// Now to secure the component, you don't have to think which order to apply!
<Route path="admin" component={userIsAdminChain(Admin)}/>
```

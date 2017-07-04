# React Router 3 Advanced Usage

## Protecting Multiple Routes

Because routes in React Router 3 are not required to have paths, you can use nesting to protect multiple routes without applying
the wrapper multiple times.
```js
const Authenticated = userIsAuthenticated(({ children, ...props }) => React.cloneElement(children, props));

<Route path='/' component={App}>
   <IndexRedirect to="/login" />
   <Route path='login' component={Login} />
   <Route component={Authenticated}>
     <Route path="foo" component={Foo} />
     <Route path="bar" component={Bar} />
   </Route>
</Route>
```

One thing to note is that if you use named children routes (TODO example) then you may need to use a different approach than `cloneElement` with the `children` prop.

## Server Side Rendering

If you are using redux-auth-wrapper for redirection in apps that use Server Side Rendering you may need to use the `onEnter`. This is because in most cases your server should redirect users before sending down the client HTML.

```js
import { createOnEnter } from '../src/history3/redirect'

const connect = (fn) => (nextState, replaceState) => fn(store, nextState, replaceState)

const userIsAuthenticated = connectedReduxRedirect({
  redirectPath: 'unprotected',
  authenticatedSelector: state => state.user !== null,
})

const onEnter = createOnEnter({
  redirectPath: 'unprotected',
  authenticatedSelector: state => state.user !== null,
})

<Route path='/' component={App}>
   <Route path='unprotected' component={Unprotected} />
   <Route path='protected' component={userIsAuthenticated(Unprotected)} onEnter={connect(onEnter)}
</Route>
```

During onEnter, selectors such as `authenticatedSelector`, `authenticatingSelector`, and `failureRedirectPath` (if you are using)
the function variation, will receive react-router's `nextState` as their second argument instead of the component props.

### With nested wrappers

To implement SSR with nested wrappers, you will have to provide a function to chain `onEnter` functions of each wrapper.

```js
const onEnterAuth = createOnEnter({
  redirectPath: 'unprotected',
  authenticatedSelector: state => state.user !== null,
})

const userIsAuthenticated = connectedReduxRedirect({
  redirectPath: 'unprotected',
  authenticatedSelector: state => state.user !== null,
})

const onEnterAdmin = createOnEnter({
  redirectPath: 'home',
  authenticatedSelector: state => state.user.isAdmin === false,
})

const userIsAdmin = connectedReduxRedirect({
  redirectPath: 'home',
  authenticatedSelector: state => state.user.isAdmin === false,
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
        <Route path="unprotected" component={Unprotected} />
        <Route path="home"
          component={userIsAuthenticated(Home)}
          onEnter={connect(onEnterChain(onEnterAuth))} />
        <Route path="admin"
          component={userIsAuthenticated(userIsAdmin(Admin))}
          onEnter={connect(onEnterChain(onEnterAuth, onEnterAdmin))} />
      </Route>
    </Route>
  );
};

```

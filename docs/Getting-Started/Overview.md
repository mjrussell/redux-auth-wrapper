# Overview

## Higher Order Components

redux-auth-wrapper makes use of higher order components to decouple the rendering logic in your components from the permissions a user might have. If you are unfamiliar with using higher order components or where to apply them, please read below, otherwise skip to the [Tutorials](#tutorials).

For a great read on what higher order components are, check out Dan Abramov's blog post:

[Higher Order Components](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750#.ao9jjxx89).
> A higher-order component is just a function that takes an existing component and returns another component that wraps it

### Where to apply

Higher order components are extremely powerful tools for adding logic to your components and keeping them easy to understand. It is important, however, to apply HOCs in the proper place. Failure to do so can cause subtle bugs and performance problems in your code.

In all of the following examples, we use the hoc `authWrapper`, but this advice applies for all HOCs (even ones not from redux-auth-wrapper).

#### Safe to Apply

Directly inside ReactDOM.render:
```js
ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App}>
        <Route path="auth" component={authWrapper(Foo)}/>
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
    <Route path="auth" component={authWrapper(Foo)}/>
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
@authWrapper
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

const MyAuthComponent = authWrapper(MyComponent)
```

#### Not Safe to Apply

The following are all not safe because they create a new component over and over again, preventing react from considering these the "same" component and causing mounting/unmounting loops.

Inside of render:
```js
import MyComponent from './component/MyComponent.js'

class MyParentComponent extends Component {
  render() {
    const MyAuthComponent = authWrapper(MyComponent)
    return <MyAuthComponent />
  }
}
```

Inside of any `getComponent` (react router 3):
```js
const routes = (
  <Route path="/" component={App}>
    <Route path="auth" getComponent={(nextState, cb) => {
      cb(null, authWrapper(Foo))
     }} />
     ...
  </Route>
)
```

## Tutorials

* [React Router 3 Tutorial](ReactRouter3.md)
* [React Router 4 Tutorial](ReactRouter4.md)
* [React Native Tutorial](ReactNative.md)
* [Hiding and Alternative Components](HidingAlternate.md)
* [Nesting Wrappers](NestingWrappers.md)

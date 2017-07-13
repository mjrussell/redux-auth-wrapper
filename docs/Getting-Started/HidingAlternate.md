# Hiding and Displaying Alternate Components

In addition to controlling what pages users can access in an application, another common requirement is to hide or display different elements on the page depending on the user's permissions. redux-auth-wrapper also provides an HOC that makes this easy to do in your application.

## Hiding a Component

If you want to hide a component, you can import the `connectedAuthWrapper` HOC. When the `authenticatedSelector` returns true, the wrapped component will be rendered and passed all props from the parent. When the `authenticatedSelector` returns false, no component will be rendered.

Here is an example that hides a link from a non-admin user.
```js
import connectedAuthWrapper from 'redux-auth-wrapper/connectedAuthWrapper'

const visibleOnlyAdmin = connectedAuthWrapper({
  authenticatedSelector: state => state.user !== null && state.user.isAdmin,
  wrapperDisplayName: 'VisibleOnlyAdmin',
})

// Applying to a function component for simplicity but could be Class or createClass component
const AdminOnlyLink = visibleOnlyAdmin(() => <Link to='/admin'>Admin Section</Link>)
```

## Displaying an Alternate Component

You can also display a component when the `authenticatedSelector` returns false. Simply pass the `FailureComponent` property to the `authWrapper`.

```js
import connectedAuthWrapper from 'redux-auth-wrapper/connectedAuthWrapper'

const visibleOnlyAdmin = connectedAuthWrapper({
  authenticatedSelector: state => state.user !== null && state.user.isAdmin,
  wrapperDisplayName: 'AdminOrHomeLink',
  FailureComponent: () => <Link to='/home'>Home Section</Link>
})

// Applying to a function component for simplicity but could be Class or createClass component
const AdminOnlyLink = visibleOnlyAdmin(() => <Link to='/admin'>Admin Section</Link>)
```

You can also easily wrap the call to `authWrapper` in a function to make it more flexible to apply throughout your code:

```js
const adminOrElse = (Component, FailureComponent) => connectedAuthWrapper({
  authenticatedSelector: state => state.user !== null && state.user.isAdmin,
  wrapperDisplayName: 'AdminOrElse',
  FailureComponent
})(Component)

// Show Admin dashboard to admins and user dashboard to regular users
<Route path='/dashboard' component={adminOrElse(AdminDashboard, UserDashboard)} />
```

## Unconnected Wrapper

If you don't want to have redux-auth-wrapper connect your selector automatically for you, you can use the un-connected version. This might be useful if you are already connecting the component and dont want the extra overhead of another `connect`, or want to pass the props in via traditional state.

```js
import authWrapper from 'redux-auth-wrapper/authWrapper'

const visibleOnlyAdmin = authWrapper({
  wrapperDisplayName: 'VisibleOnlyAdmin',
})

// Applying to a function component for simplicity but could be Class or createClass component
const AdminOnlyLink = visibleOnlyAdmin(() => <Link to='/admin'>Admin Section</Link>)

class MyComponent extends Component {

  ...

  render() {
    <div>
      <AdminOnlyLink isAuthenticated={this.state.isAuthenticated} />
    </div>
  }

}
```

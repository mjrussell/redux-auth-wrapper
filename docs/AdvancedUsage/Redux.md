# Redux Advanced Usage

## Dispatching an Additional Redux Action on Redirect
You may want to dispatch an additional redux action when a redirect occurs. One example of this is to display a notification message
that the user is being redirected or doesn't have access to that protected resource. To do this, you can chain the `redirectAction`
parameter using `redux-thunk` middleware. It depends slightly on if you are using a redux + routing solution or just React Router.

**Note:** make sure you add `redux-thunk` to your store's middleware or else the following will not work

#### Using `react-router-redux` or `redux-router` and dispatching an extra redux action in the wrapper
```js
import { replace } from 'react-router-redux'; // Or your redux-router equivalent
import { connectedReduxRedirect } from 'redux-auth-wrapper/history3/redirect'
import addNotification from './notificationActions';

// Admin Authorization, redirects non-admins to /app
export const userIsAdmin = connectedReduxRedirect({
  redirectPath: '/app',
  allowRedirectBack: false,
  authenticatedSelector: state => state.user !== null && state.user.isAdmin,
  redirectAction: (newLoc) => (dispatch) => {
     dispatch(replace(newLoc));
     dispatch(addNotification({ message: 'Sorry, you are not an administrator' }));
  },
  wrapperDisplayName: 'UserIsAdmin'
})
```

#### Using React Router with history singleton and extra redux action
```js
import { browserHistory } from 'react-router'; // react router 3
import addNotification from './notificationActions';

// Admin Authorization, redirects non-admins to /app
export const userIsAdmin = connectedReduxRedirect({
  redirectPath: '/app',
  allowRedirectBack: false,
  authenticatedSelector: state => state.user !== null && state.user.isAdmin,
  redirectAction: (newLoc) => (dispatch) => {
     browserHistory.replace(newLoc);
     dispatch(addNotification({ message: 'Sorry, you are not an administrator' }));
  },
  wrapperDisplayName: 'UserIsAdmin'
})
```

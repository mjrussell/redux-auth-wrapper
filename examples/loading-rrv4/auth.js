import Loading from './components/Loading'

import { UserAuthWrapper } from 'redux-auth-wrapper'

export const UserIsAuthenticated = UserAuthWrapper({
  authSelector: state => state.user.data,
  authenticatingSelector: state => state.user.isLoading,
  LoadingComponent: Loading,
  wrapperDisplayName: 'UserIsAuthenticated'
})

export const UserIsAdmin = UserAuthWrapper({
  authSelector: state => state.user.data,
  failureRedirectPath: '/',
  wrapperDisplayName: 'UserIsAdmin',
  predicate: user => user.isAdmin,
  allowRedirectBack: false
})

export const UserIsNotAuthenticated = UserAuthWrapper({
  authSelector: state => state.user,
  wrapperDisplayName: 'UserIsNotAuthenticated',
  // Want to redirect the user when they are done loading and authenticated
  predicate: user => user.data === null && user.isLoading === false,
  failureRedirectPath: (state, ownProps) => {
    let path
    if (ownProps.location.query) {
      path = ownProps.location.query.redirect
    }
    if (path === undefined) {
      path = '/foo'
    }
    return path
  },
    // ownProps.location.query.redirect || '/foo',
  allowRedirectBack: false
})

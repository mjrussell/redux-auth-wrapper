import { connect } from 'react-redux'
import redirectHelperBuilder from 'redux-auth-wrapper/history3'
import Redirect from 'redux-auth-wrapper/redirect'
import authWrapper from 'redux-auth-wrapper/connectedAuthWrapper'
import { routerActions } from 'react-router-redux'

import { Loading } from './components'

const redirectHelper = redirectHelperBuilder({})

const createRedirect = allowRedirectBack => dispatch => ({
  redirect: (...args) => {
    const redirectLoc = redirectHelper.createRedirect(allowRedirectBack)(...args)
    dispatch(routerActions.replace(redirectLoc))
  }
})

const AuthFailureRedirect = connect(() => ({
  redirectPath: '/login'
}), createRedirect(true))(Redirect)

export const userIsAuthenticated = authWrapper({
  authSelector: state => state.user.data,
  authenticatingSelector: state => state.user.isLoading,
  AuthenticatingComponent: Loading,
  FailureComponent: AuthFailureRedirect,
  wrapperDisplayName: 'UserIsAuthenticated'
})

const AdminFailureRedirect = connect(() => ({
  redirectPath: '/'
}), createRedirect(false))(Redirect)

export const userIsAdmin = authWrapper({
  authSelector: state => state.user.data,
  FailureComponent: AdminFailureRedirect,
  predicate: user => user.isAdmin,
  wrapperDisplayName: 'UserIsAdmin'
})

const LoggedInRedirect = connect((state, ownProps) => ({
  redirectPath: redirectHelper.getRedirect(ownProps) || '/foo'
}), createRedirect(false))(Redirect)

export const userIsNotAuthenticated = authWrapper({
  authSelector: state => state.user,
  wrapperDisplayName: 'UserIsNotAuthenticated',
  // Want to redirect the user when they are done loading and authenticated
  predicate: user => user.data === null && user.isLoading === false,
  FailureComponent: LoggedInRedirect
})

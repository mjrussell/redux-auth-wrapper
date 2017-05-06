import locationHelperBuilder from 'redux-auth-wrapper/history3/locationHelper'
import { connectedRouterRedirect } from 'redux-auth-wrapper/history3/redirect'
import { routerActions } from 'react-router-redux'

import { Loading } from './components'

const locationHelper = locationHelperBuilder({})

export const userIsAuthenticated = connectedRouterRedirect({
  redirectPath: '/login',
  authSelector: state => state.user.data,
  authenticatingSelector: state => state.user.isLoading,
  AuthenticatingComponent: Loading,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated'
})

export const userIsAdmin = connectedRouterRedirect({
  redirectPath: '/',
  allowRedirectBack: false,
  authSelector: state => state.user.data,
  predicate: user => user.isAdmin,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAdmin'
})

export const userIsNotAuthenticated = connectedRouterRedirect({
  redirectPath: (state, ownProps) => locationHelper.getRedirectQueryParam(ownProps) || '/foo',
  allowRedirectBack: false,
  authSelector: state => state.user,
  // Want to redirect the user when they are done loading and authenticated
  predicate: user => user.data === null && user.isLoading === false,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsNotAuthenticated'
})

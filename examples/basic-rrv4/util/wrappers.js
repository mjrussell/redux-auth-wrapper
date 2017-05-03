import locationHelperBuilder from 'redux-auth-wrapper/history4/locationHelper'
import { connectedRouterRedirect } from 'redux-auth-wrapper/history4/redirect'
import authWrapper from 'redux-auth-wrapper/connectedAuthWrapper'

const locationHelper = locationHelperBuilder({})

export const UserIsAuthenticated = connectedRouterRedirect({
  authSelector: state => state.user,
  redirectPath: (state, ownProps) => locationHelper.getRedirectQuery(ownProps) || '/login',
  wrapperDisplayName: 'UserIsAuthenticated'
})

export const UserIsAdmin = connectedRouterRedirect({
  authSelector: state => state.user,
  redirectPath: '/',
  wrapperDisplayName: 'UserIsAdmin',
  predicate: user => user.isAdmin,
  allowRedirectBack: false
})

export const VisibleOnlyAdmin = authWrapper({
  authSelector: state => state.user,
  wrapperDisplayName: 'VisibleOnlyAdmin',
  predicate: user => user.isAdmin
})

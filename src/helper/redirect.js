import { connect } from 'react-redux'
import invariant from 'invariant'
import omit from 'lodash.omit'

import authWrapper from '../authWrapper'
import Redirect from '../redirect'

const propMapper = allProps => {
  if (!allProps.isAuthenticated && !allProps.isAuthenticating) {
    return allProps
  } else {
    return omit(allProps, [ 'redirect', 'redirectPath', 'isAuthenticated', 'isAuthenticating' ])
  }
}

const connectedDefaults = {
  authenticatingSelector: () => false,
  allowRedirectBack: true,
  FailureComponent: Redirect,
  propMapper,
  redirectQueryParamName: 'redirect'
}

export default ({ locationHelperBuilder, getRouterRedirect }) => {

  const connectedRouterRedirect = (args) => {
    const allArgs = { ...connectedDefaults, ...args }
    const { redirectPath, authenticatedSelector, authenticatingSelector, allowRedirectBack, redirectQueryParamName } = allArgs

    const { createRedirectLoc } = locationHelperBuilder({
      redirectQueryParamName
    })

    let redirectPathSelector
    if (typeof redirectPath === 'string') {
      redirectPathSelector = () => redirectPath
    } else if (typeof redirectPath === 'function') {
      redirectPathSelector = redirectPath
    } else {
      invariant(false, 'redirectPath must be either a string or a function')
    }

    let allowRedirectBackFn
    if (typeof allowRedirectBack === 'boolean') {
      allowRedirectBackFn = () => allowRedirectBack
    } else if (typeof allowRedirectBack === 'function') {
      allowRedirectBackFn = allowRedirectBack
    } else {
      invariant(false, 'allowRedirectBack must be either a boolean or a function')
    }

    const redirect = (replace) => (props, path) =>
      replace(createRedirectLoc(allowRedirectBackFn(props, path))(props, path))

    return (DecoratedComponent) =>
      connect((state, ownProps) => ({
        redirectPath: redirectPathSelector(state, ownProps),
        isAuthenticated: authenticatedSelector(state, ownProps),
        isAuthenticating: authenticatingSelector(state, ownProps),
        redirect: redirect(getRouterRedirect(ownProps))
      }))(authWrapper(allArgs)(DecoratedComponent))
  }

  const connectedReduxRedirect = (args) => {
    const allArgs = { ...connectedDefaults, ...args }
    const { redirectPath, authenticatedSelector, authenticatingSelector, allowRedirectBack, redirectAction, redirectQueryParamName } = allArgs

    const { createRedirectLoc } = locationHelperBuilder({
      redirectQueryParamName
    })

    let redirectPathSelector
    if (typeof redirectPath === 'string') {
      redirectPathSelector = () => redirectPath
    } else if (typeof redirectPath === 'function') {
      redirectPathSelector = redirectPath
    } else {
      invariant(false, 'redirectPath must be either a string or a function')
    }

    let allowRedirectBackFn
    if (typeof allowRedirectBack === 'boolean') {
      allowRedirectBackFn = () => allowRedirectBack
    } else if (typeof allowRedirectBack === 'function') {
      allowRedirectBackFn = allowRedirectBack
    } else {
      invariant(false, 'allowRedirectBack must be either a boolean or a function')
    }

    const createRedirect = (dispatch) => ({
      redirect: (props, path) => dispatch(redirectAction(createRedirectLoc(allowRedirectBackFn(props, path))(props, path)))
    })

    return (DecoratedComponent) =>
      connect((state, ownProps) => ({
        redirectPath: redirectPathSelector(state, ownProps),
        isAuthenticated: authenticatedSelector(state, ownProps),
        isAuthenticating: authenticatingSelector(state, ownProps)
      }), createRedirect)(authWrapper(allArgs)(DecoratedComponent))
  }

  return {
    connectedRouterRedirect,
    connectedReduxRedirect
  }
}

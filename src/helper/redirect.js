import { connect } from 'react-redux'
import invariant from 'invariant'

import authWrapper from '../authWrapper'
import Redirect from '../redirect'

const connectedDefaults = {
  authenticatingSelector: () => false,
  allowRedirectBack: true,
  FailureComponent: Redirect
}

export default ({ locationHelperBuilder, getRouterRedirect }) => {

  const connectedRouterRedirect = (args) => {
    const allArgs = { ...connectedDefaults, ...args }
    const { redirectPath, authSelector, authenticatingSelector, allowRedirectBack, redirectQueryParamName } = allArgs

    const { createRedirectLoc } = locationHelperBuilder({
      redirectQueryParamName: redirectQueryParamName || 'redirect'
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
      invariant(false, 'redirectPath must be either a boolean or a fiwnction')
    }

    const redirect = (replace) => (props, path) =>
      replace(createRedirectLoc(allowRedirectBackFn(props, path))(props, path))

    return (DecoratedComponent) =>
      connect((state, ownProps) => ({
        redirectPath: redirectPathSelector(state, ownProps),
        authData: authSelector(state, ownProps),
        isAuthenticating: authenticatingSelector(state, ownProps),
        redirect: redirect(getRouterRedirect(ownProps))
      }))(authWrapper(allArgs)(DecoratedComponent))
  }

  const connectedReduxRedirect = (args) => {
    const allArgs = { ...connectedDefaults, ...args }
    const { redirectPath, authSelector, authenticatingSelector, allowRedirectBack, redirectAction, redirectQueryParamName } = allArgs

    const { createRedirectLoc } = locationHelperBuilder({
      redirectQueryParamName: redirectQueryParamName || 'redirect'
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
      invariant(false, 'redirectPath must be either a boolean or a fiwnction')
    }

    const createRedirect = (dispatch) => ({
      redirect: (props, path) => dispatch(redirectAction(createRedirectLoc(allowRedirectBackFn(props, path))(props, path)))
    })

    return (DecoratedComponent) =>
      connect((state, ownProps) => ({
        redirectPath: redirectPathSelector(state, ownProps),
        authData: authSelector(state, ownProps),
        isAuthenticating: authenticatingSelector(state, ownProps)
      }), createRedirect)(authWrapper(allArgs)(DecoratedComponent))
  }

  return {
    connectedRouterRedirect,
    connectedReduxRedirect
  }
}

import { connect } from 'react-redux'
import invariant from 'invariant'

import authWrapper from '../authWrapper'
import Redirect from '../redirect'

const connectedDefaults = {
  authenticatingSelector: () => false,
  allowRedirectBack: true,
  FailureComponent: Redirect
}

export default ({ createRedirectLoc, getRouterRedirect }) => {

  const connectedRouterRedirect = (args) => {
    const allArgs = { ...connectedDefaults, ...args }
    const { redirectPath, authSelector, authenticatingSelector, allowRedirectBack } = allArgs

    let redirectPathSelector
    if (typeof redirectPath === 'string') {
      redirectPathSelector = () => redirectPath
    } else if (typeof redirectPath === 'function') {
      redirectPathSelector = redirectPath
    } else {
      invariant(false, 'redirectPath must be either a string or a function')
    }

    const redirect = (replace) => (...args) => replace(createRedirectLoc(allowRedirectBack)(...args))

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
    const { redirectPath, authSelector, authenticatingSelector, allowRedirectBack, redirectAction } = allArgs

    let redirectPathSelector
    if (typeof redirectPath === 'string') {
      redirectPathSelector = () => redirectPath
    } else if (typeof redirectPath === 'function') {
      redirectPathSelector = redirectPath
    } else {
      invariant(false, 'redirectPath must be either a string or a function')
    }

    const createRedirect = (dispatch) => ({
      redirect: (...args) => dispatch(redirectAction(createRedirectLoc(allowRedirectBack)(...args)))
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

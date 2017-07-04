import locationHelperBuilder from '../history3/locationHelper'
import redirectUtil from '../helper/redirect'
import invariant from 'invariant'

export const { connectedRouterRedirect, connectedReduxRedirect } = redirectUtil({
  locationHelperBuilder,
  getRouterRedirect: ({ router }) => router.replace
})

const onEnterDefaults = {
  allowRedirectBack: true,
  authenticatingSelector: () => false,
  redirectQueryParamName: 'redirect'
}

export const createOnEnter = (config) => {
  const { authenticatedSelector, authenticatingSelector, redirectPath, allowRedirectBack, redirectQueryParamName } = {
    ...onEnterDefaults,
    ...config
  }

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

  return (store, nextState, replace) => {

    const { createRedirectLoc } = locationHelperBuilder({
      redirectQueryParamName
    })

    const isAuthenticated = authenticatedSelector(store.getState(), nextState)
    const isAuthenticating = authenticatingSelector(store.getState(), nextState)

    if (!isAuthenticated && !isAuthenticating) {
      const redirectPath = redirectPathSelector(store.getState(), nextState)
      replace(createRedirectLoc(allowRedirectBackFn(nextState, redirectPath))(nextState, redirectPath))
    }
  }
}

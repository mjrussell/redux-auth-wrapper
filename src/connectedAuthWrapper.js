import { connect } from 'react-redux'

import authWrapper from './authWrapper'

const connectedDefaults = {
  authenticatingSelector: () => false
}

export default (args) => {
  const { authSelector, authenticatingSelector } = {
    ...connectedDefaults,
    ...args
  }

  return (DecoratedComponent) =>
    connect((state, ownProps) => ({
      authData: authSelector(state, ownProps),
      isAuthenticating: authenticatingSelector(state, ownProps)
    }))(authWrapper(args)(DecoratedComponent))
}

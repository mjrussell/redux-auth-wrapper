import { connect } from 'react-redux'
import authWrapper from './authWrapper.js'


const connectedDefaults = {
  authenticatingSelector: () => false
}

export default (args) => {
  const { authenticatedSelector, authenticatingSelector, preAuthAction} = {
    ...connectedDefaults,
    ...args
  }

  return (DecoratedComponent) =>
    connect((state, ownProps) => ({
      isAuthenticated: authenticatedSelector(state, ownProps),
      isAuthenticating: authenticatingSelector(state, ownProps)
    }), (dispatch) => ({
      preAuthAction: () => {
        if (preAuthAction) {
          dispatch(preAuthAction())
        }
      }
    }))(authWrapper(args)(DecoratedComponent))
}

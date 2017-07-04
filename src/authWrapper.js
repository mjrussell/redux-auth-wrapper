import React, { Component } from 'react'
import PropTypes from 'prop-types'
import hoistStatics from 'hoist-non-react-statics'

const defaults = {
  AuthenticatingComponent: () => null, // dont render anything while authenticating
  FailureComponent: () => null, // dont render anything on failure of the predicate
  wrapperDisplayName: 'AuthWrapper'
}

export default (args) => {
  const { AuthenticatingComponent, FailureComponent, wrapperDisplayName } = {
    ...defaults,
    ...args
  }

  // Wraps the component that needs the auth enforcement
  function wrapComponent(DecoratedComponent) {
    const displayName = DecoratedComponent.displayName || DecoratedComponent.name || 'Component'

    class UserAuthWrapper extends Component {

      static displayName = `${wrapperDisplayName}(${displayName})`;

      static propTypes = {
        isAuthenticated: PropTypes.bool,
        isAuthenticating: PropTypes.bool
      };

      static defaultProps = {
        isAuthenticating: false
      }

      render() {
        const { isAuthenticated, isAuthenticating } = this.props
        if (isAuthenticated) {
          return <DecoratedComponent {...this.props} />
        } else if(isAuthenticating) {
          return <AuthenticatingComponent {...this.props} />
        } else {
          return <FailureComponent {...this.props} />
        }
      }
    }

    return hoistStatics(UserAuthWrapper, DecoratedComponent)
  }

  return wrapComponent
}

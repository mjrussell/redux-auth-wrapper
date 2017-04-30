import React, { Component } from 'react'
import PropTypes from 'prop-types'
import hoistStatics from 'hoist-non-react-statics'
import isEmpty from 'lodash.isempty'

const defaults = {
  AuthenticatingComponent: () => null, // dont render anything while authenticating
  FailureComponent: undefined,
  wrapperDisplayName: 'AuthWrapper',
  predicate: x => !isEmpty(x),
  propMapper: props => props
}

export default (args) => {
  const { AuthenticatingComponent, FailureComponent, wrapperDisplayName, predicate, propMapper } = {
    ...defaults,
    ...args
  }

  // Wraps the component that needs the auth enforcement
  function wrapComponent(DecoratedComponent) {
    const displayName = DecoratedComponent.displayName || DecoratedComponent.name || 'Component'

    class UserAuthWrapper extends Component {

      static displayName = `${wrapperDisplayName}(${displayName})`;

      static propTypes = {
        authData: PropTypes.any,
        isAuthenticating: PropTypes.bool
      };

      static defaultProps = {
        isAuthenticating: false
      }

      render() {
        // Allow everything but the replace aciton creator to be passed down
        // Includes route props from React-Router and authData
        const { authData, isAuthenticating } = this.props
        if (predicate(authData)) {
          return <DecoratedComponent {...propMapper(this.props)} />
        } else if(isAuthenticating) {
          return <AuthenticatingComponent {...propMapper(this.props)} />
        } else {
          return FailureComponent ? <FailureComponent {...propMapper(this.props)} /> : null
        }
      }
    }

    return hoistStatics(UserAuthWrapper, DecoratedComponent)
  }

  return wrapComponent
}

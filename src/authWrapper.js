import React from 'react'
import PropTypes from 'prop-types'
import hoistStatics from 'hoist-non-react-statics'
import { useLocation, useParams } from 'react-router'

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

    const UserAuthWrapper = (props) => {
      let location = {}
      try { location = useLocation() } catch(e) {}
      const params = useParams()
      const newProps = {...props, location, params}
      const { isAuthenticated, isAuthenticating, preAuthAction } = props
      
      React.useEffect(() => {
        if (preAuthAction) {
          preAuthAction();
        }
      }, [])
      
      if (isAuthenticated) {
        return <DecoratedComponent {...newProps} />
      } else if(isAuthenticating) {
        return <AuthenticatingComponent {...newProps} />
      } else {
        return <FailureComponent {...newProps} />
      }
    }

    UserAuthWrapper.displayName = `${wrapperDisplayName}(${displayName})`
    UserAuthWrapper.propTypes = {
      isAuthenticated: PropTypes.bool,
      isAuthenticating: PropTypes.bool
    }
    UserAuthWrapper.defaultProps = {
      isAuthenticating: false
    }

    return hoistStatics(UserAuthWrapper, DecoratedComponent)
  }

  return wrapComponent
}

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import hoistStatics from 'hoist-non-react-statics'
import { useLocation, useParams, useNavigate } from 'react-router'

const defaults = {
  AuthenticatingComponent: () => null, // dont render anything while authenticating
  FailureComponent: () => null, // dont render anything on failure of the predicate
  wrapperDisplayName: 'AuthWrapper'
}

export default (args) => {
  const { AuthenticatingComponent, FailureComponent, wrapperDisplayName,  LoadingComponent } = {
    ...defaults,
    ...args
  }

  // Wraps the component that needs the auth enforcement
  function wrapComponent(DecoratedComponent) {
    const displayName = DecoratedComponent.displayName || DecoratedComponent.name || 'Component'

    const UserAuthWrapper = (props) => {
      let location = {}
      try { location = useLocation() } catch(e) {}
      const navigate = useNavigate()
      const params = useParams()
      const [loading, setLoading] = useState(true)
      const replace = (path) => navigate(path, {replace: true})
      const newProps = {...props, location, params, replace}
      const { isAuthenticated, isAuthenticating, preAuthAction } = props
      
      React.useEffect(() => {
        if (preAuthAction) {
          preAuthAction();
        }
        setLoading(false);
      }, [])
      
      if (loading) {
        /**
         * If loading component is not provided then render the authenticating component as a fallback, Since mostly
         * authenticating component will be a loader or a spinner.
         */
        return (
          <React.Fragment>
            {LoadingComponent
              ? <LoadingComponent />
              : <AuthenticatingComponent {...newProps} />
            }
          </React.Fragment>
        )
      } else if (isAuthenticated) {
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

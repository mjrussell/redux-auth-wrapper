import hoistStatics from 'hoist-non-react-statics'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

const defaults = {
  AuthenticatingComponent: () => null, // dont render anything while authenticating
  FailureComponent: () => null, // dont render anything on failure of the predicate
  wrapperDisplayName: 'AuthWrapper'
}

export default (args) => {
  const { AuthenticatingComponent, FailureComponent, wrapperDisplayName, LoadingComponent } = {
    ...defaults,
    ...args
  }

  // Wraps the component that needs the auth enforcement
  function wrapComponent(DecoratedComponent) {
    const displayName = DecoratedComponent.displayName || DecoratedComponent.name || 'Component'

    class UserAuthWrapper extends Component {
      constructor() {
        super();
        this.state = { loading: true };
      }

      componentDidMount() {
        if (this.props.preAuthAction) {
          this.props.preAuthAction();
        }
        // reset the loading state once component is mounted.
        this.setState({loading: false})
      }

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
        if (this.state.loading) {
          /**
           * If loading component is not provided then render the authenticating component as a fallback, Since mostly
           * authenticating component will be a loader or a spinner.
           */
          return (
            <React.Fragment>
              {LoadingComponent
                ? <LoadingComponent />
                : <AuthenticatingComponent {...this.props} />
              }
            </React.Fragment>
          )
        }else if (isAuthenticated) {
          return <DecoratedComponent {...this.props} />
        } else if (isAuthenticating) {
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

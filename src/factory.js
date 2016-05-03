import { connect } from 'react-redux'
import hoistStatics from 'hoist-non-react-statics'
import isEmpty from 'lodash.isempty'

const defaults = {
  LoadingComponent: 'span',
  failureRedirectPath: '/login',
  wrapperDisplayName: 'AuthWrapper',
  predicate: x => !isEmpty(x),
  authenticatingSelector: () => false,
  allowRedirectBack: true
}

export default function factory(React, empty) {

  const { Component, PropTypes } = React

  return (args) => {
    const { authSelector, authenticatingSelector, LoadingComponent, failureRedirectPath, wrapperDisplayName, predicate, allowRedirectBack, redirectAction } = {
      ...defaults,
      ...args
    }

    const isAuthorized = (authData) => predicate(authData)

    const ensureAuth = ({ location, authData }, redirect) => {
      let query
      if (allowRedirectBack) {
        query = { redirect: `${location.pathname}${location.search}` }
      } else {
        query = {}
      }

      if (!isAuthorized(authData)) {
        redirect({
          pathname: failureRedirectPath,
          query
        })
      }
    }

    // Wraps the component that needs the auth enforcement
    function wrapComponent(DecoratedComponent) {
      const displayName = DecoratedComponent.displayName || DecoratedComponent.name || 'Component'

      const mapDispatchToProps = (dispatch) => {
        if (redirectAction !== undefined) {
          return { redirect: (args) => dispatch(redirectAction(args)) }
        } else {
          return {}
        }
      }

      @connect(
        (state, ownProps) => {
          return {
            authData: authSelector(state, ownProps, false),
            isAuthenticating: authenticatingSelector(state, ownProps)
          }
        },
        mapDispatchToProps,
      )
      class UserAuthWrapper extends Component {

        static displayName = `${wrapperDisplayName}(${displayName})`;

        static propTypes = {
          location: PropTypes.shape({
            pathname: PropTypes.string.isRequired,
            search: PropTypes.string.isRequired
          }).isRequired,
          redirect: PropTypes.func,
          authData: PropTypes.object
        };

        static contextTypes = {
          // Only used if no redirectAction specified
          router: React.PropTypes.object
        };

        componentWillMount() {
          if(!this.props.isAuthenticating) {
            ensureAuth(this.props, this.getRedirectFunc(this.props))
          }
        }

        componentWillReceiveProps(nextProps) {
          if(!nextProps.isAuthenticating) {
            ensureAuth(nextProps, this.getRedirectFunc(nextProps))
          }
        }

        getRedirectFunc = (props) => {
          if (props.redirect) {
            return props.redirect
          } else {
            if (!this.context.router.replace) {
              /* istanbul ignore next sanity */
              throw new Error(`You must provide a router context (or use React-Router 2.x) if not passing a redirectAction to ${wrapperDisplayName}`)
            } else {
              return this.context.router.replace
            }
          }
        };

        render() {
          // Allow everything but the replace aciton creator to be passed down
          // Includes route props from React-Router and authData
          const { redirect, authData, isAuthenticating, ...otherProps } = this.props
          if (isAuthorized(authData)) {
            return <DecoratedComponent authData={authData} {...otherProps} />
          } else if(isAuthenticating) {
            return <LoadingComponent {...otherProps} />
          } else {
            // Don't need to display anything because the user will be redirected
            return React.createElement(empty)
          }
        }
      }

      return hoistStatics(UserAuthWrapper, DecoratedComponent)
    }

    wrapComponent.onEnter = (store, nextState, replace) => {
      const authData = authSelector(store.getState(), null, true)
      ensureAuth({ location: nextState.location, authData }, replace)
    }

    return wrapComponent
  }
}

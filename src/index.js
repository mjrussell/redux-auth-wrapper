import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import hoistStatics from 'hoist-non-react-statics'
import isEmpty from 'lodash.isempty'
import warning from 'warning'

const defaults = {
  failureRedirectPath: '/login',
  wrapperDisplayName: 'AuthWrapper',
  predicate: x => !isEmpty(x),
  allowRedirectBack: true
}

const UserAuthWrapper = (args) => {
  const { authSelector, failureRedirectPath, wrapperDisplayName, predicate, allowRedirectBack, redirectAction } = {
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
      state => { return { authData: authSelector(state) } },
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
        ensureAuth(this.props, this.getRedirectFunc(this.props))
      }

      componentWillReceiveProps(nextProps) {
        ensureAuth(nextProps, this.getRedirectFunc(nextProps))
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
        const { redirect, authData, ...otherProps } = this.props

        if (isAuthorized(authData)) {
          return <DecoratedComponent authData={authData} {...otherProps} />
        } else {
          // Don't need to display anything because the user will be redirected
          return <div/>
        }
      }
    }

    return hoistStatics(UserAuthWrapper, DecoratedComponent)
  }

  wrapComponent.onEnter = (store, nextState, replace) => {
    const authData = authSelector(store.getState())
    ensureAuth({ location: nextState.location, authData }, replace)
  }

  return wrapComponent
}

// Support the old 0.1.x with deprecation warning
const DeprecatedWrapper = authSelector =>
  (failureRedirectPath, wrapperDisplayName, predicate = x => !isEmpty(x), allowRedirectBack = true) => {
    warning(false, `Deprecated arg style syntax found for auth wrapper named ${wrapperDisplayName}. Pass a config object instead`)
    return UserAuthWrapper({
      ...defaults,
      authSelector,
      failureRedirectPath,
      wrapperDisplayName,
      predicate,
      allowRedirectBack
    })
  }

const BackwardsCompatWrapper = (arg) => {
  if (typeof arg === 'function') {
    return DeprecatedWrapper(arg)
  } else {
    return UserAuthWrapper(arg)
  }
}

module.exports.UserAuthWrapper = BackwardsCompatWrapper

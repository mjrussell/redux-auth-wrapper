import React, { Component, PropTypes } from 'react'
import { routeActions } from 'redux-simple-router'
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
  const { authSelector, failureRedirectPath, wrapperDisplayName, predicate, allowRedirectBack } = {
    ...defaults,
    ...args
  }
  // Wraps the component that needs the auth enforcement
  return function wrapComponent(DecoratedComponent) {
    const displayName = DecoratedComponent.displayName || DecoratedComponent.name || 'Component'

    @connect(
      state => { return { authData: authSelector(state) } },
      { replace: routeActions.replace }
    )
    class UserAuthWrapper extends Component {

      static displayName = `${wrapperDisplayName}(${displayName})`;

      static propTypes = {
        location: PropTypes.shape({
          pathname: PropTypes.string.isRequired,
          search: PropTypes.string.isRequired
        }).isRequired,
        replace: PropTypes.func.isRequired,
        authData: PropTypes.object
      };

      componentWillMount() {
        this.ensureLoggedIn(this.props)
      }

      componentWillReceiveProps(nextProps) {
        this.ensureLoggedIn(nextProps)
      }

      isAuthorized = (authData) => predicate(authData);

      ensureLoggedIn = (props) => {
        const { replace, location, authData } = props
        let query
        if (allowRedirectBack) {
          query = { redirect: `${location.pathname}${location.search}` }
        } else {
          query = {}
        }

        if (!this.isAuthorized(authData)) {
          replace({
            pathname: failureRedirectPath,
            query
          })
        }
      };

      render() {
        // Allow everything but the replace aciton creator to be passed down
        // Includes route props from React-Router and authData
        const { replace, authData, ...otherProps } = this.props

        if (this.isAuthorized(authData)) {
          return <DecoratedComponent authData={authData} {...otherProps} />
        } else {
          // Don't need to display anything because the user will be redirected
          return <div/>
        }
      }
    }

    return hoistStatics(UserAuthWrapper, DecoratedComponent)
  }
}

// Support the old 0.1.x with deprecation warning
const DeprecatedWrapper = authSelector =>
  (failureRedirectPath, wrapperDisplayName, predicate = x => !isEmpty(x), allowRedirectBack = true) => {
    warning(false, `Deprecated arg style syntax found for auth wrapped named ${wrapperDisplayName}. Pass a config object instead`)
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

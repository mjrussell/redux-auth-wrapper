import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import hoistStatics from 'hoist-non-react-statics'
import isEmpty from 'lodash.isempty'
import url from 'url'

const defaults = {
  LoadingComponent: () => null, // dont render anything while authenticating
  failureRedirectPath: '/login',
  FailureComponent: undefined,
  redirectQueryParamName: 'redirect',
  wrapperDisplayName: 'AuthWrapper',
  predicate: x => !isEmpty(x),
  authenticatingSelector: () => false,
  allowRedirectBack: true,
  propMapper: ({ redirect, authData, isAuthenticating, failureRedirectPath, ...otherProps }) => ({ authData, ...otherProps }) // eslint-disable-line no-unused-vars
}

export const UserAuthWrapper = (args) => {
  const { authSelector, authenticatingSelector, LoadingComponent, failureRedirectPath, FailureComponent,
    wrapperDisplayName, predicate, allowRedirectBack, redirectAction, redirectQueryParamName, propMapper } = {
      ...defaults,
      ...args
    }

  const isAuthorized = (authData) => predicate(authData)

  const createRedirect = (location, redirect, redirectPath) => {
    const redirectLoc = url.parse(redirectPath, true)

    let query
    const canRedirect = typeof allowRedirectBack === 'function' ? allowRedirectBack(location, redirectPath) : allowRedirectBack

    if (canRedirect) {
      query = { [redirectQueryParamName]: `${location.pathname}${location.search}${location.hash}` }
    } else {
      query = {}
    }

    query = {
      ...query,
      ...redirectLoc.query
    }

    redirect({
      pathname: redirectLoc.pathname,
      hash: redirectLoc.hash,
      query
    })
  }

  const shouldRedirect = FailureComponent === undefined
  const locationShape = PropTypes.shape({
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired
  })

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
          authData: authSelector(state, ownProps),
          failureRedirectPath: typeof failureRedirectPath === 'function' ? failureRedirectPath(state, ownProps) : failureRedirectPath,
          isAuthenticating: authenticatingSelector(state, ownProps)
        }
      },
      mapDispatchToProps,
    )
    class UserAuthWrapper extends Component {

      static displayName = `${wrapperDisplayName}(${displayName})`;

      static propTypes = {
        failureRedirectPath: PropTypes.string.isRequired,
        location: shouldRedirect ? locationShape.isRequired : locationShape,
        redirect: PropTypes.func,
        authData: PropTypes.object
      };

      static contextTypes = {
        // Only used if no redirectAction specified
        router: PropTypes.object
      };

      componentWillMount() {
        if(!this.props.isAuthenticating && !isAuthorized(this.props.authData) && shouldRedirect) {
          createRedirect(this.props.location, this.getRedirectFunc(this.props), this.props.failureRedirectPath)
        }
      }

      componentWillReceiveProps(nextProps) {
        const willBeAuthorized = isAuthorized(nextProps.authData)
        const willbeAuthenticating = nextProps.isAuthenticating
        const wasAuthorized = isAuthorized(this.props.authData)
        const wasAuthenticating = this.props.isAuthenticating

        // Don't bother to redirect if:
        // 1. currently authenticating or FailureComponent is set
        if (willbeAuthenticating || !shouldRedirect)
          return

        // Redirect if:
        if ( // 1. Was authorized, but no longer
          (wasAuthorized && !willBeAuthorized) ||
          // 2. Was not authorized and authenticating
          (wasAuthenticating && !willBeAuthorized)
        ) {
          createRedirect(nextProps.location, this.getRedirectFunc(nextProps), nextProps.failureRedirectPath)
        }
      }

      getRedirectFunc = ({ redirect }) => {
        if (redirect) {
          return redirect
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
        const { authData, isAuthenticating } = this.props
        if (isAuthorized(authData)) {
          return <DecoratedComponent {...propMapper(this.props)} />
        } else if(isAuthenticating) {
          return <LoadingComponent {...propMapper(this.props)} />
        } else {
          // Display FailureComponent or nothing if FailureComponent is null
          // If FailureComponent is undefined user will never see this because
          // they will be redirected to failureRedirectPath
          return FailureComponent ? <FailureComponent {...propMapper(this.props)} /> : null
        }
      }
    }

    return hoistStatics(UserAuthWrapper, DecoratedComponent)
  }

  if (shouldRedirect) {
    wrapComponent.onEnter = (store, nextState, replace) => {
      const authData = authSelector(store.getState(), nextState)
      const isAuthenticating = authenticatingSelector(store.getState(), nextState)

      if (!isAuthorized(authData) && !isAuthenticating) {
        const redirectPath = typeof failureRedirectPath === 'function' ? failureRedirectPath(store.getState(), nextState) : failureRedirectPath
        createRedirect(nextState.location, replace, redirectPath)
      }
    }
  }

  return wrapComponent
}

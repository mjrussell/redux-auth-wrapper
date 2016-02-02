import React, { Component, PropTypes } from 'react'
import { routeActions } from 'redux-simple-router'
import { connect } from 'react-redux'
import hoistStatics from 'hoist-non-react-statics'
import isEmpty from 'lodash.isempty'

/**
* A function which simplifies User Authentication and Authorization
* It is first passed a state selector for the authorization data and then can be passed the properties for
* authentication and authorization checking. Finally it will wrap any component that it is passed
*
* @param authSelector - State select for the auth data
* @param failureRedirectPath - Path to redirect the user to should the the predicate be is false
* @param wrapperDisplayName - Display name to be shown in the React Developer Console of the wrapped component
* @param predicate - From UserData to Boolean, if true the wrapped component is displayed, otherwise redirected
* Defaults to true if the user is logged in
* @param allowRedirectBack - If true the current path is saved in the new router state, allowing for a redirect back
* @returns A function which when applied to a component returns a new component with User Authentication and
* Authorization enforced
*/

export const UserAuthWrapper = authSelector =>
  (failureRedirectPath, wrapperDisplayName, predicate = x => !isEmpty(x), allowRedirectBack = true) => {
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

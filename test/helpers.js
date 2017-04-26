import React, { Component, PropTypes } from 'react'

export const USER_LOGGED_IN = 'USER_LOGGED_IN'
export const USER_LOGGED_OUT = 'USER_LOGGED_OUT'
export const USER_LOGGING_IN = 'USER_LOGGING_IN'

export const userReducerInitialState = {
  userData: {},
  isAuthenticating: false
}

export const userReducer = (state = {}, { type, payload }) => {
  if (type === USER_LOGGED_IN) {
    return {
      userData: payload,
      isAuthenticating: false
    }
  } else if (type === USER_LOGGED_OUT) {
    return userReducerInitialState
  } else if (type === USER_LOGGING_IN) {
    return {
      ...state,
      isAuthenticating: true
    }
  }
  return state
}

export const authSelector = state => state.user.userData

export const authenticatingSelector = state => state.user.isAuthenticating

export const userLoggedIn = (firstName = 'Test', lastName = 'McDuderson') => ({
  type: USER_LOGGED_IN,
  payload: {
    email: 'test@test.com',
    firstName,
    lastName
  }
})

export const userLoggedOut = () => ({
  type: USER_LOGGED_OUT
})

export const userLoggingIn = () => ({
  type: USER_LOGGING_IN
})

export const defaultConfig = {
  authSelector,
  authenticatingSelector,
  wrapperDisplayName: 'UserIsAuthenticated'
}

export class LoadingComponent extends Component {
  render() {
    return (
      <div>Loading!</div>
    )
  }
}

export function FailureComponent(props) {
  return (
    <div>No Access for user: {props.authData.email}</div>
  )
}

export class UnprotectedComponent extends Component {
  render() {
    return (
      <div />
    )
  }
}

export class UnprotectedParentComponent extends Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

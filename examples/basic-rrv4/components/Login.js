import 'url-search-params-polyfill'

import React, { Component, PropTypes } from 'react'
import { routerActions } from 'react-router-redux'
import { connect } from 'react-redux'

import { login } from '../actions/user'

function select(state, ownProps) {
  const isAuthenticated = state.user.name || false
  // https://github.com/mjrussell/redux-auth-wrapper/issues/127
  // https://github.com/ReactTraining/react-router/issues/4410
  const query = new URLSearchParams(ownProps.location.search)
  const redirect = query.get('redirect') || '/'
  return {
    isAuthenticated,
    redirect
  }
}

class LoginContainer extends Component {

  static propTypes = {
    login: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired
  };

  componentWillMount() {
    const { isAuthenticated, replace, redirect } = this.props
    if (isAuthenticated) {
      replace(redirect)
    }
  }

  componentWillReceiveProps(nextProps) {
    const { isAuthenticated, replace, redirect } = nextProps
    const { isAuthenticated: wasAuthenticated } = this.props

    if (!wasAuthenticated && isAuthenticated) {
      replace(redirect)
    }
  }

  onClick = (e) => {
    e.preventDefault()
    this.props.login({
      name: this.refs.name.value,
      isAdmin: this.refs.admin.checked
    })
  };

  render() {
    return (
      <div>
        <h2>Enter your name</h2>
        <input type="text" ref="name" />
        <br/>
        {'Admin?'}
        <input type="checkbox" ref="admin" />
        <br/>
        <button onClick={this.onClick}>Login</button>
      </div>
    )
  }

}

export default connect(select, { login, replace: routerActions.replace })(LoginContainer)

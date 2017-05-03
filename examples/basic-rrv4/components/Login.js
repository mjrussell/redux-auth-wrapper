import React, { Component, PropTypes } from 'react'
import { routerActions } from 'react-router-redux'
import { connect } from 'react-redux'
import { parse } from 'query-string'

import { login } from '../actions/user'

function select(state, ownProps) {
  const isAuthenticated = state.user.name || false
  const query = parse(ownProps.location.search)
  return {
    isAuthenticated,
    redirect: query.redirect || '/',
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

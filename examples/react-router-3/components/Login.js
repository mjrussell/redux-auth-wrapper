import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { login } from '../actions/user'

export class LoginContainer extends Component {

  static propTypes = {
    login: PropTypes.func.isRequired
  };

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
export default connect(null, { login })(LoginContainer)

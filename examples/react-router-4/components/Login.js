import React, { Component, PropTypes } from 'react'
// If you would use react latest version please see below:
// React.PropTypes has moved into a different package since React v15.5. Please use the prop-types library instead.
// import PropTypes from 'prop-types';
import { connect } from 'react-redux'
import styles from './App.css'
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
      <div className={styles.login}>
        <div><input className={styles.username} type="text" ref="name" placeholder="Enter your username" /></div>
        <label className={styles.checkbox}><input type="checkbox" ref="admin" />Are you an Administrator?</label>
        <div><button className={styles.button} onClick={this.onClick}>Login</button></div>
      </div>
    )
  }

}
export default connect(null, { login })(LoginContainer)

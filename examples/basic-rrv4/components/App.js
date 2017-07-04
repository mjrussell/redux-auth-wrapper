import React from 'react'
import { NavLink, withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { logout } from '../actions/user'
import { VisibleOnlyAdmin } from '../util/wrappers'

const OnlyAdminLink = VisibleOnlyAdmin(() => <NavLink to="/admin">{'Admin'}</NavLink>)

function App({ children, logout }) {
  return (
    <div>
      <header>
        Links:
        {' '}
        <NavLink to="/">Home</NavLink>
        {' '}
        <NavLink to="/foo">{'Foo (Login Required)'}</NavLink>
        {' '}
        <OnlyAdminLink />
        {' '}
        <NavLink to="/login">Login</NavLink>
        {' '}
        <button onClick={() => logout()}>Logout</button>
      </header>
      <div style={{ marginTop: '1.5em' }}>{children}</div>
    </div>
  )
}

export default withRouter(connect(false, { logout })(App))

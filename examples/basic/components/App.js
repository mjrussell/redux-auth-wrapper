import React from 'react'
import { Link } from 'react-router'
import { connect } from 'react-redux'
import { logout } from '../actions/user'
import { VisibleOnlyAdmin } from '../util/wrappers'

const OnlyAdminLink = VisibleOnlyAdmin(() => <Link to="/admin">{'Admin'}</Link>)

function App({ children, logout }) {
  return (
    <div>
      <header>
        Links:
        {' '}
        <Link to="/">Home</Link>
        {' '}
        <Link to="/foo">{'Foo (Login Required)'}</Link>
        {' '}
        <OnlyAdminLink />
        {' '}
        <Link to="/login">Login</Link>
        {' '}
        <button onClick={() => logout()}>Logout</button>
      </header>
      <div style={{ marginTop: '1.5em' }}>{children}</div>
    </div>
  )
}

export default connect(false, { logout })(App)

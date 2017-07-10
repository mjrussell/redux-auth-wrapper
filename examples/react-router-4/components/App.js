import React from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { logout } from '../actions/user'
import { userIsAuthenticatedRedir, userIsNotAuthenticatedRedir, userIsAdminRedir,
         userIsAuthenticated, userIsNotAuthenticated } from '../auth'

import AdminComponent from './Admin'
import FooComponent from './Foo'
import LoginComponent from './Login'
import Home from './Home'

// Need to apply the hocs here to avoid applying them inside the render method
const Login = userIsNotAuthenticatedRedir(LoginComponent)
const Foo = userIsAuthenticatedRedir(FooComponent)
const Admin = userIsAuthenticatedRedir(userIsAdminRedir(AdminComponent))

// Only show login when the user is not logged in and logout when logged in
// Could have also done this with a single wrapper and `FailureComponent`
const LoginLink = userIsNotAuthenticated(() => <Link to="/login">Login</Link>)
const LogoutLink = userIsAuthenticated(({ logout }) => <button onClick={() => logout()}>Logout</button>)

function App({ logout }) {
  return (
    <Router>
      <div>
        <header>
          Links:
          {' '}
          <Link to="/">Home</Link>
          {' '}
          <Link to="/foo">{'Foo (Login Required)'}</Link>
          {' '}
          <Link to="/admin">{'Admin'}</Link>
          {' '}
          <LoginLink />
          {' '}
          <LogoutLink logout={logout} />
        </header>
        <div style={{ marginTop: '1.5em' }}>
          <Route exact path="/" component={Home}/>
          <Route path="/login" component={Login}/>
          <Route path="/foo" component={Foo}/>
          <Route path="/admin" component={Admin}/>
        </div>
    </div>
    </Router>
  )
}

export default connect(false, { logout })(App)

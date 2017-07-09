import React from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { logout } from '../actions/user'
import { userIsAuthenticatedMap, userIsNotAuthenticated, userIsAdmin } from '../auth'

import AdminComponent from './Admin'
import FooComponent from './Foo'
import LoginComponent from './Login'
import Home from './Home'

// Need to apply the hocs here to avoid applying them inside the render method
const Login = userIsNotAuthenticated(LoginComponent)

const [
  Foo,
  Admin
] = userIsAuthenticatedMap([
  FooComponent,
  userIsAdmin(AdminComponent)
])

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
          <Link to="/login">Login</Link>
          {' '}
          <button onClick={() => logout()}>Logout</button>
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

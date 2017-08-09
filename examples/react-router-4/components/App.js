import React from 'react'
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom'
import { connect } from 'react-redux'
import styles from './App.css'
import { logout } from '../actions/user'
import { userIsAuthenticatedRedir, userIsNotAuthenticatedRedir, userIsAdminRedir,
         userIsAuthenticated, userIsNotAuthenticated } from '../auth'

import AdminComponent from './Admin'
import ProtectedComponent from './Protected'
import LoginComponent from './Login'
import Home from './Home'

const getUserName = user => {
  if (user.data) {
    return `Welcome ${user.data.name}`
  }
  return `Not logged in`
}

// Need to apply the hocs here to avoid applying them inside the render method
const Login = userIsNotAuthenticatedRedir(LoginComponent)
const Protected = userIsAuthenticatedRedir(ProtectedComponent)
const Admin = userIsAuthenticatedRedir(userIsAdminRedir(AdminComponent))

// Only show login when the user is not logged in and logout when logged in
// Could have also done this with a single wrapper and `FailureComponent`
const UserName = ({ user }) => (<div className={styles.username}>{getUserName(user)}</div>)
const LoginLink = userIsNotAuthenticated(() => <NavLink activeClassName={styles.active} to="/login">Login</NavLink>)
const LogoutLink = userIsAuthenticated(({ logout }) => <a href="#" onClick={() => logout()}>Logout</a>)

function App({ user, logout }) {
  return (
    <Router>
      <div className={styles.wrapper}>
        <nav className={styles.navigation}>
          <NavLink activeClassName={styles.active} exact to="/">Home</NavLink>
          <NavLink activeClassName={styles.active} exact to="/protected">Protected</NavLink>
          <NavLink activeClassName={styles.active} exact to="/admin">Admin</NavLink>
        </nav>
        <nav className={styles.authNavigation}>
          <LoginLink />
          <LogoutLink logout={logout} />
          <UserName user={user} />
        </nav>
        <div className={styles.content}>
          <Route exact path="/" component={Home}/>
          <Route path="/login" component={Login}/>
          <Route path="/protected" component={Protected}/>
          <Route path="/admin" component={Admin}/>
        </div>
    </div>
    </Router>
  )
}

const mapStateToProps = state => ({
  user: state.user
})

export default connect(mapStateToProps, { logout })(App)

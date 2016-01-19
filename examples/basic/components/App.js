import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { routeActions } from 'redux-simple-router';
import { logout } from '../actions/user';

function App({ push, children, logout }) {
  return (
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
      <div style={{marginTop: '1.5em'}}>{children}</div>
    </div>
  );
};

export default connect(false, { push: routeActions.push, logout })(App);

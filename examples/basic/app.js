import { createDevTools } from 'redux-devtools'
import LogMonitor from 'redux-devtools-log-monitor'
import DockMonitor from 'redux-devtools-dock-monitor'

import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import { Router, Route, IndexRoute, browserHistory } from 'react-router'
import { routerReducer, syncHistoryWithStore, routerMiddleware } from 'react-router-redux'

import * as reducers from './reducers'
import { App, Home, Foo, Admin, Login } from './components'
import { UserIsAuthenticated, UserIsAdmin } from './util/wrappers.js'

const baseHistory = browserHistory
const routingMiddleware = routerMiddleware(baseHistory)
const reducer = combineReducers(Object.assign({}, reducers, {
  routing: routerReducer
}))

const DevTools = createDevTools(
  <DockMonitor toggleVisibilityKey="ctrl-h"
               changePositionKey="ctrl-q">
    <LogMonitor theme="tomorrow" />
  </DockMonitor>
)

const enhancer = compose(
  // Middleware you want to use in development:
  applyMiddleware(routingMiddleware),
  DevTools.instrument()
)

// Note: passing enhancer as the last argument requires redux@>=3.1.0
const store = createStore(reducer, enhancer)
const history = syncHistoryWithStore(baseHistory, store)

ReactDOM.render(
  <Provider store={store}>
    <div>
      <Router history={history}>
        <Route path="/" component={App}>
          <IndexRoute component={Home}/>
          <Route path="login" component={Login}/>
          <Route path="foo" component={UserIsAuthenticated(Foo)}/>
          <Route path="admin" component={UserIsAuthenticated(UserIsAdmin(Admin))}/>
        </Route>
      </Router>
      <DevTools />
    </div>
  </Provider>,
  document.getElementById('mount')
)

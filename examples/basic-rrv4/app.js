import { createDevTools } from 'redux-devtools'
import LogMonitor from 'redux-devtools-log-monitor'
import DockMonitor from 'redux-devtools-dock-monitor'

import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import { Route, Switch } from 'react-router-dom'
import createHistory from 'history/createBrowserHistory'
import { ConnectedRouter, routerReducer, routerMiddleware } from 'react-router-redux'

import * as reducers from './reducers'
import { App, Home, Foo, Admin, Login } from './components'
import { UserIsAuthenticated, UserIsAdmin } from './util/wrappers.js'

const baseHistory = createHistory()
const routingMiddleware = routerMiddleware(baseHistory)
const reducer = combineReducers(Object.assign({}, reducers, {
  router: routerReducer
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

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={baseHistory}>
      <div>
        <App>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/login" component={Login}/>
            <Route path="/foo" component={UserIsAuthenticated(Foo)}/>
            <Route path="/admin" component={UserIsAuthenticated(UserIsAdmin(Admin))}/>
          </Switch>
        </App>
        <DevTools />
      </div>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('mount')
)

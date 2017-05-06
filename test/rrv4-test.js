/* eslint-env node, mocha, jasmine */
import React from 'react'
import createMemoryHistory from 'history/createMemoryHistory'
import { Router, Route, Switch } from 'react-router'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { mount } from 'enzyme'
import { parse } from 'query-string'
import { ConnectedRouter, routerReducer, routerMiddleware, replace } from 'react-router-redux'

import { userReducer } from './helpers'
import baseTests from './redirectBase-test'

import { connectedRouterRedirect, connectedReduxRedirect } from '../src/history4/redirect'
import locationHelperBuilder from '../src/history4/locationHelper'

const locationHelper = locationHelperBuilder({})

const setupReactRouter4Test = (testRoutes) => {
  const history = createMemoryHistory()
  const rootReducer = combineReducers({ user: userReducer })
  const store = createStore(rootReducer)

  const wrapper = mount(
    <Provider store={store}>
      <Router history={history} >
        <div id="testRoot">
          <Switch>
            {testRoutes.map((routeConfig, i) => <Route key={i} {...routeConfig} />)}
          </Switch>
        </div>
      </Router>
    </Provider>
  )

  const getLocation = () => history.location

  return {
    history,
    store,
    wrapper,
    getLocation
  }
}

const setupReactRouterReduxTest = (testRoutes) => {
  const history = createMemoryHistory()
  const middleware = routerMiddleware(history)
  const rootReducer = combineReducers({ user: userReducer, router: routerReducer })

  const store = createStore(
    rootReducer,
    applyMiddleware(middleware)
  )

  const wrapper = mount(
    <Provider store={store}>
      <ConnectedRouter history={history} >
        <div id="testRoot">
          <Switch>
            {testRoutes.map((routeConfig, i) => <Route key={i} {...routeConfig} />)}
          </Switch>
        </div>
      </ConnectedRouter>
    </Provider>
  )

  const getLocation = () => history.location

  return {
    history,
    store,
    wrapper,
    getLocation
  }
}

const getRouteParams = (ownProps) => ownProps.match.params
const getQueryParams = (location) => parse(location.search)

baseTests(setupReactRouter4Test, 'React Router V4', getRouteParams, getQueryParams,
          locationHelper.getRedirectQueryParam, connectedRouterRedirect)

baseTests(setupReactRouterReduxTest, 'React Router V4 with react-router-redux', getRouteParams, getQueryParams,
          locationHelper.getRedirectQueryParam, (config) => connectedReduxRedirect({ ...config, redirectAction: replace }))

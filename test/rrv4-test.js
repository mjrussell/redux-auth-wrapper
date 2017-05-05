/* eslint-env node, mocha, jasmine */
import React from 'react'
import createMemoryHistory from 'history/createMemoryHistory'
import { Router, Route, Switch } from 'react-router'
import { Provider } from 'react-redux'
import { createStore, combineReducers } from 'redux'
import { mount } from 'enzyme'
import { parse } from 'query-string'

import { userReducer } from './helpers'
import baseTests from './base-test'

import { connectedRouterRedirect } from '../src/history4/redirect'

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

const getRouteParams = (ownProps) => ownProps.match.params
const getQueryParams = (location) => parse(location.search)

baseTests(setupReactRouter4Test, 'React Router V4', getRouteParams, getQueryParams, connectedRouterRedirect)

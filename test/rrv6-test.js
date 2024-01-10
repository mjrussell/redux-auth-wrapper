/* eslint-env node, mocha, jasmine */
import React from 'react'
import { createMemoryHistory } from 'history'
import { Route, Routes, MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { mount } from 'enzyme'
import { parse } from 'query-string'
import { createReduxHistoryContext, replace } from 'redux-first-history'
import { HistoryRouter } from 'redux-first-history/rr6'

import { userReducer, history } from './helpers'
import baseTests from './redirectBase-test'

import { connectedRouterRedirect, connectedReduxRedirect } from '../src/history4/redirect'
import locationHelperBuilder from '../src/history4/locationHelper'

const locationHelper = locationHelperBuilder({
  locationSelector: () => history.location,
})

const setupReactRouter6Test = (testRoutes) => {
  // const history = createMemoryHistory()
  const rootReducer = combineReducers({ user: userReducer })
  const store = createStore(rootReducer)

  const App = () => {
    history.location = useLocation();
    history.push = useNavigate();
    
    return (
      <div id="testRoot">
        <Routes>
          {testRoutes.map((routeConfig, i) => <Route key={i} {...routeConfig} />)}
        </Routes>
      </div>
    );
  }

  const wrapper = mount(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
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
  const memoryHistory = createMemoryHistory()
  const { routerMiddleware, routerReducer } = createReduxHistoryContext({ 
    history: memoryHistory,
  });
  const rootReducer = combineReducers({ user: userReducer, routerReducer })
  const store = createStore(
    rootReducer,
    applyMiddleware(routerMiddleware)
  )

  const App = () => {
    history.location = useLocation();
    history.push = useNavigate();
    
    return (
      <div id="testRoot">
        <Routes>
          {testRoutes.map((routeConfig, i) => <Route key={i} {...routeConfig} />)}
        </Routes>
      </div>
    );
  }

  const wrapper = mount(
    <Provider store={store}>
      <HistoryRouter history={memoryHistory}>
        <App />
      </HistoryRouter>
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

const getRouteParams = (ownProps) => ownProps.params
const getQueryParams = (location) => parse(location.search)

baseTests(setupReactRouter6Test, 'React Router V6', getRouteParams, getQueryParams,
          locationHelper.getRedirectQueryParam, connectedRouterRedirect)

baseTests(setupReactRouterReduxTest, 'React Router V6 with redux-first-history', getRouteParams, getQueryParams,
          locationHelper.getRedirectQueryParam, (config) => connectedReduxRedirect({ ...config, redirectAction: replace }))

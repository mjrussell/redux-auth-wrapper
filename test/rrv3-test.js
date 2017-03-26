/* eslint-env node, mocha, jasmine */
import React from 'react'
import _ from 'lodash'
import createMemoryHistory from 'react-router/lib/createMemoryHistory'
import { routerMiddleware, syncHistoryWithStore, routerActions, routerReducer } from 'react-router-redux'
import { Router, Route } from 'react-router'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import sinon from 'sinon'
import { mount } from 'enzyme'

import { UserAuthWrapper } from '../src'

import { userLoggedOut, userLoggingIn, authSelector, userReducer, App, UnprotectedComponent, defaultConfig } from './helpers'
import baseTests from './base-test'

const setupReactRouter3Test = (routes) => {
  const history = createMemoryHistory()
  const rootReducer = combineReducers({ user: userReducer })
  const store = createStore(rootReducer)

  const wrapper = mount(
    <Provider store={store}>
      <Router history={history} >
        {routes}
      </Router>
    </Provider>
  )

  const getLocation = history.getCurrentLocation

  return {
    history,
    store,
    wrapper,
    getLocation
  }
}

const setupReactRouterReduxTest = (routes) => {
  const baseHistory = createMemoryHistory()
  const middleware = routerMiddleware(baseHistory)
  const rootReducer = combineReducers({ user: userReducer, routing: routerReducer })

  const store = createStore(
    rootReducer,
    applyMiddleware(middleware)
  )
  const history = syncHistoryWithStore(baseHistory, store)

  const wrapper = mount(
    <Provider store={store}>
      <Router history={history} >
        {routes}
      </Router>
    </Provider>
  )

  const getLocation = history.getCurrentLocation

  return {
    history,
    store,
    wrapper,
    getLocation
  }
}

baseTests(setupReactRouter3Test, 'React Router V3')

describe('UserAuthWrapper React Router V3 Additions', () => {

  it('provides an onEnter static function', () => {
    let store
    const connect = (fn) => (nextState, replaceState) => fn(store, nextState, replaceState)
    const authSelectorSpy = sinon.spy(authSelector)
    const authenticatingSelectorSpy = sinon.spy(state => state.user.isAuthenticating)
    const failureRedirectSpy = sinon.spy(() => '/login')

    const UserIsAuthenticatedOnEnter = UserAuthWrapper({
      authSelector: authSelectorSpy,
      authenticatingSelector: authenticatingSelectorSpy,
      failureRedirectPath: failureRedirectSpy
    })

    const routesOnEnter = (
      <Route path="/" component={App} >
        <Route path="login" component={UnprotectedComponent} />
        <Route path="onEnter" component={UnprotectedComponent} onEnter={connect(UserIsAuthenticatedOnEnter.onEnter)} />
      </Route>
    )

    const { history, store: createdStore, wrapper, getLocation } = setupReactRouter3Test(routesOnEnter)
    store = createdStore

    expect(getLocation().pathname).to.equal('/')
    expect(getLocation().search).to.equal('')

    // Supports isAuthenticating
    store.dispatch(userLoggingIn())
    history.push('/onEnter')
    const nextState = _.pick(wrapper.find(App).props(), [ 'location', 'params', 'routes' ])
    const storeState = store.getState()
    expect(authSelectorSpy.calledOnce).to.be.true
    // Passes store and nextState down to selectors and failureRedirectPath
    expect(authSelectorSpy.calledOnce).to.be.true
    expect(authSelectorSpy.firstCall.args).to.deep.equal([ storeState, nextState ])
    expect(authenticatingSelectorSpy.calledOnce).to.be.true
    expect(authenticatingSelectorSpy.firstCall.args).to.deep.equal([ storeState, nextState ])
    expect(getLocation().pathname).to.equal('/onEnter')

    // Redirects when not authorized
    store.dispatch(userLoggedOut())
    // Have to force re-check because wont recheck with store changes
    history.push('/')
    history.push('/onEnter')
    expect(authenticatingSelectorSpy.calledTwice).to.be.true
    expect(authSelectorSpy.calledTwice).to.be.true
    expect(failureRedirectSpy.calledOnce).to.be.true
    expect(failureRedirectSpy.firstCall.args[0].user).to.deep.equal(store.getState().user) // cant compare location because its changed
    expect(Object.keys(failureRedirectSpy.firstCall.args[1])).to.deep.equal([ 'routes', 'params', 'location' ]) // cant compare location because its changed
    expect(getLocation().pathname).to.equal('/login')
    expect(getLocation().search).to.equal('?redirect=%2FonEnter')
  })

  it('redirects with react router redux', () => {
    const auth = UserAuthWrapper({
      ...defaultConfig,
      redirectAction: routerActions.replace
    })
    const routes = (
      <Route path="/" component={App} >
        <Route path="login" component={UnprotectedComponent} />
        <Route path="auth" component={auth(UnprotectedComponent)} />
      </Route>
    )

    const { history, getLocation } = setupReactRouterReduxTest(routes)

    expect(getLocation().pathname).to.equal('/')
    expect(getLocation().search).to.equal('')
    history.push('/auth')
    expect(getLocation().pathname).to.equal('/login')
    expect(getLocation().search).to.equal('?redirect=%2Fauth')
  })
})

// TODO add redirectAction test

/* eslint-env node, mocha, jasmine */
import React, { Component, PropTypes } from 'react'
import _ from 'lodash'
import createMemoryHistory from 'react-router/lib/createMemoryHistory'
import { routerMiddleware, syncHistoryWithStore, routerActions, routerReducer } from 'react-router-redux'
import { Router, Route } from 'react-router'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import sinon from 'sinon'
import { mount } from 'enzyme'

import { userLoggedOut, userLoggedIn, userLoggingIn, authenticatedSelector, userReducer, UnprotectedComponent, UnprotectedParentComponent, defaultConfig } from './helpers'
import baseTests from './redirectBase-test'

import { connectedRouterRedirect, connectedReduxRedirect, createOnEnter } from '../src/history3/redirect'
import locationHelperBuilder from '../src/history3/locationHelper'

const locationHelper = locationHelperBuilder({})

class App extends Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return (
      <div id="testRoot">
        {this.props.children}
      </div>
    )
  }
}

const setupReactRouter3Test = (testRoutes) => {
  const history = createMemoryHistory()
  const rootReducer = combineReducers({ user: userReducer })
  const store = createStore(rootReducer)
  const routes = (
    <Route path="/" component={App}>
      {testRoutes.map((route, i) => <Route key={i} {...route} />)}
    </Route>
  )

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

const setupReactRouterReduxTest = (testRoutes) => {
  const baseHistory = createMemoryHistory()
  const middleware = routerMiddleware(baseHistory)
  const rootReducer = combineReducers({ user: userReducer, routing: routerReducer })
  const routes = (
    <Route path="/" component={App}>
      {testRoutes.map((route, i) => <Route key={i} {...route} />)}
    </Route>
  )

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

const getRouteParams = (ownProps) => ownProps.routeParams
const getQueryParams = (location) => location.query

baseTests(setupReactRouter3Test, 'React Router V3', getRouteParams, getQueryParams,
          locationHelper.getRedirectQueryParam, connectedRouterRedirect)

baseTests(setupReactRouterReduxTest, 'React Router V3 with react-router-redux', getRouteParams, getQueryParams,
          locationHelper.getRedirectQueryParam, (config) => connectedReduxRedirect({ ...config, redirectAction: routerActions.replace }))

describe('React Router V3 onEnter', () => {
  it('provides an onEnter static function', () => {
    let store
    const connect = (fn) => (nextState, replaceState) => fn(store, nextState, replaceState)
    const authenticatedSelectorSpy = sinon.spy(authenticatedSelector)
    const failureRedirectSpy = sinon.spy(() => '/login')

    const onEnter = createOnEnter({
      redirectPath: failureRedirectSpy,
      authenticatedSelector: authenticatedSelectorSpy
    })

    const routesOnEnter = [
      { path: 'login', component: UnprotectedComponent },
      { path: 'onEnter', component: UnprotectedComponent, onEnter: connect(onEnter) }
    ]

    const { history, store: createdStore, getLocation } = setupReactRouter3Test(routesOnEnter)
    store = createdStore

    expect(getLocation().pathname).to.equal('/')
    expect(getLocation().search).to.equal('')

    // Redirects when not authorized
    store.dispatch(userLoggedOut())
    // Have to force re-check because wont recheck with store changes
    history.push('/')
    history.push('/onEnter')
    expect(authenticatedSelectorSpy.calledOnce).to.be.true
    expect(failureRedirectSpy.calledOnce).to.be.true
    expect(failureRedirectSpy.firstCall.args[0].user).to.deep.equal(store.getState().user) // cant compare location because its changed
    expect(Object.keys(failureRedirectSpy.firstCall.args[1])).to.deep.equal([ 'routes', 'params', 'location' ]) // cant compare location because its changed
    expect(getLocation().pathname).to.equal('/login')
    expect(getLocation().search).to.equal('?redirect=%2FonEnter')
  })

  it('supports isAuthenticating', () => {
    let store
    const connect = (fn) => (nextState, replaceState) => fn(store, nextState, replaceState)
    const authenticatedSelectorSpy = sinon.spy(authenticatedSelector)
    const authenticatingSelectorSpy = sinon.spy(state => state.user.isAuthenticating)
    const failureRedirectSpy = sinon.spy(() => '/login')

    const onEnter = createOnEnter({
      redirectPath: failureRedirectSpy,
      authenticatedSelector: authenticatedSelectorSpy,
      authenticatingSelector: authenticatingSelectorSpy
    })

    const routesOnEnter = [
      { path: 'login', component: UnprotectedComponent },
      { path: 'onEnter', component: UnprotectedComponent, onEnter: connect(onEnter) }
    ]

    const { history, store: createdStore, wrapper, getLocation } = setupReactRouter3Test(routesOnEnter)
    store = createdStore

    expect(getLocation().pathname).to.equal('/')
    expect(getLocation().search).to.equal('')

    // Supports isAuthenticating
    store.dispatch(userLoggingIn())
    history.push('/onEnter')
    const nextState = _.pick(wrapper.find(App).props(), [ 'location', 'params', 'routes' ])
    const storeState = store.getState()
    expect(authenticatedSelectorSpy.calledOnce).to.be.true
    // Passes store and nextState down to selectors and redirectPath
    expect(authenticatedSelectorSpy.calledOnce).to.be.true
    expect(authenticatedSelectorSpy.firstCall.args).to.deep.equal([ storeState, nextState ])
    expect(authenticatingSelectorSpy.calledOnce).to.be.true
    expect(authenticatingSelectorSpy.firstCall.args).to.deep.equal([ storeState, nextState ])
    expect(getLocation().pathname).to.equal('/onEnter')

    // Redirects when not authorized
    store.dispatch(userLoggedOut())
    // Have to force re-check because wont recheck with store changes
    history.push('/')
    history.push('/onEnter')
    expect(authenticatingSelectorSpy.calledTwice).to.be.true
    expect(authenticatedSelectorSpy.calledTwice).to.be.true
    expect(failureRedirectSpy.calledOnce).to.be.true
    expect(failureRedirectSpy.firstCall.args[0].user).to.deep.equal(store.getState().user) // cant compare location because its changed
    expect(Object.keys(failureRedirectSpy.firstCall.args[1])).to.deep.equal([ 'routes', 'params', 'location' ]) // cant compare location because its changed
    expect(getLocation().pathname).to.equal('/login')
    expect(getLocation().search).to.equal('?redirect=%2FonEnter')
  })

  it('optionally prevents redirection from a function result', () => {
    let store
    const connect = (fn) => (nextState, replaceState) => fn(store, nextState, replaceState)

    const onEnter = createOnEnter({
      ...defaultConfig,
      authenticatedSelector: () => false,
      allowRedirectBack: ({ location }, redirectPath) => location.pathname === '/auth' && redirectPath === '/login'
    })

    const routesOnEnter = [
      { path: '/login', component: UnprotectedComponent },
      { path: '/auth', component: UnprotectedComponent, onEnter: connect(onEnter) },
      { path: '/authNoRedir', component: UnprotectedComponent, onEnter: connect(onEnter) }
    ]

    const { history, store: createdStore, getLocation } = setupReactRouter3Test(routesOnEnter)
    store = createdStore

    store.dispatch(userLoggedIn())

    history.push('/auth')
    expect(getLocation().pathname).to.equal('/login')
    expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })

    history.push('/authNoRedir')
    expect(getLocation().pathname).to.equal('/login')
    expect(getQueryParams(getLocation())).to.deep.equal({})
  })

  it('can pass a selector for redirectPath', () => {
    let store
    const connect = (fn) => (nextState, replaceState) => fn(store, nextState, replaceState)

    const onEnter = createOnEnter({
      ...defaultConfig,
      redirectPath: (state, routerNextState) => {
        if (!authenticatedSelector(state) && routerNextState.params.id === '1') {
          return '/login/1'
        } else {
          return '/login/0'
        }
      }
    })
    const routesOnEnter = [
      { path: '/login/:id', component: UnprotectedComponent },
      { path: '/auth/:id', component: UnprotectedComponent, onEnter: connect(onEnter) }
    ]

    const { history, store: createdStore, getLocation } = setupReactRouter3Test(routesOnEnter)
    store = createdStore

    expect(getLocation().pathname).to.equal('/')
    expect(getQueryParams(getLocation())).to.be.empty

    history.push('/auth/1')
    expect(getLocation().pathname).to.equal('/login/1')
    expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth/1' })

    history.push('/auth/2')
    expect(getLocation().pathname).to.equal('/login/0')
    expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth/2' })
  })

  it('Throws invariant when redirectpath is not a function or string', () => {
    expect(() => createOnEnter({ ...defaultConfig, redirectPath: true })).to.throw(/redirectPath must be either a string or a function/)
    expect(() => createOnEnter({ ...defaultConfig, redirectPath: 1 })).to.throw(/redirectPath must be either a string or a function/)
    expect(() => createOnEnter({ ...defaultConfig, redirectPath: [] })).to.throw(/redirectPath must be either a string or a function/)
    expect(() => createOnEnter({ ...defaultConfig, redirectPath: {} })).to.throw(/redirectPath must be either a string or a function/)
  })

  it('Throws invariant when allowRedirectBack is not a function or boolean', () => {
    expect(() => createOnEnter({ ...defaultConfig, allowRedirectBack: 'login' })).to.throw(/allowRedirectBack must be either a boolean or a function/)
    expect(() => createOnEnter({ ...defaultConfig, allowRedirectBack: 1 })).to.throw(/allowRedirectBack must be either a boolean or a function/)
    expect(() => createOnEnter({ ...defaultConfig, allowRedirectBack: [] })).to.throw(/allowRedirectBack must be either a boolean or a function/)
    expect(() => createOnEnter({ ...defaultConfig, allowRedirectBack: {} })).to.throw(/allowRedirectBack must be either a boolean or a function/)
  })
})

describe('wrapper React Router V3 Additions', () => {

  it('supports nested routes', () => {
    const auth = connectedRouterRedirect(defaultConfig)

    const routes = [
      { path: 'login', component: UnprotectedComponent },
      { path: 'parent', component: auth(UnprotectedParentComponent), childRoutes: [
          { path: 'child', component: auth(UnprotectedComponent) }
      ] }
    ]

    const { history, store, getLocation } = setupReactRouter3Test(routes)

    history.push('/parent/child')
    expect(getLocation().pathname).to.equal('/login')
    expect(getLocation().search).to.equal('?redirect=%2Fparent%2Fchild')

    store.dispatch(userLoggedIn())

    history.push('/parent/child')
    expect(getLocation().pathname).to.equal('/parent/child')
    expect(getLocation().query).to.be.empty

    store.dispatch(userLoggedOut())
    expect(getLocation().pathname).to.equal('/login')
    expect(getLocation().search).to.equal('?redirect=%2Fparent%2Fchild')
  })
})

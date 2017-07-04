/* eslint-env node, mocha, jasmine */
import React, { Component } from 'react'
import _ from 'lodash'
import { createStore, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import { userLoggedOut, userLoggedIn, userLoggingIn, authenticatedSelector, authenticatingSelector, userReducer,
         UnprotectedComponent, FailureComponent, AuthenticatingComponent, userDataSelector } from './helpers'

import authWrapper from '../src/authWrapper'
import connectedAuthWrapper from '../src/connectedAuthWrapper'

const defaultConfig = {
  authenticatedSelector
}

describe('connectedAuthWrapper', () => {
  it('renders the wrapped component on success and hides on failure', () => {
    const auth = connectedAuthWrapper(defaultConfig)

    const rootReducer = combineReducers({ user: userReducer })
    const store = createStore(rootReducer)

    const AuthedComponent = auth(UnprotectedComponent)

    const wrapper = mount(
      <Provider store={store}>
        <AuthedComponent />
      </Provider>
    )

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)
    expect(wrapper.find(AuthedComponent).html()).to.be.null

    store.dispatch(userLoggedIn())

    expect(wrapper.find(UnprotectedComponent).length).to.equal(1)
  })

  it('defaults to rendering nothing while authenticating', () => {
    const auth = connectedAuthWrapper({
      ...defaultConfig,
      authenticatingSelector
    })

    const rootReducer = combineReducers({ user: userReducer })
    const store = createStore(rootReducer)

    const AuthedComponent = auth(UnprotectedComponent)

    const wrapper = mount(
      <Provider store={store}>
        <AuthedComponent />
      </Provider>
    )

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)
    expect(wrapper.find(AuthedComponent).html()).to.be.null

    store.dispatch(userLoggingIn())

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)
    expect(wrapper.find(AuthedComponent).html()).to.be.null

    store.dispatch(userLoggedIn())

    expect(wrapper.find(UnprotectedComponent).length).to.equal(1)
  })

  it('renders the specified component on failure', () => {
    const auth = connectedAuthWrapper({
      ...defaultConfig,
      FailureComponent
    })

    const rootReducer = combineReducers({ user: userReducer })
    const store = createStore(rootReducer)

    const AuthedComponent = auth(UnprotectedComponent)

    const wrapper = mount(
      <Provider store={store}>
        <AuthedComponent />
      </Provider>
    )

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)
    expect(wrapper.find(FailureComponent).length).to.equal(1)

    store.dispatch(userLoggedIn())
    expect(wrapper.find(UnprotectedComponent).length).to.equal(1)

    store.dispatch(userLoggedOut())

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)
    expect(wrapper.find(FailureComponent).length).to.equal(1)
  })

  it('supports a custom authenticated function', () => {
    const auth = connectedAuthWrapper({
      ...defaultConfig,
      authenticatedSelector: state => userDataSelector(state).firstName === 'Matt'
    })

    const rootReducer = combineReducers({ user: userReducer })
    const store = createStore(rootReducer)

    const AuthedComponent = auth(UnprotectedComponent)

    const wrapper = mount(
      <Provider store={store}>
        <AuthedComponent extraProp="test" />
      </Provider>
    )

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)

    store.dispatch(userLoggedIn())

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)

    store.dispatch(userLoggedOut())

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)

    store.dispatch(userLoggedIn('Matt'))

    expect(wrapper.find(UnprotectedComponent).length).to.equal(1)
  })

  it('Allows for custom wrapper display name', () => {
    const auth = connectedAuthWrapper({
      ...defaultConfig,
      wrapperDisplayName: 'Better Name'
    })

    const rootReducer = combineReducers({ user: userReducer })
    const store = createStore(rootReducer)

    const AuthedComponent = auth(UnprotectedComponent)

    const wrapper = mount(
      <Provider store={store}>
        <AuthedComponent />
      </Provider>
    )

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)
    expect(wrapper.find(AuthedComponent).html()).to.be.null

    store.dispatch(userLoggedIn())

    expect(wrapper.find(UnprotectedComponent).length).to.equal(1)
    expect(wrapper.find(AuthedComponent).node.renderedElement.type.displayName).to.equal('Better Name(UnprotectedComponent)')
  })

  it('Display name works for name-less components', () => {
    const auth = connectedAuthWrapper(defaultConfig)

    const rootReducer = combineReducers({ user: userReducer })
    const store = createStore(rootReducer)

    const AuthedComponent = auth(() => null)

    const wrapper = mount(
      <Provider store={store}>
        <AuthedComponent />
      </Provider>
    )

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)
    expect(wrapper.find(AuthedComponent).html()).to.be.null

    store.dispatch(userLoggedIn())

    expect(wrapper.find(AuthedComponent).node.renderedElement.type.displayName).to.equal('AuthWrapper(Component)')
  })

  it('passes through props to components', () => {
    const auth = connectedAuthWrapper({
      ...defaultConfig,
      authenticatingSelector,
      AuthenticatingComponent,
      FailureComponent
    })

    const rootReducer = combineReducers({ user: userReducer })
    const store = createStore(rootReducer)

    const AuthedComponent = auth(UnprotectedComponent)

    const wrapper = mount(
      <Provider store={store}>
        <AuthedComponent testProp="test" />
      </Provider>
    )

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)
    expect(_.omit(wrapper.find(FailureComponent).props(), [ 'dispatch' ])).to.deep.equal({
      isAuthenticated: false, isAuthenticating: false, testProp: 'test'
    })

    store.dispatch(userLoggingIn())

    expect(wrapper.find(UnprotectedComponent).length).to.equal(0)
    expect(_.omit(wrapper.find(AuthenticatingComponent).props(), [ 'dispatch' ])).to.deep.equal({
      isAuthenticated: false, isAuthenticating: true, testProp: 'test'
    })

    store.dispatch(userLoggedIn())

    expect(wrapper.find(UnprotectedComponent).length).to.equal(1)
    expect(_.omit(wrapper.find(UnprotectedComponent).props(), [ 'dispatch' ])).to.deep.equal({
      isAuthenticated: true, isAuthenticating: false, testProp: 'test'
    })
  })

  it('hoists statics to the wrapper', () => {
    const auth = authWrapper(defaultConfig)

    class WithStatic extends Component {
      static staticProp = true;

      render() {
        return <div/>
      }
    }

    WithStatic.staticFun = () => 'auth'

    const authed = auth(WithStatic)
    expect(authed.staticProp).to.equal(true)
    expect(authed.staticFun).to.be.a('function')
    expect(authed.staticFun()).to.equal('auth')
  })
})

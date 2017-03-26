/* eslint-env node, mocha, jasmine */
import React, { Component } from 'react'
import { Route } from 'react-router'
import { Provider } from 'react-redux'
import { createStore, combineReducers } from 'redux'
import { mount } from 'enzyme'
import sinon from 'sinon'
import _ from 'lodash'

import { UserAuthWrapper } from '../src'

import { userLoggedIn, userLoggedOut, userLoggingIn, authSelector, userReducer, defaultConfig, App,
         UnprotectedComponent, UnprotectedParentComponent, PropParentComponent, LoadingComponent, FailureComponent } from './helpers'

export default (setupTest, versionName) => {

  describe(`UserAuthWrapper ${versionName} Base`, () => {

    it('redirects unauthenticated', () => {
      const auth = UserAuthWrapper(defaultConfig)
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getLocation().search).to.equal('')
      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fauth')
    })

    it('does not redirect if authenticating', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        authenticatingSelector: () => true,
        LoadingComponent: LoadingComponent
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getLocation().search).to.equal('')
      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')
      expect(getLocation().search).to.equal('')
    })

    it('by default ignores authenticating', () => {
      const auth = UserAuthWrapper({ authSelector })

      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getLocation().search).to.equal('')
      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fauth')
    })

    it('renders the specified component when authenticating', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        authenticatingSelector: () => true,
        LoadingComponent: LoadingComponent
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { wrapper, history } = setupTest(routes)

      history.push('/auth')

      const comp = wrapper.find(LoadingComponent)
      // Props from React-Router
      expect(comp.props().location.pathname).to.equal('/auth')
    })

    it('renders nothing while authenticating and no LoadingComponent set', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        authenticatingSelector: () => true
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { wrapper, history } = setupTest(routes)

      history.push('/auth')

      const comp = wrapper.find(App)
      // There is a child here. It is connect but it should render no html
      expect(comp.childAt(0).html()).to.be.null
    })

    it('renders the failure component when prop is set', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        predicate: () => false,
        FailureComponent
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, store, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')

      const comp = wrapper.find(FailureComponent).last()
      expect(comp.props().authData.email).to.equal('test@test.com')
    })

    it('preserves query params on redirect', () => {
      const auth = UserAuthWrapper(defaultConfig)
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getLocation().search).to.equal('')
      history.push('/auth?test=foo')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fauth%3Ftest%3Dfoo')
    })

    it('allows authenticated users', () => {
      const auth = UserAuthWrapper(defaultConfig)
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { store, history, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')
    })

    it('redirects on no longer authorized', () => {
      const auth = UserAuthWrapper(defaultConfig)
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { store, history, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')

      store.dispatch(userLoggedOut())
      expect(getLocation().pathname).to.equal('/login')
    })

    it('doesn\'t redirects on no longer authorized if FailureComponent is set', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        predicate: () => false,
        FailureComponent
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, store, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')

      store.dispatch(userLoggedOut())
      expect(getLocation().pathname).to.equal('/auth')
    })

    it('redirects if no longer authenticating', () => {
      const auth = UserAuthWrapper(defaultConfig)
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { store, history, getLocation } = setupTest(routes)

      store.dispatch(userLoggingIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')

      store.dispatch(userLoggedOut())
      expect(getLocation().pathname).to.equal('/login')
    })

    it('allows predicate authorization', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        predicate: user => user.firstName === 'Test'
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { store, history, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn('NotTest'))

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fauth')

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')
      expect(getLocation().search).to.equal('')
    })

    it('optionally prevents redirection', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        predicate: () => false,
        allowRedirectBack: false
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, store, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('')
    })

    it('optionally prevents redirection from a function result', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        predicate: () => false,
        allowRedirectBack: (location, redirectPath) => location.pathname === '/auth' && redirectPath === '/login'
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
          <Route path="authNoRedir" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, store, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fauth')

      history.push('/authNoRedir')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('')
    })

    it('can be nested', () => {
      const firstNameAuth = UserAuthWrapper({
        ...defaultConfig,
        predicate: user => user.firstName === 'Test'
      })

      const lastNameAuth = UserAuthWrapper({
        ...defaultConfig,
        predicate: user => user.lastName === 'McDuderson'
      })

      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={firstNameAuth(lastNameAuth((UnprotectedComponent)))} />
        </Route>
      )

      const { history, store, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn('NotTest'))

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fauth')

      store.dispatch(userLoggedIn('Test', 'NotMcDuderson'))

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fauth')

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')
      expect(getLocation().search).to.equal('')
    })

    it('supports nested routes', () => {
      const auth = UserAuthWrapper(defaultConfig)

      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="parent" component={auth(UnprotectedParentComponent)}>
            <Route path="child" component={auth(UnprotectedComponent)} />
          </Route>
        </Route>
      )

      const { history, store, getLocation } = setupTest(routes)

      history.push('/parent/child')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fparent%2Fchild')

      store.dispatch(userLoggedIn())

      history.push('/parent/child')
      expect(getLocation().pathname).to.equal('/parent/child')
      expect(getLocation().search).to.equal('')

      store.dispatch(userLoggedOut())
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fparent%2Fchild')
    })

    it('passes props to authed components', () => {
      const auth = UserAuthWrapper(defaultConfig)
      const Child = auth(UnprotectedComponent)

      class PropParentComponent extends Component {

        render() {
          // Need to pass down at least location from router, but can just pass it all down
          return <Child testProp {...this.props} />
        }
      }

      const routes = (
        <Route path="/" component={App} >
          <Route path="prop" component={PropParentComponent} />
        </Route>
      )
      const { history, store, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/prop')

      const comp = wrapper.find(UnprotectedComponent)
      // Props from React-Router
      expect(comp.props().location.pathname).to.equal('/prop')
      // Props from auth selector
      expect(comp.props().authData).to.deep.equal({
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'McDuderson'
      })
      // Props from parent
      expect(comp.props().testProp).to.equal(true)
      // No extra wrapper props
      // TODO mjrussell make this more general, or need to pass in expected rotuer props
      expect(Object.keys(wrapper.find(UnprotectedComponent).props()).sort()).to.deep.equal([
        'authData', 'children', 'location', 'params', 'route', 'routeParams', 'router', 'routes', 'testProp'
      ])
    })

    it('hoists statics to the wrapper', () => {
      const auth = UserAuthWrapper(defaultConfig)

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

    it('it doesn\'t provide an onEnter static function if FailureComponent prop is set', () => {
      const auth = UserAuthWrapper({
        authSelector: () => false,
        FailureComponent: null
      })

      expect(auth.onEnter).to.not.exist
    })

    it('passes ownProps for auth selector', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        authSelector: (state, ownProps) => ({
          ...authSelector(state),
          // TODO mjrussell make generic
          ...ownProps.routeParams // from React-Router
        }),
        predicate: user => user.firstName === 'Test' && user.id === '1'
      })

      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth/:id" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, store, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getLocation().search).to.equal('')

      store.dispatch(userLoggedIn())

      history.push('/auth/1')
      expect(getLocation().pathname).to.equal('/auth/1')
      expect(getLocation().search).to.equal('')

      history.push('/auth/2')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fauth%2F2')
    })

    it('can override query param name', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        redirectQueryParamName: 'customRedirect'
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getLocation().search).to.equal('')

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?customRedirect=%2Fauth')
    })

    it('can pass a selector for failureRedirectPath', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        failureRedirectPath: (state, ownProps) => {
          if (authSelector(state) === undefined && ownProps.routeParams.id === '1') {
            return '/login/1'
          } else {
            return '/login/0'
          }
        }
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="login/:id" component={UnprotectedComponent} />
          <Route path="auth/:id" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getLocation().search).to.equal('')

      history.push('/auth/1')
      expect(getLocation().pathname).to.equal('/login/1')
      expect(getLocation().search).to.equal('?redirect=%2Fauth%2F1')

      history.push('/auth/2')
      expect(getLocation().pathname).to.equal('/login/0')
      expect(getLocation().search).to.equal('?redirect=%2Fauth%2F2')
    })

    it('only redirects once when props change but authentication is constant', () => {

      const redirectAction = sinon.stub().returns({ type: 'NO_REDIRECT' })

      const auth = UserAuthWrapper({
        ...defaultConfig,
        redirectAction,
        predicate: () => false
      })

      const Component = auth(UnprotectedComponent)

      // No routing middleware to handle redirects
      const rootReducer = combineReducers({ user: userReducer })
      const store = createStore(rootReducer)
      mount(
        <Provider store={store}>
          <Component location={{ pathname: '/', query: {}, search: '' }}/>
        </Provider>
      )

      expect(redirectAction.calledOnce).to.equal(true)

      store.dispatch(userLoggedIn())
      expect(redirectAction.calledOnce).to.equal(true)
    })

    it('uses propMapper to prevent passing down props', () => {
      const auth = UserAuthWrapper({
        ...defaultConfig,
        propMapper: () => ({})
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={UnprotectedComponent} />
          <Route path="auth" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { store, history, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')

      const comp = wrapper.find(UnprotectedComponent)
      // Props from React-Router
      expect(comp.props()).to.deep.equal({})
    })

    it('redirection preserves query params', () => {
      const auth = UserAuthWrapper(defaultConfig)
      const login = UserAuthWrapper({
        ...defaultConfig,
        predicate: _.isEmpty,
        failureRedirectPath: (state, ownProps) => ownProps.location.query.redirect || '/',
        allowRedirectBack: false
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={login(UnprotectedComponent)} />
          <Route path="protected" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, store, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getLocation().search).to.equal('')

      history.push('/protected?param=foo')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fprotected%3Fparam%3Dfoo')
      expect(getLocation().query).to.deep.equal({ redirect: '/protected?param=foo' })

      store.dispatch(userLoggedIn())
      expect(getLocation().pathname).to.equal('/protected')
      expect(getLocation().search).to.equal('?param=foo')
      expect(getLocation().query).to.deep.equal({ param: 'foo' })
    })

    it('redirection preserves hash fragment', () => {
      const auth = UserAuthWrapper(defaultConfig)
      const login = UserAuthWrapper({
        ...defaultConfig,
        predicate: _.isEmpty,
        failureRedirectPath: (state, ownProps) => ownProps.location.query.redirect || '/',
        allowRedirectBack: false
      })
      const routes = (
        <Route path="/" component={App} >
          <Route path="login" component={login(UnprotectedComponent)} />
          <Route path="protected" component={auth(UnprotectedComponent)} />
        </Route>
      )

      const { history, store, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getLocation().search).to.equal('')

      history.push('/protected#foo')
      expect(getLocation().pathname).to.equal('/login')
      expect(getLocation().search).to.equal('?redirect=%2Fprotected%23foo')
      expect(getLocation().query).to.deep.equal({ redirect: '/protected#foo' })

      store.dispatch(userLoggedIn())
      expect(getLocation().pathname).to.equal('/protected')
      expect(getLocation().hash).to.equal('#foo')
      expect(getLocation().search).to.equal('')
      expect(getLocation().query).to.deep.equal({ })
    })
  })
}

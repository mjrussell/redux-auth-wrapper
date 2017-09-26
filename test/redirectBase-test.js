/* eslint-env node, mocha, jasmine */
import React, { Component } from 'react'
import sinon from 'sinon'
import _ from 'lodash'

import Redirect from '../src/redirect'
import { userLoggedIn, userLoggedOut, userLoggingIn, userDataSelector, authenticatedSelector, defaultConfig,
         UnprotectedComponent, AuthenticatingComponent, FailureComponent } from './helpers'

export default (setupTest, versionName, getRouteParams, getQueryParams, getRedirectQueryParam, authWrapper) => {

  describe(`wrapper ${versionName} Base`, () => {

    it('redirects unauthenticated', () => {
      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty
      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })
    })

    it('does not redirect if authenticating', () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatingSelector: () => true,
        AuthenticatingComponent: AuthenticatingComponent
      })
      const routes = [
        { path: 'auth', component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty
      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')
      expect(getQueryParams(getLocation())).to.be.empty
    })

    it('by default ignores authenticating', () => {
      const auth = authWrapper({ authenticatedSelector, redirectPath: '/login' })

      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty
      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })
    })

    it('renders the specified component when authenticating', () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatingSelector: () => true,
        AuthenticatingComponent: AuthenticatingComponent
      })
      const routes = [
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { wrapper, history } = setupTest(routes)

      history.push('/auth')

      const comp = wrapper.find(AuthenticatingComponent)
      // Props from React-Router
      expect(comp.props().location.pathname).to.equal('/auth')
    })

    it('renders nothing while authenticating and no AuthenticatingComponent set', () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatingSelector: () => true
      })
      const routes = [
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { wrapper, history } = setupTest(routes)

      history.push('/auth')

      const comp = wrapper.find('#testRoot')
      // There is a child here. It is connect but it should render no html
      expect(comp.childAt(0).html()).to.be.null
    })

    it('renders the failure component when prop is set', () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: () => false,
        FailureComponent
      })
      const routes = [
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { history, store, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')

      const comp = wrapper.find(FailureComponent).last()
      expect(comp.props().isAuthenticated).to.be.false
    })

    it('preserves query params on redirect', () => {
      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty
      history.push('/auth?test=foo')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth?test=foo' })
    })

    it('allows authenticated users', () => {
      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { store, history, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')
    })

    it('redirects on no longer authorized', () => {
      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { store, history, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')

      store.dispatch(userLoggedOut())
      expect(getLocation().pathname).to.equal('/login')
    })

    it('redirects if no longer authenticating', () => {
      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { store, history, getLocation } = setupTest(routes)

      store.dispatch(userLoggingIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')

      store.dispatch(userLoggedOut())
      expect(getLocation().pathname).to.equal('/login')
    })

    it('optionally prevents redirection', () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: () => false,
        allowRedirectBack: false
      })
      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { history, store, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({})
    })

    it('optionally prevents redirection from a function result', () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: () => false,
        allowRedirectBack: ({ location }, redirectPath) => location.pathname === '/auth' && redirectPath === '/login'
      })
      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: auth(UnprotectedComponent) },
        { path: '/authNoRedir', component: auth(UnprotectedComponent) }
      ]

      const { history, store, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })

      history.push('/authNoRedir')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({})
    })

    it('can be nested', () => {
      const firstNameAuth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: (state) => userDataSelector(state).firstName === 'Test'
      })

      const lastNameAuth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: (state) => userDataSelector(state).lastName === 'McDuderson'
      })

      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: firstNameAuth(lastNameAuth(UnprotectedComponent)) }
      ]

      const { history, store, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn('NotTest'))

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })

      store.dispatch(userLoggedIn('Test', 'NotMcDuderson'))

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })

      store.dispatch(userLoggedIn())

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/auth')
      expect(getQueryParams(getLocation())).to.be.empty
    })

    it('passes props to authed components', () => {
      const auth = authWrapper(defaultConfig)
      const Child = auth(UnprotectedComponent)

      class PropParentComponent extends Component {

        render() {
          // Need to pass down at least location from router, but can just pass it all down
          return <Child testProp {...this.props} />
        }
      }

      const routes = [
        { path: '/prop', component: PropParentComponent }
      ]
      const { history, store, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/prop')

      const comp = wrapper.find(UnprotectedComponent)
      // Props from React-Router
      expect(comp.props().location.pathname).to.equal('/prop')
      // Props from parent
      expect(comp.props().testProp).to.equal(true)
      // No extra wrapper props
      expect(Object.keys(_.omit(wrapper.find(UnprotectedComponent).props(), [
        'children', 'location', 'params', 'route', 'routeParams', 'router', 'routes', 'history', 'match', 'staticContext', 'dispatch'
      ])).sort()).to.deep.equal([
        'isAuthenticated', 'isAuthenticating', 'redirectPath', 'testProp'
      ])
    })

    it('passes ownProps for authenticated selector', () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: (state, ownProps) => {
          const user = userDataSelector(state)
          const params = getRouteParams(ownProps) // from React-Router
          return user.firstName === 'Test' && params.id === '1'
        }
      })

      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth/:id', component: auth(UnprotectedComponent) }
      ]

      const { history, store, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty

      store.dispatch(userLoggedIn())

      history.push('/auth/1')
      expect(getLocation().pathname).to.equal('/auth/1')
      expect(getQueryParams(getLocation())).to.be.empty

      history.push('/auth/2')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth/2' })
    })

    it('can override query param name', () => {
      const auth = authWrapper({
        ...defaultConfig,
        redirectQueryParamName: 'customRedirect'
      })
      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty

      history.push('/auth')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ customRedirect: '/auth' })
    })

    it('can pass a selector for redirectPath', () => {
      const auth = authWrapper({
        ...defaultConfig,
        redirectPath: (state, ownProps) => {
          if (!authenticatedSelector(state) && getRouteParams(ownProps).id === '1') {
            return '/login/1'
          } else {
            return '/login/0'
          }
        }
      })
      const routes = [
        { path: '/login/:id', component: UnprotectedComponent },
        { path: '/auth/:id', component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty

      history.push('/auth/1')
      expect(getLocation().pathname).to.equal('/login/1')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth/1' })

      history.push('/auth/2')
      expect(getLocation().pathname).to.equal('/login/0')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth/2' })
    })

    it('only redirects once when props change but authentication is constant', () => {

      const redirect = sinon.stub().returns({ type: 'NO_REDIRECT' })

      const auth = authWrapper({
        ...defaultConfig,
        FailureComponent: (props) => <Redirect {...props} redirect={redirect} />,
        authenticatedSelector: () => false
      })

      const routes = [
        { path: '/login', component: UnprotectedComponent },
        { path: '/auth', component: auth(UnprotectedComponent) }
      ]

      const { history, store } = setupTest(routes)

      history.push('/auth')
      expect(redirect.calledOnce).to.equal(true)

      store.dispatch(userLoggedIn())
      expect(redirect.calledOnce).to.equal(true)
    })

    it('redirection preserves query params', () => {
      const auth = authWrapper(defaultConfig)
      const login = authWrapper({
        ...defaultConfig,
        authenticatedSelector: state => !authenticatedSelector(state),
        redirectPath: (state, ownProps) => getRedirectQueryParam(ownProps) || '/',
        allowRedirectBack: false
      })
      const routes = [
        { path: '/login', component: login(UnprotectedComponent) },
        { path: '/protected', component: auth(UnprotectedComponent) }
      ]

      const { history, store, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty

      history.push('/protected?param=foo')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/protected?param=foo' })

      store.dispatch(userLoggedIn())
      expect(getLocation().pathname).to.equal('/protected')
      expect(getQueryParams(getLocation())).to.deep.equal({ param: 'foo' })
    })

    it('redirection preserves hash fragment', () => {
      const auth = authWrapper(defaultConfig)
      const login = authWrapper({
        ...defaultConfig,
        authenticatedSelector: state => !authenticatedSelector(state),
        redirectPath: (state, ownProps) => getRedirectQueryParam(ownProps) || '/',
        allowRedirectBack: false
      })
      const routes = [
        { path: '/login', component: login(UnprotectedComponent) },
        { path: '/protected', component: auth(UnprotectedComponent) }
      ]

      const { history, store, getLocation } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty

      history.push('/protected#foo')
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/protected#foo' })

      store.dispatch(userLoggedIn())
      expect(getLocation().pathname).to.equal('/protected')
      expect(getLocation().hash).to.equal('#foo')
      expect(getQueryParams(getLocation())).to.be.empty
    })

    it('Throws invariant when redirectpath is not a function or string', () => {
      expect(() => authWrapper({ ...defaultConfig, redirectPath: true })).to.throw(/redirectPath must be either a string or a function/)
      expect(() => authWrapper({ ...defaultConfig, redirectPath: 1 })).to.throw(/redirectPath must be either a string or a function/)
      expect(() => authWrapper({ ...defaultConfig, redirectPath: [] })).to.throw(/redirectPath must be either a string or a function/)
      expect(() => authWrapper({ ...defaultConfig, redirectPath: {} })).to.throw(/redirectPath must be either a string or a function/)
    })

    it('Throws invariant when allowRedirectBack is not a function or boolean', () => {
      expect(() => authWrapper({ ...defaultConfig, allowRedirectBack: 'login' })).to.throw(/allowRedirectBack must be either a boolean or a function/)
      expect(() => authWrapper({ ...defaultConfig, allowRedirectBack: 1 })).to.throw(/allowRedirectBack must be either a boolean or a function/)
      expect(() => authWrapper({ ...defaultConfig, allowRedirectBack: [] })).to.throw(/allowRedirectBack must be either a boolean or a function/)
      expect(() => authWrapper({ ...defaultConfig, allowRedirectBack: {} })).to.throw(/allowRedirectBack must be either a boolean or a function/)
    })

    it("Doesn't cause re-render when store changes", () => {
      const updatespy = sinon.spy()

      class UpdateComponent extends Component {
        componentDidUpdate() {
          updatespy()
        }

        render() {
          return <div />
        }
      }

      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/auth', component: auth(UpdateComponent) }
      ]

      const { history, store, getLocation } = setupTest(routes)

      store.dispatch(userLoggedIn())
      history.push('/auth')

      expect(getLocation().pathname).to.equal('/auth')

      expect(updatespy.called).to.be.false
      store.dispatch(userLoggedIn())
      expect(updatespy.called).to.be.false
    })
  })
}

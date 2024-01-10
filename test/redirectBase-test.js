/* eslint-env node, mocha, jasmine */
import React, { Component } from 'react'
import sinon from 'sinon'
import _ from 'lodash'
import "babel-polyfill"
import Redirect from '../src/redirect'
import { userLoggedIn, userLoggedOut, userLoggingIn, userDataSelector, authenticatedSelector, defaultConfig,
         UnprotectedComponent, AuthenticatingComponent, FailureComponent } from './helpers'

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default (setupTest, versionName, getRouteParams, getQueryParams, getRedirectQueryParam, authWrapper) => {

  describe(`wrapper ${versionName} Base`, () => {

    it('redirects unauthenticated', async () => {
      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation, wrapper } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty
      history.push('/auth')
      wrapper.update()
      await sleep(10);
      
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })
    })

    it('does not redirect if authenticating', async () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatingSelector: () => true,
        AuthenticatingComponent: AuthenticatingComponent
      })
      const routes = [
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation, wrapper } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty
      history.push('/auth')
      wrapper.update()
      await sleep(10);
      
      expect(getLocation().pathname).to.equal('/auth')
      expect(getQueryParams(getLocation())).to.be.empty
    })

    it('by default ignores authenticating', async () => {
      const auth = authWrapper({ authenticatedSelector, redirectPath: '/login' })

      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation, wrapper } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty
      history.push('/auth')
      wrapper.update()
      await sleep(10);
      
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })
    })

    it('renders the specified component when authenticating', async () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatingSelector: () => true,
        AuthenticatingComponent: AuthenticatingComponent
      })
      const routes = [
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { wrapper, history } = setupTest(routes)

      history.push('/auth')
      wrapper.update()
      await sleep(10);
      
      const comp = wrapper.find(AuthenticatingComponent)
      // Props from React-Router
      expect(comp.props().location.pathname).to.equal('/auth')
    })

    it('renders nothing while authenticating and no AuthenticatingComponent set', async () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatingSelector: () => true
      })
      const routes = [
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { wrapper, history } = setupTest(routes)

      history.push('/auth')
      wrapper.update()
      await sleep(10);
      
      const comp = wrapper.find('#testRoot')
      // There is a child here. It is connect but it should render no html
      expect(comp.childAt(0).html()).to.equal('')
    })

    it('renders the failure component when prop is set', async () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: () => false,
        FailureComponent
      })
      const routes = [
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { history, store, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      wrapper.update()
      await sleep(10);
      
      const comp = wrapper.find(FailureComponent).last()
      expect(comp.props().isAuthenticated).to.be.false
    })

    it('preserves query params on redirect', async () => {
      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation, wrapper } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty
      history.push('/auth?test=foo')
      wrapper.update()
      await sleep(10);
      
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth?test=foo' })
    })

    it('allows authenticated users', async() => {
      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { store, history, getLocation, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      wrapper.update()
      await sleep(10);
      
      expect(getLocation().pathname).to.equal('/auth')
    })

    it('redirects on no longer authorized', async () => {
      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { store, history, getLocation, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      wrapper.update()
      await sleep(10);
      expect(getLocation().pathname).to.equal('/auth')

      store.dispatch(userLoggedOut())
      wrapper.update()
      await sleep(10);
      
      expect(getLocation().pathname).to.equal('/login')
    })

    it('redirects if no longer authenticating', async () => {
      const auth = authWrapper(defaultConfig)
      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { store, history, getLocation, wrapper } = setupTest(routes)

      store.dispatch(userLoggingIn())

      history.push('/auth')
      wrapper.update()
      await sleep(10)
      expect(getLocation().pathname).to.equal('/auth')

      store.dispatch(userLoggedOut())
      wrapper.update()
      await sleep(10)
      
      expect(getLocation().pathname).to.equal('/login')
    })

    it('optionally prevents redirection', async () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: () => false,
        allowRedirectBack: false
      })
      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { history, store, getLocation, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())
      wrapper.update()

      history.push('/auth')
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({})
    })

    it('optionally prevents redirection from a function result', async () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: () => false,
        allowRedirectBack: ({ location }, redirectPath) => location.pathname === '/auth' && redirectPath === '/login'
      })
      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: auth(UnprotectedComponent) },
        { path: '/authNoRedir', Component: auth(UnprotectedComponent) }
      ]

      const { history, store, getLocation, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())

      history.push('/auth')
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })

      history.push('/authNoRedir')
      wrapper.update()
      await sleep(10)
      
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({})
    })

    it('can be nested', async () => {
      const firstNameAuth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: (state) => userDataSelector(state).firstName === 'Test'
      })

      const lastNameAuth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: (state) => userDataSelector(state).lastName === 'McDuderson'
      })

      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: firstNameAuth(lastNameAuth(UnprotectedComponent)) }
      ]

      const { history, store, getLocation, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn('NotTest'))
      wrapper.update()

      history.push('/auth')
      wrapper.update()
      await sleep(10)
      
      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })
      
      store.dispatch(userLoggedIn('Test', 'NotMcDuderson'))
      wrapper.update()

      history.push('/auth')
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth' })

      store.dispatch(userLoggedIn())
      wrapper.update()

      history.push('/auth')
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/auth')
      expect(getQueryParams(getLocation())).to.be.empty
    })

    it('passes props to authed components', async () => {
      const auth = authWrapper(defaultConfig)
      const Child = auth(UnprotectedComponent)

      class PropParentComponent extends Component {

        render() {
          // Need to pass down at least location from router, but can just pass it all down
          return <Child testProp {...this.props} />
        }
      }

      const routes = [
        { path: '/prop', Component: PropParentComponent }
      ]
      const { history, store, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())
      wrapper.update()

      history.push('/prop')
      wrapper.update()
      await sleep(10)

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
    
    /*
    // ownProps will not have params
    it('passes ownProps for authenticated selector', async () => {
      const auth = authWrapper({
        ...defaultConfig,
        authenticatedSelector: (state, ownProps) => {
          const user = userDataSelector(state)
          const params = getRouteParams(ownProps) // from React-Router
          return user.firstName === 'Test' && (params && params.id === '1')
        }
      })

      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth/:id', Component: auth(UnprotectedComponent) }
      ]

      const { history, store, getLocation, wrapper } = setupTest(routes)
      
      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty

      store.dispatch(userLoggedIn())
      wrapper.update()

      history.push('/auth/1')
      await sleep(500)
      wrapper.update()
      await sleep(500)

      expect(getLocation().pathname).to.equal('/auth/1')
      expect(getQueryParams(getLocation())).to.be.empty

      history.push('/auth/2')
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth/2' })
    })
    */
    it('can override query param name', async () => {
      const auth = authWrapper({
        ...defaultConfig,
        redirectQueryParamName: 'customRedirect'
      })
      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation, wrapper } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty

      history.push('/auth')
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ customRedirect: '/auth' })
    })

    /*
    // ownProps will not have params
    it('can pass a selector for redirectPath', async () => {
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
        { path: '/login/:id', Component: UnprotectedComponent },
        { path: '/auth/:id', Component: auth(UnprotectedComponent) }
      ]

      const { history, getLocation, wrapper } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty

      history.push('/auth/1')
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/login/1')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth/1' })

      history.push('/auth/2')
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/login/0')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/auth/2' })
    })
    */
    it('only redirects once when props change but authentication is constant', async () => {

      const redirect = sinon.stub().returns({ type: 'NO_REDIRECT' })

      const auth = authWrapper({
        ...defaultConfig,
        FailureComponent: (props) => <Redirect {...props} redirect={redirect} />,
        authenticatedSelector: () => false
      })

      const routes = [
        { path: '/login', Component: UnprotectedComponent },
        { path: '/auth', Component: auth(UnprotectedComponent) }
      ]

      const { history, store, wrapper } = setupTest(routes)

      history.push('/auth')
      wrapper.update()
      await sleep(10)

      expect(redirect.calledOnce).to.equal(true)

      store.dispatch(userLoggedIn())
      wrapper.update()
      await sleep(10)

      expect(redirect.calledOnce).to.equal(true)
    })

    it('redirection preserves query params', async () => {
      const auth = authWrapper(defaultConfig)
      const login = authWrapper({
        ...defaultConfig,
        authenticatedSelector: state => !authenticatedSelector(state),
        redirectPath: (state, ownProps) => getRedirectQueryParam(ownProps) || '/',
        allowRedirectBack: false
      })
      const routes = [
        { path: '/login', Component: login(UnprotectedComponent) },
        { path: '/protected', Component: auth(UnprotectedComponent) }
      ]

      const { history, store, getLocation, wrapper } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty

      history.push('/protected?param=foo')
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/protected?param=foo' })

      store.dispatch(userLoggedIn())
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/protected')
      expect(getQueryParams(getLocation())).to.deep.equal({ param: 'foo' })
    })

    it('redirection preserves hash fragment', async () => {
      const auth = authWrapper(defaultConfig)
      const login = authWrapper({
        ...defaultConfig,
        authenticatedSelector: state => !authenticatedSelector(state),
        redirectPath: (state, ownProps) => getRedirectQueryParam(ownProps) || '/',
        allowRedirectBack: false
      })
      const routes = [
        { path: '/login', Component: login(UnprotectedComponent) },
        { path: '/protected', Component: auth(UnprotectedComponent) }
      ]

      const { history, store, getLocation, wrapper } = setupTest(routes)

      expect(getLocation().pathname).to.equal('/')
      expect(getQueryParams(getLocation())).to.be.empty

      history.push('/protected#foo')
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/login')
      expect(getQueryParams(getLocation())).to.deep.equal({ redirect: '/protected#foo' })

      store.dispatch(userLoggedIn())
      wrapper.update()
      await sleep(10)

      expect(getLocation().pathname).to.equal('/protected')
      expect(getLocation().hash).to.equal('#foo')
      expect(getQueryParams(getLocation())).to.be.empty
    })

    it('Throws invariant when redirectpath is not a function or string', async () => {
      expect(() => authWrapper({ ...defaultConfig, redirectPath: true })).to.throw(/redirectPath must be either a string or a function/)
      expect(() => authWrapper({ ...defaultConfig, redirectPath: 1 })).to.throw(/redirectPath must be either a string or a function/)
      expect(() => authWrapper({ ...defaultConfig, redirectPath: [] })).to.throw(/redirectPath must be either a string or a function/)
      expect(() => authWrapper({ ...defaultConfig, redirectPath: {} })).to.throw(/redirectPath must be either a string or a function/)
    })

    it('Throws invariant when allowRedirectBack is not a function or boolean', async () => {
      expect(() => authWrapper({ ...defaultConfig, allowRedirectBack: 'login' })).to.throw(/allowRedirectBack must be either a boolean or a function/)
      expect(() => authWrapper({ ...defaultConfig, allowRedirectBack: 1 })).to.throw(/allowRedirectBack must be either a boolean or a function/)
      expect(() => authWrapper({ ...defaultConfig, allowRedirectBack: [] })).to.throw(/allowRedirectBack must be either a boolean or a function/)
      expect(() => authWrapper({ ...defaultConfig, allowRedirectBack: {} })).to.throw(/allowRedirectBack must be either a boolean or a function/)
    })

    it("Doesn't cause re-render when store changes", async () => {
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
        { path: '/auth', Component: auth(UpdateComponent) }
      ]

      const { history, store, getLocation, wrapper } = setupTest(routes)

      store.dispatch(userLoggedIn())
      history.push('/auth')
      wrapper.update()

      await sleep(10)
      expect(getLocation().pathname).to.equal('/auth')

      expect(updatespy.called).to.be.false
      store.dispatch(userLoggedIn())
      wrapper.update()

      await sleep(10)
      expect(updatespy.called).to.be.false
    })
  })
}

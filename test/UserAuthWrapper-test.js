/* eslint-env node, mocha, jasmine */
import React, { Component, PropTypes } from 'react'
import { Route, Router } from 'react-router'
import { Provider } from 'react-redux'
import {  createStore, combineReducers, applyMiddleware } from 'redux'
import { mount } from 'enzyme'
import sinon from 'sinon'
import createMemoryHistory from 'history/createMemoryHistory'
import { routerActions, routerMiddleware } from 'react-router-redux'
import _ from 'lodash'

import { UserAuthWrapper } from '../src'

const USER_LOGGED_IN = 'USER_LOGGED_IN'
const USER_LOGGED_OUT = 'USER_LOGGED_OUT'
const USER_LOGGING_IN = 'USER_LOGGING_IN'

const userReducerInitialState = {
  userData: {},
  is: false
}
const userReducer = (state = {}, { type, payload }) => {
  if (type === USER_LOGGED_IN) {
    return {
      userData: payload,
      isAuthenticating: false
    }
  } else if (type === USER_LOGGED_OUT) {
    return userReducerInitialState
  } else if (type === USER_LOGGING_IN) {
    return {
      ...state,
      isAuthenticating: true
    }
  }
  return state
}

const rootReducer = combineReducers({
  user: userReducer
})

const userSelector = state => state.user.userData

const UserIsAuthenticated = UserAuthWrapper({
  authSelector: userSelector,
  authenticatingSelector: state => state.user.isAuthenticating,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated'
})

const UserIsAuthenticatedNoProps = UserAuthWrapper({
  authSelector: userSelector,
  authenticatingSelector: state => state.user.isAuthenticating,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated',
  propMapper: () => ({})
})

const HiddenNoRedir = UserAuthWrapper({
  authSelector: userSelector,
  redirectAction: routerActions.replace,
  failureRedirectPath: '/',
  wrapperDisplayName: 'NoRedir',
  predicate: () => false,
  allowRedirectBack: false
})

const HiddenNoRedirectFunction = UserAuthWrapper({
  authSelector: userSelector,
  redirectAction: routerActions.replace,
  failureRedirectPath: '/',
  wrapperDisplayName: 'HiddenNoRedirFunction',
  predicate: () => false,
  allowRedirectBack: (location, redirectPath) => redirectPath == '/'
})

const UserIsOnlyTest = UserAuthWrapper({
  authSelector: userSelector,
  redirectAction: routerActions.replace,
  failureRedirectPath: '/',
  wrapperDisplayName: 'UserIsOnlyTest',
  predicate: user => user.firstName === 'Test'
})

const UserIsOnlyMcDuderson = UserAuthWrapper({
  authSelector: userSelector,
  redirectAction: routerActions.replace,
  failureRedirectPath: '/',
  wrapperDisplayName: 'UserIsOnlyMcDuderson',
  predicate: user => user.lastName === 'McDuderson'
})

class LoadingComponent extends Component {
  render() {
    return (
      <div>Loading!</div>
    )
  }
}

const AlwaysAuthenticating = UserAuthWrapper({
  authSelector: userSelector,
  authenticatingSelector: () => true,
  LoadingComponent: LoadingComponent,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'AlwaysAuthenticating'
})

const AlwaysAuthenticatingDefault = UserAuthWrapper({
  authSelector: userSelector,
  authenticatingSelector: () => true,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'AlwaysAuthenticating'
})

function FailureComponent(props) {
  return (
    <div>No Access for user: {props.authData.email}</div>
  )
}

const ElevatedAccess = UserAuthWrapper({
  authSelector: userSelector,
  predicate: () => false,
  FailureComponent,
  wrapperDisplayName: 'ElevatedAccess'
})

class App extends Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

class UnprotectedComponent extends Component {
  render() {
    return (
      <div />
    )
  }
}

class PropParentComponent extends Component {
  static Child = UserIsAuthenticated(UnprotectedComponent);

  render() {
    // Need to pass down at least location from router, but can just pass it all down
    return <PropParentComponent.Child testProp {...this.props} />
  }
}

class UnprotectedParentComponent extends Component {
  static propTypes = {
    children: PropTypes.node
  };

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

const defaultRoutes = (
  <div>
    <Route exact path="/" component={App} />
    <Route path="/login" component={UnprotectedComponent} />
    <Route path="/alwaysAuth" component={AlwaysAuthenticating(UnprotectedComponent)} />
    <Route path="/alwaysAuthDef" component={AlwaysAuthenticatingDefault(UnprotectedComponent)} />
    <Route path="/auth" component={UserIsAuthenticated(UnprotectedComponent)} />
    <Route path="/authNoProps" component={UserIsAuthenticatedNoProps(UnprotectedComponent)} />
    <Route path="/hidden" component={HiddenNoRedir(UnprotectedComponent)} />
    <Route path="/hiddenNoRedirectFunction" component={HiddenNoRedirectFunction(UnprotectedComponent)} />
    <Route path="/elevatedAccess" component={ElevatedAccess(UnprotectedComponent)} />
    <Route path="/testOnly" component={UserIsOnlyTest(UnprotectedComponent)} />
    <Route path="/testMcDudersonOnly" component={UserIsOnlyMcDuderson(UserIsOnlyTest(UnprotectedComponent))} />
    <Route path="/parent" component={UserIsAuthenticated(UnprotectedParentComponent)}>
      <Route path="/child" component={UserIsAuthenticated(UnprotectedComponent)} />
    </Route>
    <Route path="/prop" component={PropParentComponent} />
  </div>
)

const userLoggedIn = (firstName = 'Test', lastName = 'McDuderson') => {
  return {
    type: USER_LOGGED_IN,
    payload: {
      email: 'test@test.com',
      firstName,
      lastName
    }
  }
}

const setupTest = (
  routes = defaultRoutes,
  history = createMemoryHistory()
) => {
  const middleware = routerMiddleware(history)
  const store = createStore(
    rootReducer,
    applyMiddleware(middleware)
  )

  const wrapper = mount(
    <Provider store={store}>
      <Router history={history} >
        {routes}
      </Router>
    </Provider>
  )

  return {
    history,
    store,
    wrapper
  }
}

describe('UserAuthWrapper', () => {
  it('redirects unauthenticated', () => {
    const { history } = setupTest()

    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('')
    history.push('/auth')
    expect(history.location.pathname).to.equal('/login')
    expect(history.location.search).to.equal('?redirect=%2Fauth')
  })

  it('does not redirect if authenticating', () => {
    const { history } = setupTest()

    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('')
    history.push('/alwaysAuth')
    expect(history.location.pathname).to.equal('/alwaysAuth')
    expect(history.location.search).to.equal('')
  })

  it('renders the specified component when authenticating', () => {
    const { history, wrapper } = setupTest()

    history.push('/alwaysAuth')

    const comp = wrapper.find(LoadingComponent)
    // Props from React-Router
    expect(comp.props().location.pathname).to.equal('/alwaysAuth')
  })

  it('renders nothing while authenticating and no LoadingComponent set', () => {
    const { history, wrapper } = setupTest()

    history.push('/alwaysAuthDef')

    const comp = wrapper.find('div')
    // There is a child here. It is connect but it should render no html
    expect(comp.childAt(0).html()).to.be.null
  })

  it('renders the failure component when prop is set', () => {
    const { history, store, wrapper } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/elevatedAccess')

    const comp = wrapper.find(FailureComponent).last()
    expect(comp.props().authData.email).to.equal('test@test.com')
  })

  it('preserves query params on redirect', () => {
    const { history, wrapper } = setupTest()
    const props = wrapper.find('Router').props()

    expect(props.history.location.pathname).to.equal('/')
    expect(props.history.location.search).to.equal('')
    history.push('/auth?test=foo')
    expect(props.history.location.pathname).to.equal('/login')
    expect(props.history.location.search).to.equal('?redirect=%2Fauth%3Ftest%3Dfoo')
  })

  it('allows authenticated users', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/auth')
    expect(history.location.pathname).to.equal('/auth')
  })

  it('redirects on no longer authorized', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/auth')
    expect(history.location.pathname).to.equal('/auth')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(history.location.pathname).to.equal('/login')
  })

  it('doesn\'t redirects on no longer authorized if FailureComponent is set', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/elevatedAccess')
    expect(history.location.pathname).to.equal('/elevatedAccess')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(history.location.pathname).to.equal('/elevatedAccess')
  })

  it('redirects if no longer authenticating', () => {
    const { history, store } = setupTest()

    store.dispatch({ type: USER_LOGGING_IN })

    history.push('/auth')
    expect(history.location.pathname).to.equal('/auth')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(history.location.pathname).to.equal('/login')
  })

  it('allows predicate authorization', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn('NotTest'))

    history.push('/testOnly')
    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('?redirect=%2FtestOnly')

    store.dispatch(userLoggedIn())

    history.push('/testOnly')
    expect(history.location.pathname).to.equal('/testOnly')
    expect(history.location.search).to.equal('')
  })


  it('optionally prevents redirection', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/hidden')
    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('')
  })

  it('optionally prevents redirection from a function result', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/hiddenNoRedirectFunction')
    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('?redirect=%2FhiddenNoRedirectFunction')
  })

  it('can be nested', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn('NotTest'))

    history.push('/testMcDudersonOnly')
    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('?redirect=%2FtestMcDudersonOnly')

    store.dispatch(userLoggedIn('Test', 'NotMcDuderson'))

    history.push('/testMcDudersonOnly')
    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('?redirect=%2FtestMcDudersonOnly')

    store.dispatch(userLoggedIn())

    history.push('/testMcDudersonOnly')
    expect(history.location.pathname).to.equal('/testMcDudersonOnly')
    expect(history.location.search).to.equal('')
  })

  it('supports nested routes', () => {
    const { history, store } = setupTest()

    history.push('/parent/child')
    expect(history.location.pathname).to.equal('/login')
    expect(history.location.search).to.equal('?redirect=%2Fparent%2Fchild')

    store.dispatch(userLoggedIn())

    history.push('/parent/child')
    expect(history.location.pathname).to.equal('/parent/child')
    expect(history.location.search).to.equal('')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(history.location.pathname).to.equal('/login')
    expect(history.location.search).to.equal('?redirect=%2Fparent%2Fchild')
  })

  it('passes props to authed components', () => {
    const { history, store, wrapper } = setupTest()

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
    expect(Object.keys(wrapper.find(UnprotectedComponent).props()).sort()).to.deep.equal([
      'authData', 'children', 'history', 'location', 'match', 'params', 'testProp'
    ])
  })


  it('hoists statics to the wrapper', () => {
    class WithStatic extends Component {
      static staticProp = true;

      render() {
        return <div/>
      }
    }

    WithStatic.staticFun = () => 'auth'

    const authed = UserIsAuthenticated(WithStatic)
    expect(authed.staticProp).to.equal(true)
    expect(authed.staticFun).to.be.a('function')
    expect(authed.staticFun()).to.equal('auth')
  })

  it('provides an onEnter static function', () => {
    let store
    const connect = (fn) => (nextState, replaceState) => fn(store, nextState, replaceState)
    const authSelectorSpy = sinon.spy(userSelector)
    const authenticatingSelectorSpy = sinon.spy(state => state.user.isAuthenticating)
    const failureRedirectSpy = sinon.spy(() => '/login')

    const UserIsAuthenticatedOnEnter = UserAuthWrapper({
      authSelector: authSelectorSpy,
      authenticatingSelector: authenticatingSelectorSpy,
      failureRedirectPath: failureRedirectSpy,
      redirectAction: routerActions.replace,
      wrapperDisplayName: 'UserIsAuthenticated'
    })


    const routesOnEnter = (
      <Route path="/" component={App} >
        <Route path="login" component={UnprotectedComponent} />
        <Route path="onEnter" component={UnprotectedComponent} onEnter={connect(UserIsAuthenticatedOnEnter.onEnter)} />
      </Route>
    )

    const { history, store: createdStore, wrapper } = setupTest(routesOnEnter)
    store = createdStore

    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('')

    // Supports isAuthenticating
    store.dispatch({ type: USER_LOGGING_IN })
    history.push('/onEnter')
    const nextState = _.pick(wrapper.find(App).props(), [ 'location', 'params', 'routes' ])
    const storeState = store.getState()
    expect(authSelectorSpy.calledOnce).to.be.true
    // Passes store and nextState down to selectors and failureRedirectPath
    expect(authSelectorSpy.calledOnce).to.be.true
    expect(authSelectorSpy.firstCall.args).to.deep.equal([ storeState, nextState ])
    expect(authenticatingSelectorSpy.calledOnce).to.be.true
    expect(authenticatingSelectorSpy.firstCall.args).to.deep.equal([ storeState, nextState ])
    expect(history.location.pathname).to.equal('/onEnter')

    // Redirects when not authorized
    store.dispatch({ type: USER_LOGGED_OUT })
    // Have to force re-check because wont recheck with store changes
    history.push('/')
    history.push('/onEnter')
    expect(authenticatingSelectorSpy.calledTwice).to.be.true
    expect(authSelectorSpy.calledTwice).to.be.true
    expect(failureRedirectSpy.calledOnce).to.be.true
    expect(failureRedirectSpy.firstCall.args[0].user).to.deep.equal(store.getState().user) // cant compare locaiton because its changed
    expect(Object.keys(failureRedirectSpy.firstCall.args[1])).to.deep.equal([ 'routes', 'params', 'location' ]) // cant compare locaiton because its changed
    expect(history.location.pathname).to.equal('/login')
    expect(history.location.search).to.equal('?redirect=%2FonEnter')
  })

  it('it doesn\'t provide an onEnter static function if FailureComponent prop is set', () => {
    const AuthWrapper = UserAuthWrapper({
      authSelector: () => false,
      FailureComponent: null
    })

    expect(AuthWrapper.onEnter).to.not.exist
  })

  it('passes ownProps for auth selector', () => {
    const authSelector = (state, ownProps, isOnEnter) => {
      if (!isOnEnter) {
        return {
          ...userSelector(state),
          ...ownProps.match.params // from React-Router
        }
      } else {
        return {}
      }
    }

    const UserIsAuthenticatedProps = UserAuthWrapper({
      authSelector: authSelector,
      redirectAction: routerActions.replace,
      wrapperDisplayName: 'UserIsAuthenticatedProps',
      predicate: user => user.firstName === 'Test' && user.id === '1'
    })

    const routes = (
      <div>
        <Route exact path="/" component={App} />
        <Route path="/login" component={UnprotectedComponent} />
        <Route path="/ownProps/:id" component={UserIsAuthenticatedProps(UnprotectedComponent)} />
      </div>
    )

    const { history, store } = setupTest(routes)

    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('')

    store.dispatch(userLoggedIn())

    history.push('/ownProps/1')
    expect(history.location.pathname).to.equal('/ownProps/1')
    expect(history.location.search).to.equal('')

    history.push('/ownProps/2')
    expect(history.location.pathname).to.equal('/login')
    expect(history.location.search).to.equal('?redirect=%2FownProps%2F2')
  })

  it('can override query param name', () => {
    const UserIsAuthenticatedQueryParam = UserAuthWrapper({
      authSelector: userSelector,
      redirectQueryParamName: 'customRedirect',
      redirectAction: routerActions.replace
    })

    const routes = (
      <div>
        <Route exact path="/" component={App} />
        <Route path="/login" component={UnprotectedComponent} />
        <Route path="/protected" component={UserIsAuthenticatedQueryParam(UnprotectedComponent)} />
      </div>
    )

    const { history } = setupTest(routes)

    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('')

    history.push('/protected')
    expect(history.location.pathname).to.equal('/login')
    expect(history.location.search).to.equal('?customRedirect=%2Fprotected')
  })

  it('can pass a selector for failureRedirectPath', () => {
    const failureRedirectFn = (state, ownProps) => {
      if (userSelector(state) === undefined && ownProps.match.params.id === '1') {
        return '/login/1'
      } else {
        return '/login/0'
      }
    }

    const UserIsAuthenticatedProps = UserAuthWrapper({
      authSelector: userSelector,
      failureRedirectPath: failureRedirectFn,
      redirectAction: routerActions.replace,
      wrapperDisplayName: 'UserIsAuthenticatedProps'
    })

    const routes = (
      <div>
        <Route exact path="/" component={App} />
        <Route path="/login/:id" component={UnprotectedComponent} />
        <Route path="/ownProps/:id" component={UserIsAuthenticatedProps(UnprotectedComponent)} />
      </div>
    )

    const { history } = setupTest(routes)

    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('')

    history.push('/ownProps/1')
    expect(history.location.pathname).to.equal('/login/1')
    expect(history.location.search).to.equal('?redirect=%2FownProps%2F1')

    history.push('/ownProps/2')
    expect(history.location.pathname).to.equal('/login/0')
    expect(history.location.search).to.equal('?redirect=%2FownProps%2F2')
  })

  it('uses router for redirect if no redirectAction specified', () => {

    const UserIsAuthenticatedNoAction = UserAuthWrapper({
      authSelector: userSelector,
      wrapperDisplayName: 'UserIsAuthenticatedRouter'
    })

    const routes = (
      <div>
        <Route exact path="/" component={App} />
        <Route path="/login" component={UnprotectedComponent} />
        <Route path="/noaction" component={UserIsAuthenticatedNoAction(UnprotectedComponent)} />
      </div>
    )

    const { history } = setupTest(routes)

    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('')

    history.push('/noaction')
    expect(history.location.pathname).to.equal('/login')
    expect(history.location.search).to.equal('?redirect=%2Fnoaction')
  })

  it('only redirects once when props change but authentication is constant', () => {

    const redirectAction = sinon.stub().returns({ type: 'NO_REDIRECT' })

    const StubbedUserIsAuthenticated = UserAuthWrapper({
      authSelector: userSelector,
      redirectAction,
      wrapperDisplayName: 'UserIsAuthenticated',
      predicate: () => false
    })

    const Component = StubbedUserIsAuthenticated(UnprotectedComponent)

    // No routing middleware to handle redirects
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
    const { history, store, wrapper } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/authNoProps')

    const comp = wrapper.find(UnprotectedComponent)
    // Props from React-Router
    expect(comp.props()).to.deep.equal({})
  })

  it('redirection preserves query params', () => {
    const LoginWrapper = UserAuthWrapper({
      authSelector: state => state.user,
      redirectAction: routerActions.replace,
      wrapperDisplayName: 'LoginWrapper',
      predicate: _.isEmpty,
      failureRedirectPath: (state, ownProps) => ownProps.location.query.redirect || '/',
      allowRedirectBack: false
    })

    const routes = (
      <div>
        <Route path="/" component={App} />
        <Route path="/login" component={LoginWrapper(UnprotectedComponent)} />
        <Route path="/protected" component={UserIsAuthenticated(UnprotectedComponent)} />
      </div>
    )

    const { history, store } = setupTest(routes)

    expect(history.location.pathname).to.equal('/')
    expect(history.location.search).to.equal('')

    history.push('/protected?param=foo')
    expect(history.location.pathname).to.equal('/login')
    expect(history.location.search).to.equal('?redirect=%2Fprotected%3Fparam%3Dfoo')
    expect(history.location.query).to.deep.equal({ redirect: '/protected?param=foo' })

    store.dispatch(userLoggedIn())
    expect(history.location.pathname).to.equal('/protected')
    expect(history.location.search).to.equal('?param=foo')
    expect(history.location.query).to.deep.equal({ param: 'foo' })
  })
})

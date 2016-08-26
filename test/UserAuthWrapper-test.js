/* eslint-env node, mocha, jasmine */
import React, { Component, PropTypes } from 'react'
import { Route, Router } from 'react-router'
import { Provider } from 'react-redux'
import {  createStore, combineReducers, applyMiddleware } from 'redux'
import { mount } from 'enzyme'
import sinon from 'sinon'
import createMemoryHistory from 'react-router/lib/createMemoryHistory'
import { routerReducer, syncHistoryWithStore, routerActions, routerMiddleware } from 'react-router-redux'

import { UserAuthWrapper } from '../src'

const USER_LOGGED_IN = 'USER_LOGGED_IN'
const USER_LOGGED_OUT = 'USER_LOGGED_OUT'
const USER_LOGGING_IN = 'USER_LOGGING_IN'

const userReducerInitialState = {
  userData: {},
  isAuthenticating: false
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
  routing: routerReducer,
  user: userReducer
})

const userSelector = state => state.user.userData

const UserIsAuthenticated = UserAuthWrapper({
  authSelector: userSelector,
  authenticatingSelector: state => state.user.isAuthenticating,
  redirectAction: routerActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated'
})

const HiddenNoRedir = UserAuthWrapper({
  authSelector: userSelector,
  redirectAction: routerActions.replace,
  failureRedirectPath: '/',
  wrapperDisplayName: 'NoRedir',
  predicate: () => false,
  allowRedirectBack: false
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
  <Route path="/" component={App} >
    <Route path="login" component={UnprotectedComponent} />
    <Route path="alwaysAuth" component={AlwaysAuthenticating(UnprotectedComponent)} />
    <Route path="alwaysAuthDef" component={AlwaysAuthenticatingDefault(UnprotectedComponent)} />
    <Route path="auth" component={UserIsAuthenticated(UnprotectedComponent)} />
    <Route path="hidden" component={HiddenNoRedir(UnprotectedComponent)} />
    <Route path="elevatedAccess" component={ElevatedAccess(UnprotectedComponent)} />
    <Route path="testOnly" component={UserIsOnlyTest(UnprotectedComponent)} />
    <Route path="testMcDudersonOnly" component={UserIsOnlyMcDuderson(UserIsOnlyTest(UnprotectedComponent))} />
    <Route path="parent" component={UserIsAuthenticated(UnprotectedParentComponent)}>
      <Route path="child" component={UserIsAuthenticated(UnprotectedComponent)} />
    </Route>
    <Route path="prop" component={PropParentComponent} />
  </Route>
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

const setupTest = (routes = defaultRoutes) => {
  const baseHistory = createMemoryHistory()
  const middleware = routerMiddleware(baseHistory)
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

  return {
    history,
    store,
    wrapper
  }
}

describe('UserAuthWrapper', () => {
  it('redirects unauthenticated', () => {
    const { history, store } = setupTest()

    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')
    history.push('/auth')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2Fauth')
  })

  it('does not redirect if authenticating', () => {
    const { history, store } = setupTest()

    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')
    history.push('/alwaysAuth')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/alwaysAuth')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')
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

    const comp = wrapper.find(App)
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
    const { history, store } = setupTest()

    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')
    history.push('/auth?test=foo')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2Fauth%3Ftest%3Dfoo')
  })

  it('allows authenticated users', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/auth')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/auth')
  })

  it('redirects on no longer authorized', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/auth')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/auth')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login')
  })

  it('doesn\'t redirects on no longer authorized if FailureComponent is set', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/elevatedAccess')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/elevatedAccess')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/elevatedAccess')
  })

  it('redirects if no longer authenticating', () => {
    const { history, store } = setupTest()

    store.dispatch({ type: USER_LOGGING_IN })

    history.push('/auth')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/auth')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login')
  })

  it('allows predicate authorization', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn('NotTest'))

    history.push('/testOnly')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2FtestOnly')

    store.dispatch(userLoggedIn())

    history.push('/testOnly')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/testOnly')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')
  })


  it('optionally prevents redirection', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/hidden')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')
  })

  it('can be nested', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn('NotTest'))

    history.push('/testMcDudersonOnly')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2FtestMcDudersonOnly')

    store.dispatch(userLoggedIn('Test', 'NotMcDuderson'))

    history.push('/testMcDudersonOnly')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2FtestMcDudersonOnly')

    store.dispatch(userLoggedIn())

    history.push('/testMcDudersonOnly')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/testMcDudersonOnly')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')
  })

  it('supports nested routes', () => {
    const { history, store } = setupTest()

    history.push('/parent/child')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2Fparent%2Fchild')

    store.dispatch(userLoggedIn())

    history.push('/parent/child')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/parent/child')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2Fparent%2Fchild')
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

    const routesOnEnter = (
      <Route path="/" component={App} >
        <Route path="login" component={UnprotectedComponent} />
        <Route path="onEnter" component={UnprotectedComponent} onEnter={connect(UserIsAuthenticated.onEnter)} />
      </Route>
    )

    const { history, store: createdStore } = setupTest(routesOnEnter)
    store = createdStore

    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')
    history.push('/onEnter')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2FonEnter')
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
          ...ownProps.routeParams // from React-Router
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
      <Route path="/" component={App} >
        <Route path="login" component={UnprotectedComponent} />
        <Route path="ownProps/:id" component={UserIsAuthenticatedProps(UnprotectedComponent)} />
      </Route>
    )

    const { history, store } = setupTest(routes)

    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')

    store.dispatch(userLoggedIn())

    history.push('/ownProps/1')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/ownProps/1')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')

    history.push('/ownProps/2')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2FownProps%2F2')
  })

  it('can override query param name', () => {
    const UserIsAuthenticatedQueryParam = UserAuthWrapper({
      authSelector: userSelector,
      redirectQueryParamName: 'customRedirect',
      redirectAction: routerActions.replace
    })

    const routes = (
      <Route path="/" component={App} >
        <Route path="login" component={UnprotectedComponent} />
        <Route path="protected" component={UserIsAuthenticatedQueryParam(UnprotectedComponent)} />
      </Route>
    )

    const { history, store } = setupTest(routes)

    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')

    history.push('/protected')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?customRedirect=%2Fprotected')
  })

  it('can pass a selector for failureRedirectPath', () => {
    const failureRedirectFn = (state, ownProps) => {
      if (userSelector(state) === undefined && ownProps.routeParams.id === '1') {
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
      <Route path="/" component={App} >
        <Route path="login/:id" component={UnprotectedComponent} />
        <Route path="ownProps/:id" component={UserIsAuthenticatedProps(UnprotectedComponent)} />
      </Route>
    )

    const { history, store } = setupTest(routes)

    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')

    history.push('/ownProps/1')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login/1')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2FownProps%2F1')

    history.push('/ownProps/2')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login/0')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2FownProps%2F2')
  })

  it('uses router for redirect if no redirectAction specified', () => {

    const UserIsAuthenticatedNoAction = UserAuthWrapper({
      authSelector: userSelector,
      wrapperDisplayName: 'UserIsAuthenticatedRouter'
    })

    const routes = (
      <Route path="/" component={App} >
        <Route path="login" component={UnprotectedComponent} />
        <Route path="noaction" component={UserIsAuthenticatedNoAction(UnprotectedComponent)} />
      </Route>
    )

    const { history, store } = setupTest(routes)

    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('')

    history.push('/noaction')
    expect(store.getState().routing.locationBeforeTransitions.pathname).to.equal('/login')
    expect(store.getState().routing.locationBeforeTransitions.search).to.equal('?redirect=%2Fnoaction')
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
})

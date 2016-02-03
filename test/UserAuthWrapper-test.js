/* eslint-env node, mocha, jasmine */
import React, { Component, PropTypes } from 'react'
import { Route, Router } from 'react-router'
import { Provider } from 'react-redux'
import { applyMiddleware, createStore, combineReducers, compose } from 'redux'
import { renderIntoDocument, findRenderedComponentWithType } from 'react-addons-test-utils'
import createMemoryHistory from 'react-router/lib/createMemoryHistory'
import { routeReducer, syncHistory, routeActions  } from 'redux-simple-router'

import { UserAuthWrapper } from '../src'

const USER_LOGGED_IN = 'USER_LOGGED_IN'
const USER_LOGGED_OUT = 'USER_LOGGED_OUT'

const userReducer = (state = {}, { type, payload }) => {
  if (type === USER_LOGGED_IN) {
    return payload
  }
  if (type === USER_LOGGED_OUT) {
    return {}
  }
  return state
}

const rootReducer = combineReducers({
  routing: routeReducer,
  user: userReducer
})

const configureStore = (history, initialState) => {
  const routerMiddleware = syncHistory(history)

  const createStoreWithMiddleware = compose(
    applyMiddleware(routerMiddleware)
  )(createStore)

  return createStoreWithMiddleware(rootReducer, initialState)
}

const userSelector = state => state.user

const UserIsAuthenticated = UserAuthWrapper({
  authSelector: userSelector,
  redirectAction: routeActions.replace,
  wrapperDisplayName: 'UserIsAuthenticated'
})

const HiddenNoRedir = UserAuthWrapper({
  authSelector: userSelector,
  redirectAction: routeActions.replace,
  failureRedirectPath: '/',
  wrapperDisplayName: 'NoRedir',
  predicate: () => false,
  allowRedirectBack: false
})

const UserIsOnlyTest = UserAuthWrapper({
  authSelector: userSelector,
  redirectAction: routeActions.replace,
  failureRedirectPath: '/',
  wrapperDisplayName: 'UserIsOnlyTest',
  predicate: user => user.firstName === 'Test'
})

// Intential deprecated version
const UserIsOnlyMcDuderson = UserAuthWrapper(userSelector)('/', 'UserIsOnlyMcDuderson', user => user.lastName === 'McDuderson')

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

const routes = (
  <Route path="/" component={App} >
    <Route path="login" component={UnprotectedComponent} />
    <Route path="auth" component={UserIsAuthenticated(UnprotectedComponent)} />
    <Route path="hidden" component={HiddenNoRedir(UnprotectedComponent)} />
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

const setupTest = () => {
  const history = createMemoryHistory()
  const store = configureStore(history)

  const tree = renderIntoDocument(
    <Provider store={store}>
      <Router history={history} >
        {routes}
      </Router>
    </Provider>
  )

  return {
    history,
    store,
    tree
  }
}

describe('UserAuthWrapper', () => {
  it('redirects unauthenticated', () => {
    const { history, store } = setupTest()

    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('')
    history.push('/auth')
    expect(store.getState().routing.location.pathname).to.equal('/login')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2Fauth')
  })

  it('preserves query params on redirect', () => {
    const { history, store } = setupTest()

    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('')
    history.push('/auth?test=foo')
    expect(store.getState().routing.location.pathname).to.equal('/login')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2Fauth%3Ftest%3Dfoo')
  })

  it('allows authenticated users', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/auth')
    expect(store.getState().routing.location.pathname).to.equal('/auth')
  })

  it('redirects on no longer authorized', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/auth')
    expect(store.getState().routing.location.pathname).to.equal('/auth')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(store.getState().routing.location.pathname).to.equal('/login')
  })

  it('allows predicate authorization', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn('NotTest'))

    history.push('/testOnly')
    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2FtestOnly')

    store.dispatch(userLoggedIn())

    history.push('/testOnly')
    expect(store.getState().routing.location.pathname).to.equal('/testOnly')
    expect(store.getState().routing.location.search).to.equal('')
  })


  it('optionally prevents redirection', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/hidden')
    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('')
  })

  it('can be nested', () => {
    const { history, store } = setupTest()

    store.dispatch(userLoggedIn('NotTest'))

    history.push('/testMcDudersonOnly')
    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2FtestMcDudersonOnly')

    store.dispatch(userLoggedIn('Test', 'NotMcDuderson'))

    history.push('/testMcDudersonOnly')
    expect(store.getState().routing.location.pathname).to.equal('/')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2FtestMcDudersonOnly')

    store.dispatch(userLoggedIn())

    history.push('/testMcDudersonOnly')
    expect(store.getState().routing.location.pathname).to.equal('/testMcDudersonOnly')
    expect(store.getState().routing.location.search).to.equal('')
  })

  it('supports nested routes', () => {
    const { history, store } = setupTest()

    history.push('/parent/child')
    expect(store.getState().routing.location.pathname).to.equal('/login')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2Fparent%2Fchild')

    store.dispatch(userLoggedIn())

    history.push('/parent/child')
    expect(store.getState().routing.location.pathname).to.equal('/parent/child')
    expect(store.getState().routing.location.search).to.equal('')

    store.dispatch({ type: USER_LOGGED_OUT })
    expect(store.getState().routing.location.pathname).to.equal('/login')
    expect(store.getState().routing.location.search).to.equal('?redirect=%2Fparent%2Fchild')
  })

  it('passes props to authed components', () => {
    const { history, store, tree } = setupTest()

    store.dispatch(userLoggedIn())

    history.push('/prop')

    const comp = findRenderedComponentWithType(tree, UnprotectedComponent)
    // Props from React-Router
    expect(comp.props.location.pathname).to.equal('/prop')
    // Props from auth selector
    expect(comp.props.authData).to.deep.equal({
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'McDuderson'
    })
    // Props from parent
    expect(comp.props.testProp).to.equal(true)
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
})

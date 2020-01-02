import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import * as reducers from './reducers'
import App from './components/App'

const reducer = combineReducers(Object.assign({}, reducers, {}))

const enhancer = compose(
  // Middleware you want to use in development:
  applyMiddleware(thunkMiddleware),
)

// Note: passing enhancer as the last argument requires redux@>=3.1.0
const store = createStore(reducer, enhancer)

ReactDOM.render(
  <Provider store={store}>
    <div>
      <App />
    </div>
  </Provider>,
  document.getElementById('mount')
)

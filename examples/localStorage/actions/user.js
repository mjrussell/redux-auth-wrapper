import * as constants from '../constants'

export function login(data) {
  localStorage.setItem('token', JSON.stringify(data.name))
  return {
    type: constants.USER_LOGGED_IN,
    payload: data
  }
}

export function logout() {
  localStorage.removeItem('token')
  return {
    type: constants.USER_LOGGED_OUT
  }
}

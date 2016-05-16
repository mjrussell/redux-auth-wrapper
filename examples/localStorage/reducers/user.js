import * as constants from '../constants'

export default function userUpdate(state = {
  name: JSON.parse(localStorage.getItem('token')) || null
}, { type, payload }) {
  if(type === constants.USER_LOGGED_IN) {
    return payload
  }
  else if(type === constants.USER_LOGGED_OUT) {
    return {}
  }
  return state
}

import React from 'react'
import { connect } from 'react-redux'

const Protected = ({ authData }) => {
  return (
    <div>{`This is a protected page, you must be logged in if you are seeing this. Welcome ${authData.name}`}</div>
  )
}
export default connect(state => ({ authData: state.user.data }))(Protected)

import React from 'react'
import { connect } from 'react-redux'

const Foo = ({ authData }) => {
  return (
    <div>{`I am Foo! Welcome ${authData.name}`}</div>
  )
}
export default connect(state => ({ authData: state.user.data }))(Foo)

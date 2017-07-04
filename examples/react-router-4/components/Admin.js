import React from 'react'
import { connect } from 'react-redux'

const Admin = ({ authData }) => {
  return <div>{`Welcome admin user: ${authData.name}`}</div>
}

export default connect(state => ({ authData: state.user.data }))(Admin)

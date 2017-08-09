import React from 'react'
import { connect } from 'react-redux'

const Admin = ({ authData }) => {
  return <div>{`Welcome admin user: ${authData.name}. You must be logged in as an admin if you are seeing this page.`}</div>
}

export default connect(state => ({ authData: state.user.data }))(Admin)

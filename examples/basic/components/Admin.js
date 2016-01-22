import React from 'react'

export default function Admin({ authData }) {
  return <div>{`Welcome admin user: ${authData.name}`}</div>
}

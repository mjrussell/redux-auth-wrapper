import React from 'react'

export default function Admin({ authData }) {
  return <div>
    <p>{`Welcome admin user: ${authData.name}`}</p>
    <p>Refreshing your page here will redirect you back to Login with a redirect back here once authenticated</p>
    <p>See the local storage example for an example that doesn't log you out on refresh</p>
  </div>
}

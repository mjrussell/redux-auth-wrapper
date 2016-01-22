import React from 'react'

export default function Foo({ authData }) {
  return (
    <div>{`I am Foo! Welcome ${authData.name}`}</div>
  )
}

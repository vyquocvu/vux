
import * as React from 'react'
import Link from 'next/link'


export default function () {
  return (
    <>
      <h1>About</h1>
      <p>This is the about page</p>
      <p>
        <Link href="/">
          <a>Go home</a>
        </Link>
      </p>
    </>
  )
}

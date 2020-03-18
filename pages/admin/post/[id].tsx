
import * as React from 'react'
import PostEditor from '../../../components/Admin/PostEditor'

// import Link from 'next/link'

export default function () {
  // const [text, setText] = React.useState('');
  if (typeof window === undefined) {
    return <div />
  }
  return (
    <div>
      <h1>About</h1>
      <p>This is the about page</p>
      <PostEditor />
    </div>
  )
}

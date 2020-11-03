import * as React from 'react'

type Props = {
  children: React.ReactNode
}

const MainContent: React.FC<Props> = ({ children }) => {

  return (
    <div className="h-screen sm:ml-0 md:ml-64 p-8">
      {children}
    </div>
  )
}

export default MainContent

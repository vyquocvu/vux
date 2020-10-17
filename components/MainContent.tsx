import * as React from 'react'

type Props = {
  children: React.ReactNode
}

const MainContent: React.FC<Props> = ({ children }) => {

  return (
    <div className="main-content sm:ml-0 md:ml-64">
      {children}
    </div>
  )
}

export default MainContent

import * as React from 'react'

type Props = {
  children: React.ReactNode
}

const MainContent: React.FC<Props> = ({ children }) => {

  return (
    <div className="main-content">
      {children}
    </div>
  )
}

export default MainContent

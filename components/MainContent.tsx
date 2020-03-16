import * as React from 'react'

type Props = {
  children: React.ReactNode
}

const MainContent: React.FunctionComponent<Props> = ({ children }) => {

  return (
    <div className="main-content">
      {children}

      <style jsx>{`
        .main-content {
          width: 75%;
          margin-left: 25%;
          padding: 50px;
          height: 100vh;
        }
      `}</style>
    </div>
  )
}

export default MainContent

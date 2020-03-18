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
          padding: 50px;
          height: 100vh;
          margin-left: 25%;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}

export default MainContent

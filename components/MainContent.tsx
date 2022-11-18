import type { ReactNode, FC } from 'react'

type Props = {
  children: ReactNode
}

const MainContent: FC<Props> = ({ children }) => {

  return (
    <div className="h-screen sm:ml-0 md:ml-64 p-8">
      {children}
    </div>
  )
}

export default MainContent

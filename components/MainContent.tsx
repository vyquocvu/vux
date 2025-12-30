import type { ReactNode, FC } from 'react'

type Props = {
  children: ReactNode
}

const MainContent: FC<Props> = ({ children }) => {

  return (
    <div className="min-h-screen sm:ml-0 md:ml-64 sm:mr-0 lg:mr-64 p-8 md:p-12 bg-white dark:bg-neutral-900">
      <div className="max-w-4xl">
        {children}
      </div>
    </div>
  )
}

export default MainContent

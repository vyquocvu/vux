import type { ReactNode, FC } from 'react'

type Props = {
  children: ReactNode
}

/**
 * One centered container, and nothing else. The article page owns its own
 * two-column grid (it is the only page with a rail) because `Layout` is
 * rendered by `_app.tsx`, which leaves no path for a page to pass a node up.
 * `max-w-[1216px]` matches Design.md's ~1200px cap.
 */
const MainContent: FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen md:ml-64 p-8 md:p-12 bg-canvas dark:bg-surface-dark">
      <div data-shell="content" className="mx-auto w-full max-w-[1216px]">{children}</div>
    </div>
  )
}

export default MainContent

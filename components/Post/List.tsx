import * as React from 'react'
import ListItem from './ListItem'

type Props = {
  items: { uid: string, name: string, content: string }[],
  isAdmin: Boolean,
}

const List: React.FunctionComponent<Props> = ({ items, isAdmin }) => (
  <>
    <div>
      {items.map(item => <ListItem key={item.uid} data={item} isAdmin={isAdmin} />)}
    </div>
    <style jsx>{`
    `}</style>
  </>
)

export default List

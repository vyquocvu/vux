import * as React from 'react'
import ListItem from './ListItem'

type Props = {
  items: { id: string, name: string, content: string }[]
}

const List: React.FunctionComponent<Props> = ({ items }) => (
  <>
    <div>
      {items.map(item => <ListItem key={item.id} data={item} />)}
    </div>
    <style jsx>{`
    `}</style>
  </>
)

export default List

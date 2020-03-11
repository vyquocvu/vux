import * as React from 'react'
import ListItem from './ListItem'

type Props = {
  items: { id: string, name: string }[]
}

const List: React.FunctionComponent<Props> = ({ items }) => (
  <ul>
    {items.map(item => (
      <li key={item.id}>
        <ListItem data={item} />
      </li>
    ))}
  </ul>
)

export default List

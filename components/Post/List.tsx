import * as React from 'react'
import ListItem from './ListItem'
import { Post } from 'interfaces/Post'


type Props = {
  items: Post[],
  isAdmin: Boolean,
}



const List: React.FunctionComponent<Props> = ({ items = [], isAdmin = false }) => {
  const renderItem = (item: Post) => {
    if (item.uid) return '';
    return <ListItem key={item.uid} data={item} isAdmin={isAdmin} />
  }
  return (
    <div>
    {(items as any[]).map((item: Post) => renderItem(item))}
  </div>
  )
}

export default List

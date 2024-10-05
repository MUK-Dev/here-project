import React from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

import BoardCard from './board-card'
import EmptySearch from './empty-search'
import NewBoardButton from './new-board-button'

interface BoardListProps {
  orgId: string
  query: {
    search?: string
    favorites?: string
  }
}

const BoardList = ({ orgId, query }: BoardListProps) => {
  const data = useQuery(api.boards.get, { orgId, ...query })

  if (data === undefined) {
    return (
      <div>
        <h2 className='text-3xl font-bold'>
          {query.favorites ? 'Favorite boards' : 'Team Boards'}
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 mt-8 pb-10'>
          <NewBoardButton orgId={orgId} disabled />
          <BoardCard.Skeleton />
          <BoardCard.Skeleton />
          <BoardCard.Skeleton />
          <BoardCard.Skeleton />
          <BoardCard.Skeleton />
        </div>
      </div>
    )
  }

  if (!data?.length && query.search) {
    return <EmptySearch text='Try searching for something else' />
  }

  if (!data?.length && query.favorites) {
    return <EmptySearch text='No favorites yet' />
  }

  if (!data?.length) {
    return <EmptySearch text='No boards yet' createButton />
  }

  return (
    <div>
      <h2 className='text-3xl font-bold'>
        {query.favorites ? 'Favorite boards' : 'Team Boards'}
      </h2>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 mt-8 pb-10'>
        <NewBoardButton orgId={orgId} />
        {data?.map((board) => (
          <BoardCard
            key={board._id}
            id={board._id}
            title={board.title}
            gradientIndex={board.gradientIndex}
            authorId={board.authorId}
            authorName={board.authorName}
            createdAt={board._creationTime}
            orgId={board.orgId}
            isFavorite={board.isFavorite}
          />
        ))}
      </div>
    </div>
  )
}

export default BoardList

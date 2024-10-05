'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';

import { gradientMap } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Actions } from '@/components/actions';

import Footer from './footer';
import { MoreHorizontal } from 'lucide-react';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';

interface BoardCardProps {
  key: string;
  id: string;
  title: string;
  gradientIndex: number;
  authorId: string;
  authorName: string;
  createdAt: number;
  orgId: string;
  isFavorite: boolean;
}

const BoardCard = ({
  authorId,
  authorName,
  createdAt,
  gradientIndex,
  id,
  isFavorite,
  orgId,
  title,
}: BoardCardProps) => {
  const { userId } = useAuth();
  const { mutate, pending: favoritePending } = useApiMutation(
    api.board.favorite
  );
  const { mutate: unmutate, pending: unfavoritePending } = useApiMutation(
    api.board.unfavorite
  );

  const authorLabel = userId === authorId ? 'You' : authorName;
  const createdAtLabel = formatDistanceToNow(createdAt, { addSuffix: true });
  const gradient = gradientMap.get(gradientIndex);

  const toggleFavorite = () => {
    if (isFavorite) {
      unmutate({ id: id as Id<'boards'> }).catch(() =>
        toast.error('Failed to unfavorite')
      );
    } else {
      mutate({ id: id as Id<'boards'>, orgId }).catch(() =>
        toast.error('Failed to favorite')
      );
    }
  };

  return (
    <Link href={`/board/${id}`}>
      <div className='group aspect-[100/75] border rounded-lg flex flex-col justify-between overflow-hidden'>
        <div className='relative flex-1'>
          <div
            style={{
              backgroundImage: gradient,
            }}
            className='w-full h-full transition-all'
          />
          {/* <Overlay /> */}
          <Actions id={id} title={title} side='right'>
            <button className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-2 outline-none'>
              <MoreHorizontal className='text-white opacity-75 hover:opacity-100 transition-opacity' />
            </button>
          </Actions>
        </div>
        <Footer
          isFavorite={isFavorite}
          title={title}
          authorLabel={authorLabel}
          createdAtLabel={createdAtLabel}
          onClick={toggleFavorite}
          disabled={favoritePending || unfavoritePending}
        />
      </div>
    </Link>
  );
};

BoardCard.Skeleton = function BoardCardSkeleton() {
  return (
    <div className='aspect-[100/75] rounded-lg overflow-hidden'>
      <Skeleton className='w-full h-full' />
    </div>
  );
};

export default BoardCard;

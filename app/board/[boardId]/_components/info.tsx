'use client';

import { Actions } from '@/components/actions';
import Hint from '@/components/hint';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { useRenameModal } from '@/store/use-rename-modal';
import { useQuery } from 'convex/react';
import { Menu } from 'lucide-react';
import { Poppins } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

interface InfoProps {
  boardId: string;
}

const font = Poppins({ subsets: ['latin'], weight: ['600'] });

const TabSeparator = () => {
  return <div className='bg-neutral-300 w-0.5 h-8 mx-1'></div>;
};

const Info = ({ boardId }: InfoProps) => {
  const data = useQuery(api.board.get, { id: boardId as Id<'boards'> });
  const { onOpen } = useRenameModal();

  if (!data) return <Info.Skeleton />;

  return (
    <div className='absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md'>
      <Hint label='Go to boards' side='bottom' sideOffset={10}>
        <Button variant='board' className='p-2' asChild>
          <Link href='/'>
            <Image
              src='/placeholder-logo.svg'
              alt='logo'
              width={40}
              height={40}
            />
            <span
              className={cn(
                'font-semibold text-xl ml-2 text-black',
                font.className
              )}
            >
              H - P
            </span>
          </Link>
        </Button>
      </Hint>
      <TabSeparator />

      <Hint label='Rename board' side='bottom' sideOffset={10}>
        <Button
          variant='board'
          className='text-base font-normal px-2'
          onClick={() => onOpen(data._id, data.title)}
        >
          {data.title}
        </Button>
      </Hint>
      <TabSeparator />
      <Actions id={data._id} title={data.title} side='bottom' sideOffset={10}>
        <div>
          <Hint label='Main menu' side='bottom' sideOffset={10}>
            <Button size='icon' variant='board'>
              <Menu />
            </Button>
          </Hint>
        </div>
      </Actions>
    </div>
  );
};

Info.Skeleton = function InfoSkeleton() {
  return (
    <div className='absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md w-[300px]' />
  );
};

export default Info;

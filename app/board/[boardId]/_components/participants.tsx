'use client';

import { useOthers, useSelf } from '@liveblocks/react';
import UserAvatar from './user-avatar';
import { connectionIdToColor } from '@/lib/utils';

const MAX_SHOWN_USERS = 2;

const Participants = () => {
  const users = useOthers();
  const currentUser = useSelf();
  const hasMoreUsers = users.length > MAX_SHOWN_USERS;

  return (
    <div className='absolute h-12 top-2 right-2 bg-white rounded-md p-3 flex items-center shadow-md'>
      <div className='flex gap-x-2'>
        {users.slice(0, MAX_SHOWN_USERS).map(({ connectionId, info }) => (
          <UserAvatar
            key={connectionId}
            borderColor={connectionIdToColor(connectionId)}
            name={info.name}
            src={info.picture}
            fallback={info?.name?.[0] || 'T'}
          />
        ))}
        {currentUser && (
          <UserAvatar
            name={`${currentUser.info.name} (You)`}
            borderColor={connectionIdToColor(currentUser.connectionId)}
            src={currentUser.info.picture}
            fallback={currentUser.info?.name?.[0]}
          />
        )}

        {hasMoreUsers && (
          <UserAvatar
            fallback={`+${users.length - MAX_SHOWN_USERS}`}
            name={`${users.length - MAX_SHOWN_USERS} more`}
          />
        )}
      </div>
    </div>
  );
};

Participants.Skeleton = function ParticipantsSkeleton() {
  return (
    <div className='absolute h-12 top-2 right-2 bg-white rounded-md p-3 flex items-center shadow-md w-[100px]' />
  );
};

export default Participants;

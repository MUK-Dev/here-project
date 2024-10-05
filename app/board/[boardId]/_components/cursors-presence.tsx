'use client';

import {
  shallow,
  useOthersConnectionIds,
  useOthersMapped,
} from '@liveblocks/react';
import React, { memo } from 'react';
import Cursor from './cursor';
import Path from './path';
import { colorToCss } from '@/lib/utils';

const CursorsPresence = memo(() => {
  const ids = useOthersConnectionIds();
  return (
    <>
      <Drafts />
      {ids.map((connectionId) => (
        <Cursor key={connectionId} connectionId={connectionId} />
      ))}
    </>
  );
});

const Drafts = () => {
  const others = useOthersMapped(
    (others) => ({
      pencilDraft: others.presence.pencilDraft,
      pencilColor: others.presence.pencilColor,
    }),
    shallow
  );

  return (
    <>
      {others.map(([key, other]) => {
        if (other.pencilDraft) {
          return (
            <Path
              key={key}
              x={0}
              y={0}
              points={other.pencilDraft}
              fill={other.pencilColor ? colorToCss(other.pencilColor) : '#CCC'}
            />
          );
        }
        return null;
      })}
    </>
  );
};

CursorsPresence.displayName = 'CursorsPresence';

export default CursorsPresence;

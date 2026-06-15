import { Suspense } from 'react';
import ChatsPage from '@/platform2/pages/Chats';

export default function ChatsRoute() {
  return (
    <Suspense>
      <ChatsPage />
    </Suspense>
  );
}

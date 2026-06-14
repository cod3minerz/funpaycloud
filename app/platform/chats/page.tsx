import { Suspense } from 'react';
import ChatsPage from '@/platform/pages/Chats';

export default function ChatsRoute() {
  return (
    <Suspense>
      <ChatsPage />
    </Suspense>
  );
}

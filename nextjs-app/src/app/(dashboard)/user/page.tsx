import { Suspense } from 'react';
import UserProfileClient from '@/components/user/UserProfileClient';

export default function UserPage() {
  return (
    <Suspense fallback={<div className="loading">Loading user profile...</div>}>
      <UserProfileClient />
    </Suspense>
  );
}

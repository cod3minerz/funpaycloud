'use client';
import { Suspense } from 'react';
import RegisterPage from '@/auth/pages/Register';

export default function RegisterRoute() {
  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
}

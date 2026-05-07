import { redirect } from 'next/navigation';

export default function PlatformPage() {
  const useV2 = process.env.NEXT_PUBLIC_PLATFORM_V2_ENABLED === 'true' || process.env.PLATFORM_V2_ENABLED === 'true';
  redirect(useV2 ? '/platform-v2/dashboard' : '/platform/dashboard');
}

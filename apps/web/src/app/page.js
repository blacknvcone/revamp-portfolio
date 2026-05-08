import RootLayout from '@/components/layout/RootLayout';
import HeroSection from '@/components/sections/HeroSection';
import { getProfile } from '@/lib/cms';

export default async function Home() {
  const profile = await getProfile();

  return (
    <RootLayout profile={profile}>
      <HeroSection profile={profile} />
    </RootLayout>
  );
}

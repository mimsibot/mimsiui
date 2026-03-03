import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useAuth } from '@/lib/auth';

export default function IndexScreen() {
  const { isHydrating, session } = useAuth();

  if (isHydrating) {
    return <LoadingScreen message="Hydrating secure session..." />;
  }

  return <Redirect href={session ? '/(app)/overview' : '/sign-in'} />;
}

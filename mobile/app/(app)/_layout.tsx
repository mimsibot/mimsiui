import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '@/lib/auth';

export default function AppLayout() {
  const { session } = useAuth();

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#11161C',
          borderTopColor: '#25303A',
          height: 74,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#F7C873',
        tabBarInactiveTintColor: '#8392A2',
        sceneStyle: {
          backgroundColor: '#0B0F14',
        },
      }}>
      <Tabs.Screen name="overview" options={{ title: 'Overview' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="send" options={{ title: 'Send' }} />
      <Tabs.Screen name="services" options={{ title: 'Services' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}

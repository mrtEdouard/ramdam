import { Stack } from 'expo-router';

// Écrans réservés aux personnes connectées.
export default function LayoutApp() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

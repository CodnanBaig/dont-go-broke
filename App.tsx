import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAppStore } from '@/stores';
import { router } from 'expo-router';

export default function App() {
  const { user } = useAppStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if onboarding is completed
    const checkOnboarding = async () => {
      if (!user || !user.onboardingCompleted) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
      setIsReady(true);
    };

    checkOnboarding();
  }, [user]);

  if (!isReady) {
    return (
      <View className="flex-1 bg-dark-bg items-center justify-center">
        {/* Loading spinner or splash screen */}
      </View>
    );
  }

  return null;
}

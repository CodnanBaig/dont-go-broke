import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface LoadingOverlayProps {
  message?: string;
  isVisible?: boolean;
  variant?: 'fullscreen' | 'inline';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  isVisible = true,
  variant = 'fullscreen'
}) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!isVisible) return null;

  if (variant === 'inline') {
    return (
      <View className="flex-row items-center justify-center py-4">
        <Animated.View style={animatedStyle}>
          <Ionicons name="refresh" size={24} color="#22c55e" />
        </Animated.View>
        <Text className="text-green-500 ml-2 font-medium">{message}</Text>
      </View>
    );
  }

  return (
    <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
      <View className="bg-dark-card rounded-2xl p-6 items-center">
        <Animated.View style={animatedStyle}>
          <Ionicons name="refresh" size={48} color="#22c55e" />
        </Animated.View>
        <Text className="text-white text-lg mt-4 font-medium">{message}</Text>
      </View>
    </View>
  );
};

export default LoadingOverlay;
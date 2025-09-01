import React, { memo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';
import { FuelLevel } from '@/types';

// Animated SVG Circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FuelGaugeProps {
  percentage: number;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const FuelGauge: React.FC<FuelGaugeProps> = memo(({ 
  percentage, 
  animated = true, 
  size = 'medium',
  showLabel = true 
}) => {
  // Size configuration
  const sizeConfig = {
    small: { width: 80, strokeWidth: 8 },
    medium: { width: 120, strokeWidth: 10 },
    large: { width: 160, strokeWidth: 12 }
  };
  
  const { width, strokeWidth } = sizeConfig[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate progress
  const progress = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Animated values
  const progressValue = useSharedValue(animated ? 0 : progress);
  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference - (progressValue.value / 100) * circumference,
    };
  });
  
  // Animate on progress change
  React.useEffect(() => {
    if (animated) {
      progressValue.value = withSpring(progress, {
        damping: 10,
        mass: 0.5,
        stiffness: 100,
      });
    } else {
      progressValue.value = progress;
    }
  }, [progress, animated]);
  
  // Get fuel level based on percentage
  const getFuelLevel = (percent: number): FuelLevel => {
    if (percent > 75) return FuelLevel.FULL;
    if (percent > 50) return FuelLevel.HIGH;
    if (percent > 25) return FuelLevel.MEDIUM;
    if (percent > 10) return FuelLevel.LOW;
    if (percent > 5) return FuelLevel.CRITICAL;
    return FuelLevel.EMPTY;
  };
  
  // Get color based on fuel level
  const getFuelColor = (level: FuelLevel): string => {
    switch (level) {
      case FuelLevel.FULL:
      case FuelLevel.HIGH:
        return '#22c55e'; // green-500
      case FuelLevel.MEDIUM:
        return '#f59e0b'; // amber-500
      case FuelLevel.LOW:
        return '#ef4444'; // red-500
      case FuelLevel.CRITICAL:
      case FuelLevel.EMPTY:
        return '#991b1b'; // red-900
      default:
        return '#6b7280'; // gray-500
    }
  };
  
  const fuelLevel = getFuelLevel(progress);
  const fuelColor = getFuelColor(fuelLevel);
  
  return (
    <View className="items-center justify-center">
      <Svg width={width} height={width} className="transform -rotate-90">
        {/* Background circle */}
        <Circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <AnimatedCircle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          stroke={fuelColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>
      
      {showLabel && (
        <View className="absolute items-center justify-center">
          <Text className="text-white font-bold" style={{ fontSize: size === 'large' ? 24 : size === 'small' ? 16 : 20 }}>
            {Math.round(progress)}%
          </Text>
          <Text className="text-gray-400 text-xs mt-1">
            Fuel
          </Text>
        </View>
      )}
    </View>
  );
});

// Add display name for debugging
FuelGauge.displayName = 'FuelGauge';

export default FuelGauge;
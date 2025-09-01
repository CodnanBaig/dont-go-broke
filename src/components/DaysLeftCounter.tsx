import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FuelLevel } from '@/types';

interface DaysLeftCounterProps {
  daysRemaining: number;
  previousDays?: number;
  fuelLevel: FuelLevel;
  onPress?: () => void;
  showBreakdown?: boolean;
  avgDailySpend?: number;
  animated?: boolean;
}

const DaysLeftCounter: React.FC<DaysLeftCounterProps> = ({
  daysRemaining,
  previousDays,
  fuelLevel,
  onPress,
  showBreakdown = true,
  avgDailySpend = 0,
  animated = true
}) => {
  const [displayDays, setDisplayDays] = useState(previousDays || daysRemaining);
  const scaleAnimation = useSharedValue(1);
  const pulseAnimation = useSharedValue(1);
  const slideAnimation = useSharedValue(0);
  const flipAnimation = useSharedValue(0);
  const warningAnimation = useSharedValue(0);
  
  // Calculate days change
  const daysChange = previousDays !== undefined ? daysRemaining - previousDays : 0;
  
  // Get colors and styling based on fuel level
  const getCounterStyling = () => {
    const stylingMap = {
      [FuelLevel.FULL]: {
        background: 'bg-green-900/10',
        border: 'border-green-500/20',
        textColor: '#22c55e',
        iconColor: '#16a34a',
        accentColor: '#22c55e',
        emoji: '🟢'
      },
      [FuelLevel.HIGH]: {
        background: 'bg-green-900/10',
        border: 'border-green-500/20',
        textColor: '#22c55e',
        iconColor: '#16a34a',
        accentColor: '#22c55e',
        emoji: '🟢'
      },
      [FuelLevel.MEDIUM]: {
        background: 'bg-yellow-900/10',
        border: 'border-yellow-500/20',
        textColor: '#f59e0b',
        iconColor: '#d97706',
        accentColor: '#f59e0b',
        emoji: '🟡'
      },
      [FuelLevel.LOW]: {
        background: 'bg-red-900/10',
        border: 'border-red-500/20',
        textColor: '#ef4444',
        iconColor: '#dc2626',
        accentColor: '#ef4444',
        emoji: '🔶'
      },
      [FuelLevel.CRITICAL]: {
        background: 'bg-red-900/20',
        border: 'border-red-500/30',
        textColor: '#ef4444',
        iconColor: '#991b1b',
        accentColor: '#ef4444',
        emoji: '🔴'
      },
      [FuelLevel.EMPTY]: {
        background: 'bg-gray-800/20',
        border: 'border-gray-500/30',
        textColor: '#6b7280',
        iconColor: '#4b5563',
        accentColor: '#6b7280',
        emoji: '💀'
      },
    };
    
    return stylingMap[fuelLevel] || stylingMap[FuelLevel.EMPTY];
  };
  
  const styling = getCounterStyling();
  
  // Format days with proper pluralization
  const formatDays = (days: number): { main: string; unit: string } => {
    if (days === 0) {
      return { main: '0', unit: 'Today' };
    } else if (days === 1) {
      return { main: '1', unit: 'Day' };
    } else if (days < 30) {
      return { main: days.toString(), unit: 'Days' };
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) {
        return { main: months.toString(), unit: months === 1 ? 'Month' : 'Months' };
      }
      return { main: `${months}M ${remainingDays}D`, unit: 'Left' };
    } else {
      const years = Math.floor(days / 365);
      const months = Math.floor((days % 365) / 30);
      return { main: `${years}Y ${months}M`, unit: 'Left' };
    }
  };
  
  // Animate counter updates
  useEffect(() => {
    if (animated) {
      // Flip animation for number change
      if (previousDays !== undefined && previousDays !== daysRemaining) {
        flipAnimation.value = withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 }, () => {
            runOnJS(setDisplayDays)(daysRemaining);
          })
        );
      } else {
        setDisplayDays(daysRemaining);
      }
      
      // Scale animation on mount
      scaleAnimation.value = withSpring(1, { damping: 15, stiffness: 200 });
      slideAnimation.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    } else {
      setDisplayDays(daysRemaining);
      scaleAnimation.value = 1;
      slideAnimation.value = 1;
    }
  }, [daysRemaining, animated]);
  
  // Warning pulse for critical levels
  useEffect(() => {
    if (fuelLevel === FuelLevel.CRITICAL || fuelLevel === FuelLevel.EMPTY) {
      const startPulse = () => {
        pulseAnimation.value = withTiming(1.1, {
          duration: 1000,
          easing: Easing.inOut(Easing.sine),
        }, () => {
          pulseAnimation.value = withTiming(1, {
            duration: 1000,
            easing: Easing.inOut(Easing.sine),
          }, () => {
            runOnJS(startPulse)();
          });
        });
        
        warningAnimation.value = withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        );
      };
      startPulse();
    } else {
      pulseAnimation.value = withTiming(1, { duration: 300 });
      warningAnimation.value = withTiming(0, { duration: 300 });
    }
  }, [fuelLevel]);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleAnimation.value * pulseAnimation.value },
      { translateY: interpolate(slideAnimation.value, [0, 1], [30, 0]) }
    ],
    opacity: slideAnimation.value,
  }));
  
  const numberFlipStyle = useAnimatedStyle(() => ({
    transform: [{ rotateX: `${flipAnimation.value * 180}deg` }],
  }));
  
  const warningStyle = useAnimatedStyle(() => ({
    opacity: warningAnimation.value,
  }));
  
  const formattedDays = formatDays(displayDays);
  
  return (
    <Animated.View style={containerStyle}>
      <Pressable
        onPress={onPress}
        className={`${styling.background} ${styling.border} border rounded-2xl p-6 mx-4`}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">{styling.emoji}</Text>
            <Text className="text-gray-300 text-sm font-medium">
              Fuel Duration
            </Text>
          </View>
          
          {/* Change indicator */}
          {daysChange !== 0 && (
            <View className="flex-row items-center">
              <Ionicons
                name={daysChange > 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={daysChange > 0 ? '#22c55e' : '#ef4444'}
              />
              <Text 
                className={`ml-1 text-xs font-medium ${
                  daysChange > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {daysChange > 0 ? '+' : ''}{Math.abs(daysChange)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Counter Display */}
        <View className="items-center">
          <Animated.View style={numberFlipStyle} className="items-center">
            <Text 
              className="text-5xl font-bold"
              style={{ color: styling.textColor }}
            >
              {formattedDays.main}
            </Text>
            <Text 
              className="text-lg font-medium mt-1"
              style={{ color: styling.textColor }}
            >
              {formattedDays.unit}
            </Text>
          </Animated.View>
          
          {/* Warning message */}
          {(fuelLevel === FuelLevel.CRITICAL || fuelLevel === FuelLevel.EMPTY) && (
            <Animated.View style={warningStyle} className="mt-3 px-3 py-1 bg-red-900/30 rounded-lg">
              <Text className="text-red-400 text-xs text-center font-medium">
                {daysRemaining <= 1 ? 'Immediate action required!' : 'Running low on funds!'}
              </Text>
            </Animated.View>
          )}
        </View>
        
        {/* Breakdown */}
        {showBreakdown && avgDailySpend > 0 && (
          <View className="mt-4 pt-4 border-t border-gray-700">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-400 text-xs">
                Avg. Daily Spend
              </Text>
              <Text className="text-gray-300 text-xs font-medium">
                ₹{avgDailySpend.toLocaleString('en-IN')}
              </Text>
            </View>
            
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-gray-400 text-xs">
                Burn Rate
              </Text>
              <Text 
                className="text-xs font-medium"
                style={{ color: styling.textColor }}
              >
                {daysRemaining > 0 ? `${(avgDailySpend / daysRemaining).toFixed(1)}% per day` : 'N/A'}
              </Text>
            </View>
          </View>
        )}
        
        {onPress && (
          <View className="mt-4 pt-3 border-t border-gray-700">
            <View className="flex-row items-center justify-center">
              <Text className="text-gray-500 text-xs mr-1">
                Tap to see spending breakdown
              </Text>
              <Ionicons name="chevron-forward" size={10} color="#6b7280" />
            </View>
          </View>
        )}
        
        {/* Background decoration */}
        <View className="absolute top-4 right-4 opacity-5">
          <Ionicons 
            name="time" 
            size={32} 
            color={styling.textColor}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default DaysLeftCounter;
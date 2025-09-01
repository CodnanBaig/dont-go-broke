import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { FuelLevel } from '@/types';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface BalanceCardProps {
  balance: number;
  previousBalance?: number;
  currency?: string;
  showChange?: boolean;
  onPress?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  fuelLevel: FuelLevel;
  animated?: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  previousBalance,
  currency = '₹',
  showChange = true,
  onPress,
  onRefresh,
  isRefreshing = false,
  fuelLevel,
  animated = true
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const animatedBalance = useSharedValue(previousBalance || 0);
  const scaleAnimation = useSharedValue(1);
  const refreshRotation = useSharedValue(0);
  const changeOpacity = useSharedValue(0);
  const slideIn = useSharedValue(0);
  
  // Calculate balance change
  const balanceChange = previousBalance !== undefined ? balance - previousBalance : 0;
  const hasPositiveChange = balanceChange > 0;
  const hasNegativeChange = balanceChange < 0;
  
  // Get colors based on fuel level and balance change
  const getCardColors = () => {
    if (hasPositiveChange) {
      return {
        background: 'bg-green-900/20',
        border: 'border-green-500/30',
        primary: '#22c55e',
        secondary: '#16a34a',
      };
    }
    
    if (hasNegativeChange) {
      return {
        background: 'bg-red-900/20',
        border: 'border-red-500/30',
        primary: '#ef4444',
        secondary: '#dc2626',
      };
    }
    
    // Default colors based on fuel level
    const colorMap = {
      [FuelLevel.FULL]: { 
        background: 'bg-green-900/10', 
        border: 'border-green-500/20', 
        primary: '#22c55e', 
        secondary: '#16a34a' 
      },
      [FuelLevel.HIGH]: { 
        background: 'bg-green-900/10', 
        border: 'border-green-500/20', 
        primary: '#22c55e', 
        secondary: '#16a34a' 
      },
      [FuelLevel.MEDIUM]: { 
        background: 'bg-yellow-900/10', 
        border: 'border-yellow-500/20', 
        primary: '#f59e0b', 
        secondary: '#d97706' 
      },
      [FuelLevel.LOW]: { 
        background: 'bg-red-900/10', 
        border: 'border-red-500/20', 
        primary: '#ef4444', 
        secondary: '#dc2626' 
      },
      [FuelLevel.CRITICAL]: { 
        background: 'bg-red-900/20', 
        border: 'border-red-500/30', 
        primary: '#ef4444', 
        secondary: '#991b1b' 
      },
      [FuelLevel.EMPTY]: { 
        background: 'bg-gray-800/20', 
        border: 'border-gray-500/30', 
        primary: '#6b7280', 
        secondary: '#4b5563' 
      },
    };
    
    return colorMap[fuelLevel] || colorMap[FuelLevel.EMPTY];
  };
  
  const colors = getCardColors();
  
  // Format currency with Indian numbering system
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('₹', currency);
  };
  
  // Animate balance counter
  useEffect(() => {
    if (animated) {
      animatedBalance.value = withTiming(balance, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      });
      
      // Slide in animation
      slideIn.value = withSpring(1, { damping: 15, stiffness: 200 });
      
      // Show change indicator
      if (showChange && balanceChange !== 0) {
        changeOpacity.value = withTiming(1, { duration: 300 }, () => {
          changeOpacity.value = withTiming(0.7, { duration: 2000 });
        });
        
        // Trigger haptic feedback for significant balance changes
        if (Math.abs(balanceChange) > 1000) {
          if (hasPositiveChange) {
            triggerHaptic('notificationSuccess');
          } else {
            triggerHaptic('notificationWarning');
          }
        }
      }
    } else {
      animatedBalance.value = balance;
      slideIn.value = 1;
    }
  }, [balance, animated]);
  
  // Refresh animation
  useEffect(() => {
    if (isRefreshing) {
      const startRotation = () => {
        refreshRotation.value = withTiming(refreshRotation.value + 360, {
          duration: 1000,
          easing: Easing.linear,
        }, (finished) => {
          if (finished && isRefreshing) {
            runOnJS(startRotation)();
          }
        });
      };
      startRotation();
    } else {
      refreshRotation.value = withTiming(0, { duration: 300 });
    }
  }, [isRefreshing]);
  
  // Pan gesture handler for refresh
  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scaleAnimation.value = withSpring(0.98);
    },
    onActive: (event) => {
      if (event.translationY > 50) {
        if (onRefresh) {
          runOnJS(onRefresh)();
        }
      }
    },
    onEnd: () => {
      scaleAnimation.value = withSpring(1);
    },
  });
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleAnimation.value },
      { translateY: interpolate(slideIn.value, [0, 1], [50, 0]) }
    ],
    opacity: slideIn.value,
  }));
  
  const refreshIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${refreshRotation.value}deg` }],
  }));
  
  const changeIndicatorStyle = useAnimatedStyle(() => ({
    opacity: changeOpacity.value,
  }));
  
  const balanceCounterStyle = useAnimatedStyle(() => {
    const displayBalance = animatedBalance.value;
    return {};
  });
  
  const handlePress = () => {
    triggerHaptic('selection');
    onPress?.();
  };
  
  const handleRefresh = () => {
    triggerHaptic('impactLight');
    onRefresh?.();
  };
  
  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          className={`${colors.background} ${colors.border} border rounded-2xl p-6 mx-4`}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View 
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: colors.primary }}
              />
              <Text className="text-gray-300 text-sm font-medium">
                Current Balance
              </Text>
            </View>
            
            <Pressable onPress={handleRefresh} disabled={isRefreshing}>
              <Animated.View style={refreshIconStyle}>
                <Ionicons 
                  name="refresh" 
                  size={18} 
                  color={colors.primary}
                />
              </Animated.View>
            </Pressable>
          </View>
          
          {/* Balance Display */}
          <View className="mb-2">
            <Animated.Text 
              className="text-3xl font-bold text-white"
              style={balanceCounterStyle}
            >
              {formatCurrency(balance)}
            </Animated.Text>
            
            {/* Balance change indicator */}
            {showChange && balanceChange !== 0 && (
              <Animated.View 
                style={changeIndicatorStyle}
                className="flex-row items-center mt-2"
              >
                <Ionicons
                  name={hasPositiveChange ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={hasPositiveChange ? '#22c55e' : '#ef4444'}
                />
                <Text 
                  className={`ml-1 text-sm font-medium ${
                    hasPositiveChange ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {hasPositiveChange ? '+' : ''}{formatCurrency(balanceChange)}
                </Text>
                <Text className="ml-2 text-xs text-gray-500">
                  vs. last update
                </Text>
              </Animated.View>
            )}
          </View>
          
          {/* Fuel Level Indicator */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-400 mr-2">
                Fuel Level:
              </Text>
              <View className="flex-row items-center">
                <View 
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: colors.primary }}
                />
                <Text 
                  className="text-xs font-medium"
                  style={{ color: colors.primary }}
                >
                  {fuelLevel.charAt(0).toUpperCase() + fuelLevel.slice(1).toLowerCase()}
                </Text>
              </View>
            </View>
            
            {onPress && (
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-500 mr-1">
                  Tap for details
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={12} 
                  color="#6b7280"
                />
              </View>
            )}
          </View>
          
          {/* Background decoration */}
          <View className="absolute top-4 right-4 opacity-5">
            <Ionicons 
              name="wallet" 
              size={48} 
              color={colors.primary}
            />
          </View>
        </Pressable>
      </Animated.View>
    </PanGestureHandler>
  );
};

export default BalanceCard;
import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { FuelLevel } from '@/types';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FuelGaugeProps {
  percentage: number;
  fuelLevel: FuelLevel;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  daysRemaining?: number;
  animated?: boolean;
}

const FuelGauge: React.FC<FuelGaugeProps> = ({
  percentage,
  fuelLevel,
  size = 200,
  strokeWidth = 12,
  showLabel = true,
  daysRemaining,
  animated = true
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const animatedProgress = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);
  const previousFuelLevel = useRef<FuelLevel>(fuelLevel);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Color mapping for fuel levels
  const getFuelColors = (level: FuelLevel) => {
    const colorMap = {
      [FuelLevel.FULL]: {
        primary: '#22c55e',
        gradient: ['#22c55e', '#16a34a'],
        glow: '#22c55e40'
      },
      [FuelLevel.HIGH]: {
        primary: '#22c55e',
        gradient: ['#22c55e', '#16a34a'],
        glow: '#22c55e40'
      },
      [FuelLevel.MEDIUM]: {
        primary: '#f59e0b',
        gradient: ['#f59e0b', '#d97706'],
        glow: '#f59e0b40'
      },
      [FuelLevel.LOW]: {
        primary: '#ef4444',
        gradient: ['#ef4444', '#dc2626'],
        glow: '#ef444440'
      },
      [FuelLevel.CRITICAL]: {
        primary: '#991b1b',
        gradient: ['#ef4444', '#991b1b'],
        glow: '#ef444460'
      },
      [FuelLevel.EMPTY]: {
        primary: '#6b7280',
        gradient: ['#6b7280', '#4b5563'],
        glow: '#6b728040'
      }
    };
    
    return colorMap[level] || colorMap[FuelLevel.EMPTY];
  };
  
  const colors = getFuelColors(fuelLevel);
  
  // Animation effects
  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(percentage, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedProgress.value = percentage;
    }
    
    // Trigger haptic feedback when fuel level changes significantly
    if (previousFuelLevel.current !== fuelLevel) {
      const previousLevel = previousFuelLevel.current;
      previousFuelLevel.current = fuelLevel;
      
      // Trigger haptic feedback for critical level changes
      if (
        (previousLevel === FuelLevel.FULL || previousLevel === FuelLevel.HIGH) && 
        (fuelLevel === FuelLevel.LOW || fuelLevel === FuelLevel.CRITICAL || fuelLevel === FuelLevel.EMPTY)
      ) {
        triggerHaptic('notificationWarning');
      } else if (
        (previousLevel === FuelLevel.CRITICAL || previousLevel === FuelLevel.EMPTY) && 
        (fuelLevel === FuelLevel.LOW || fuelLevel === FuelLevel.MEDIUM || fuelLevel === FuelLevel.HIGH || fuelLevel === FuelLevel.FULL)
      ) {
        triggerHaptic('notificationSuccess');
      } else if (
        previousLevel === FuelLevel.LOW && 
        (fuelLevel === FuelLevel.CRITICAL || fuelLevel === FuelLevel.EMPTY)
      ) {
        triggerHaptic('notificationError');
      }
    }
  }, [percentage, animated, fuelLevel]);
  
  // Pulse animation for critical levels
  useEffect(() => {
    if (fuelLevel === FuelLevel.CRITICAL || fuelLevel === FuelLevel.LOW) {
      const startPulse = () => {
        pulseAnimation.value = withTiming(1.05, {
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
      };
      startPulse();
    } else {
      pulseAnimation.value = withTiming(1, { duration: 300 });
    }
  }, [fuelLevel]);
  
  const animatedProps = useAnimatedProps(() => {
    const strokeDasharray = circumference;
    const strokeDashoffset = interpolate(
      animatedProgress.value,
      [0, 100],
      [circumference, 0]
    );
    
    return {
      strokeDasharray,
      strokeDashoffset,
    };
  });
  
  const animatedContainerProps = useAnimatedProps(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));
  
  const getFuelIcon = () => {
    switch (fuelLevel) {
      case FuelLevel.FULL:
      case FuelLevel.HIGH:
        return '⛽';
      case FuelLevel.MEDIUM:
        return '🟡';
      case FuelLevel.LOW:
        return '🔶';
      case FuelLevel.CRITICAL:
        return '🔴';
      case FuelLevel.EMPTY:
        return '💀';
      default:
        return '⛽';
    }
  };
  
  const getLevelText = () => {
    switch (fuelLevel) {
      case FuelLevel.FULL:
        return 'Full Tank';
      case FuelLevel.HIGH:
        return 'Good';
      case FuelLevel.MEDIUM:
        return 'Medium';
      case FuelLevel.LOW:
        return 'Low';
      case FuelLevel.CRITICAL:
        return 'Critical';
      case FuelLevel.EMPTY:
        return 'Empty';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <View className="items-center justify-center">
      <Animated.View 
        style={animatedContainerProps}
        className="relative"
      >
        {/* Glow effect for critical levels */}
        {(fuelLevel === FuelLevel.CRITICAL || fuelLevel === FuelLevel.LOW) && (
          <View 
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: colors.glow,
              width: size + 20,
              height: size + 20,
              left: -10,
              top: -10,
              opacity: 0.6,
            }}
          />
        )}
        
        <Svg width={size} height={size} className="transform -rotate-90">
          <Defs>
            <LinearGradient id="fuelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.gradient[0]} />
              <Stop offset="100%" stopColor={colors.gradient[1]} />
            </LinearGradient>
          </Defs>
          
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#374151"
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.3}
          />
          
          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#fuelGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            animatedProps={animatedProps}
          />
        </Svg>
        
        {/* Center content */}
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-4xl mb-1">{getFuelIcon()}</Text>
          <Text 
            className="text-2xl font-bold"
            style={{ color: colors.primary }}
          >
            {percentage}%
          </Text>
          {showLabel && (
            <View className="items-center mt-1">
              <Text 
                className="text-sm font-medium"
                style={{ color: colors.primary }}
              >
                {getLevelText()}
              </Text>
              {daysRemaining !== undefined && (
                <Text className="text-xs text-gray-400 mt-0.5">
                  {daysRemaining === 0 
                    ? 'Today' 
                    : daysRemaining === 1 
                      ? '1 day left' 
                      : `${daysRemaining} days left`
                  }
                </Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>
      
      {/* Warning message for critical levels */}
      {(fuelLevel === FuelLevel.CRITICAL || fuelLevel === FuelLevel.EMPTY) && (
        <View className="mt-4 px-4 py-2 bg-red-900/20 border border-red-500/30 rounded-lg">
          <Text className="text-red-400 text-xs text-center font-medium">
            {fuelLevel === FuelLevel.EMPTY 
              ? '🚨 Emergency! Refuel immediately!' 
              : '⚠️ Critical fuel level! Take action soon.'
            }
          </Text>
        </View>
      )}
    </View>
  );
};

export default FuelGauge;
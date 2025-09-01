import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface BalanceCardProps {
  currentBalance: number;
  salaryAmount: number;
  totalSpent: number;
  onRecharge: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = memo(({ 
  currentBalance, 
  salaryAmount, 
  totalSpent, 
  onRecharge 
}) => {
  // Animated values for balance
  const balanceScale = useSharedValue(1);
  const balanceOpacity = useSharedValue(1);
  
  // Animated style for balance
  const balanceAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: balanceScale.value }],
      opacity: balanceOpacity.value,
    };
  });
  
  // Trigger animation when balance changes
  React.useEffect(() => {
    balanceScale.value = withSpring(1.05, {
      damping: 10,
      mass: 0.5,
      stiffness: 100,
    });
    
    const timer = setTimeout(() => {
      balanceScale.value = withSpring(1, {
        damping: 10,
        mass: 0.5,
        stiffness: 100,
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [currentBalance]);
  
  // Calculate percentage
  const percentage = salaryAmount > 0 ? Math.round((currentBalance / salaryAmount) * 100) : 0;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <View className="bg-dark-card rounded-2xl p-6 mb-6 border border-dark-border">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-gray-400 text-lg">Current Balance</Text>
        <TouchableOpacity 
          className="bg-fuel-full rounded-full w-10 h-10 items-center justify-center"
          onPress={onRecharge}
        >
          <Ionicons name="refresh" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <Animated.View style={balanceAnimatedStyle}>
        <Text className="text-white text-4xl font-bold mb-2">
          {formatCurrency(currentBalance)}
        </Text>
      </Animated.View>
      
      <View className="flex-row items-center mb-4">
        <Text className="text-gray-400">
          of {formatCurrency(salaryAmount)}
        </Text>
        <View className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
        <Text className="text-fuel-medium font-medium">
          {percentage}%
        </Text>
      </View>
      
      <View className="w-full bg-gray-700 rounded-full h-3">
        <View 
          className="bg-fuel-full h-3 rounded-full"
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </View>
      
      <View className="flex-row justify-between mt-2">
        <Text className="text-gray-400 text-sm">
          Spent: {formatCurrency(totalSpent)}
        </Text>
        <Text className="text-gray-400 text-sm">
          Remaining: {formatCurrency(currentBalance)}
        </Text>
      </View>
    </View>
  );
});

// Add display name for debugging
BalanceCard.displayName = 'BalanceCard';

export default BalanceCard;
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  useAnimatedScrollHandler
} from 'react-native-reanimated';
import { useAppStore } from '@/stores';
import FuelGauge from '@/components/FuelGauge';
import BalanceCard from '@/components/BalanceCard';
import DaysLeftCounter from '@/components/DaysLeftCounter';
import ExpenseList from '@/components/ExpenseList';
import SmartSuggestions from '@/components/SmartSuggestions';
import { Ionicons } from '@expo/vector-icons';
import SkeletonLoader from '@/components/SkeletonLoader';
import LoadingOverlay from '@/components/LoadingOverlay';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export default function DashboardScreen() {
  const router = useRouter();
  const { triggerHaptic } = useHapticFeedback();
  
  const {
    currentBalance,
    daysRemaining,
    fuelStatus,
    salary,
    recentExpenses,
    refreshData,
    isLoading,
    error,
    suggestions,
    dismissSuggestion,
    executeSuggestionAction
  } = useAppStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  const fuelGaugeScale = useSharedValue(1);
  const balanceCardOpacity = useSharedValue(0);
  const daysCounterOpacity = useSharedValue(0);
  const quickActionsOpacity = useSharedValue(0);
  const recentExpensesOpacity = useSharedValue(0);
  const suggestionsOpacity = useSharedValue(0);
  
  // Handle global error state
  useEffect(() => {
    if (error) {
      setLocalError(error);
      triggerHaptic('notificationError');
    }
  }, [error]);
  
  // Initialize animations on mount
  useEffect(() => {
    // Staggered entrance animations
    balanceCardOpacity.value = withTiming(1, { duration: 500 });
    daysCounterOpacity.value = withTiming(1, { duration: 500, delay: 200 });
    quickActionsOpacity.value = withTiming(1, { duration: 500, delay: 400 });
    recentExpensesOpacity.value = withTiming(1, { duration: 500, delay: 600 });
    suggestionsOpacity.value = withTiming(1, { duration: 500, delay: 800 });
  }, []);
  
  // Scroll handler for parallax effects
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      
      // Fade out header as user scrolls down
      headerOpacity.value = interpolate(
        event.contentOffset.y,
        [0, 100],
        [1, 0],
        Extrapolation.CLAMP
      );
    },
  });
  
  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  
  const fuelGaugeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [0, 100],
          [1, 0.95],
          Extrapolation.CLAMP
        )
      },
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -20],
          Extrapolation.CLAMP
        )
      }
    ],
  }));
  
  const balanceCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: balanceCardOpacity.value,
    transform: [
      {
        translateY: interpolate(
          balanceCardOpacity.value,
          [0, 1],
          [20, 0]
        )
      },
      {
        scale: interpolate(
          balanceCardOpacity.value,
          [0, 1],
          [0.95, 1]
        )
      }
    ],
  }));
  
  const daysCounterAnimatedStyle = useAnimatedStyle(() => ({
    opacity: daysCounterOpacity.value,
    transform: [
      {
        translateY: interpolate(
          daysCounterOpacity.value,
          [0, 1],
          [20, 0]
        )
      },
      {
        scale: interpolate(
          daysCounterOpacity.value,
          [0, 1],
          [0.95, 1]
        )
      }
    ],
  }));
  
  const quickActionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: quickActionsOpacity.value,
    transform: [
      {
        translateY: interpolate(
          quickActionsOpacity.value,
          [0, 1],
          [20, 0]
        )
      },
      {
        scale: interpolate(
          quickActionsOpacity.value,
          [0, 1],
          [0.95, 1]
        )
      }
    ],
  }));
  
  const recentExpensesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: recentExpensesOpacity.value,
    transform: [
      {
        translateY: interpolate(
          recentExpensesOpacity.value,
          [0, 1],
          [20, 0]
        )
      },
      {
        scale: interpolate(
          recentExpensesOpacity.value,
          [0, 1],
          [0.98, 1]
        )
      }
    ],
  }));
  
  const suggestionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: suggestionsOpacity.value,
    transform: [
      {
        translateY: interpolate(
          suggestionsOpacity.value,
          [0, 1],
          [20, 0]
        )
      },
      {
        scale: interpolate(
          suggestionsOpacity.value,
          [0, 1],
          [0.98, 1]
        )
      }
    ],
  }));
  
  const handleRefresh = async () => {
    try {
      triggerHaptic('impactLight');
      
      // Animate fuel gauge on refresh
      fuelGaugeScale.value = withSpring(0.95, { damping: 10 }, () => {
        fuelGaugeScale.value = withSpring(1, { damping: 10 });
      });
      
      setIsRefreshing(true);
      setLocalError(null);
      await refreshData();
      
      // Success haptic feedback
      triggerHaptic('notificationSuccess');
    } catch (err) {
      setLocalError('Failed to refresh data. Please try again.');
      triggerHaptic('notificationError');
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleAddExpense = () => {
    triggerHaptic('selection');
    // Animate button press
    router.push('/add-expense');
  };
  
  const handleViewAllExpenses = () => {
    triggerHaptic('selection');
    router.push('/expenses');
  };
  
  const handleViewSalary = () => {
    triggerHaptic('selection');
    router.push('/salary');
  };
  
  const handleSuggestionAction = (suggestionId: string, actionId: string) => {
    triggerHaptic('impactMedium');
    executeSuggestionAction(suggestionId, actionId);
  };
  
  const handleSuggestionDismiss = (suggestionId: string) => {
    triggerHaptic('impactLight');
    dismissSuggestion(suggestionId);
  };
  
  // Skeleton components for loading states
  const renderSkeletonFuelGauge = () => (
    <View className="px-4 py-2">
      <View className="items-center justify-center">
        <View className="w-52 h-52 rounded-full bg-gray-700 items-center justify-center">
          <SkeletonLoader width={80} height={80} borderRadius={40} />
          <View className="mt-4">
            <SkeletonLoader width={60} height={24} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderSkeletonBalanceCard = () => (
    <View className="py-4 px-4">
      <View className="bg-dark-card border border-gray-700 rounded-2xl p-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <SkeletonLoader width={12} height={12} borderRadius={6} />
            <View className="ml-3">
              <SkeletonLoader width={120} height={16} />
            </View>
          </View>
          <SkeletonLoader width={18} height={18} borderRadius={9} />
        </View>
        
        <View className="mb-2">
          <SkeletonLoader width={160} height={36} />
          <View className="flex-row items-center mt-2">
            <SkeletonLoader width={80} height={16} />
          </View>
        </View>
        
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <SkeletonLoader width={80} height={14} />
          </View>
          <View className="flex-row items-center">
            <SkeletonLoader width={100} height={14} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderSkeletonDaysCounter = () => (
    <View className="py-2 px-4">
      <View className="bg-dark-card border border-gray-700 rounded-2xl p-4">
        <View className="flex-row items-center justify-between">
          <View>
            <SkeletonLoader width={120} height={20} />
            <View className="mt-2">
              <SkeletonLoader width={160} height={24} />
            </View>
          </View>
          <View className="items-end">
            <SkeletonLoader width={100} height={16} />
            <View className="mt-2">
              <SkeletonLoader width={80} height={16} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSkeletonQuickActions = () => (
    <View className="px-4 py-6">
      <View className="flex-row justify-between">
        {[1, 2, 3].map((item) => (
          <View 
            key={item}
            className="bg-dark-card border border-gray-700 rounded-xl p-4 flex-1 mx-1"
          >
            <View className="items-center">
              <SkeletonLoader width={48} height={48} borderRadius={24} />
              <View className="mt-2">
                <SkeletonLoader width={80} height={16} />
              </View>
              <View className="mt-1">
                <SkeletonLoader width={60} height={12} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSkeletonExpenseList = () => (
    <View className="px-4 py-2">
      <View className="flex-row items-center justify-between mb-4">
        <SkeletonLoader width={140} height={20} />
        <SkeletonLoader width={60} height={16} />
      </View>
      
      {[1, 2, 3].map((item) => (
        <View 
          key={item}
          className="bg-dark-card rounded-xl p-4 mb-3 border border-dark-border"
        >
          <View className="flex-row items-center">
            <SkeletonLoader width={48} height={48} borderRadius={24} />
            
            <View className="flex-1 ml-4">
              <View className="flex-row items-center justify-between mb-1">
                <SkeletonLoader width="70%" height={18} />
                <SkeletonLoader width={80} height={20} />
              </View>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <SkeletonLoader width={60} height={14} />
                  <View className="mx-2">
                    <SkeletonLoader width={4} height={4} borderRadius={2} />
                  </View>
                  <SkeletonLoader width={80} height={14} />
                </View>
                <SkeletonLoader width={80} height={14} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSkeletonSuggestions = () => (
    <View className="py-4 px-4">
      {[1, 2].map((item) => (
        <View 
          key={item}
          className="bg-dark-card rounded-2xl p-4 mb-4 border border-dark-border"
        >
          <View className="flex-row items-start">
            <SkeletonLoader width={40} height={40} borderRadius={20} />
            <View className="flex-1 ml-3">
              <SkeletonLoader width="80%" height={18} />
              <View className="mt-2">
                <SkeletonLoader width="100%" height={14} />
                <View className="mt-1">
                  <SkeletonLoader width="90%" height={14} />
                </View>
              </View>
              <View className="flex-row mt-3">
                <SkeletonLoader width={100} height={32} borderRadius={16} />
                <View className="ml-2">
                  <SkeletonLoader width={80} height={32} borderRadius={16} />
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // Error display component
  const renderError = () => {
    if (!localError) return null;
    
    return (
      <View className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mx-4 mb-4">
        <View className="flex-row items-center">
          <Ionicons name="warning" size={20} color="#ef4444" />
          <Text className="text-red-400 font-medium ml-2">Error</Text>
        </View>
        <Text className="text-red-300 text-sm mt-1">{localError}</Text>
        <Pressable 
          className="mt-2 self-start"
          onPress={() => {
            setLocalError(null);
            handleRefresh();
          }}
        >
          <Text className="text-green-400 text-sm font-medium">Retry</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-dark-bg">
        {isLoading && <LoadingOverlay message="Loading dashboard..." />}
        
        <Animated.ScrollView
          className="flex-1"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#22c55e"
              colors={['#22c55e']}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Error display */}
          {renderError()}
          
          {/* Animated Header */}
          <Animated.View 
            style={headerAnimatedStyle}
            className="px-4 pt-4 pb-2"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-2xl font-bold">Dashboard</Text>
                <Text className="text-gray-400 text-sm">
                  {new Date().toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              <Pressable 
                onPress={handleRefresh}
                className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                })}
                accessibilityLabel="Refresh dashboard"
                accessibilityRole="button"
              >
                <Animated.View
                  style={useAnimatedStyle(() => ({
                    transform: [
                      {
                        rotate: `${interpolate(
                          scrollY.value,
                          [0, 100],
                          [0, 360],
                          Extrapolation.CLAMP
                        )}deg`
                      }
                    ],
                  }))}
                >
                  <Ionicons 
                    name="refresh" 
                    size={20} 
                    color="#22c55e" 
                  />
                </Animated.View>
              </Pressable>
            </View>
          </Animated.View>
          
          {/* Animated Fuel Gauge or Skeleton */}
          <Animated.View 
            style={[fuelGaugeAnimatedStyle, { transform: [{ scale: fuelGaugeScale }] }]}
            className="px-4 py-2"
          >
            {isLoading ? renderSkeletonFuelGauge() : (
              <FuelGauge
                percentage={fuelStatus.percentage}
                fuelLevel={fuelStatus.level}
                daysRemaining={daysRemaining}
                animated={true}
              />
            )}
          </Animated.View>
          
          {/* Animated Balance Card or Skeleton */}
          <Animated.View 
            style={balanceCardAnimatedStyle}
            className="py-4"
          >
            {isLoading ? renderSkeletonBalanceCard() : (
              <BalanceCard
                balance={currentBalance}
                currency="₹"
                fuelLevel={fuelStatus.level}
                onPress={handleViewSalary}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                animated={true}
              />
            )}
          </Animated.View>
          
          {/* Animated Days Left Counter or Skeleton */}
          <Animated.View 
            style={daysCounterAnimatedStyle}
            className="py-2"
          >
            {isLoading ? renderSkeletonDaysCounter() : (
              <DaysLeftCounter
                daysRemaining={daysRemaining}
                fuelLevel={fuelStatus.level}
                onPress={handleViewSalary}
                avgDailySpend={currentBalance > 0 && daysRemaining > 0 ? currentBalance / daysRemaining : 0}
                animated={true}
              />
            )}
          </Animated.View>
          
          {/* Animated Quick Actions or Skeleton */}
          <Animated.View 
            style={quickActionsAnimatedStyle}
            className="px-4 py-6"
          >
            {isLoading ? renderSkeletonQuickActions() : (
              <View className="flex-row justify-between">
                <Pressable
                  onPress={handleAddExpense}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex-1 mr-2"
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                  accessibilityLabel="Add new expense"
                  accessibilityRole="button"
                >
                  <View className="items-center">
                    <View className="w-12 h-12 bg-green-900/20 rounded-full items-center justify-center mb-2">
                      <Ionicons name="add" size={24} color="#22c55e" />
                    </View>
                    <Text className="text-white font-medium">Add Expense</Text>
                    <Text className="text-gray-400 text-xs mt-1">Track spending</Text>
                  </View>
                </Pressable>
                
                <Pressable
                  onPress={() => router.push('/expenses')}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex-1 mx-2"
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                  accessibilityLabel="View expense history"
                  accessibilityRole="button"
                >
                  <View className="items-center">
                    <View className="w-12 h-12 bg-blue-900/20 rounded-full items-center justify-center mb-2">
                      <Ionicons name="list" size={24} color="#3b82f6" />
                    </View>
                    <Text className="text-white font-medium">Expenses</Text>
                    <Text className="text-gray-400 text-xs mt-1">View history</Text>
                  </View>
                </Pressable>
                
                <Pressable
                  onPress={handleViewSalary}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex-1 ml-2"
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                  accessibilityLabel="Manage salary and bills"
                  accessibilityRole="button"
                >
                  <View className="items-center">
                    <View className="w-12 h-12 bg-purple-900/20 rounded-full items-center justify-center mb-2">
                      <Ionicons name="wallet" size={24} color="#8b5cf6" />
                    </View>
                    <Text className="text-white font-medium">Salary</Text>
                    <Text className="text-gray-400 text-xs mt-1">Manage income</Text>
                  </View>
                </Pressable>
              </View>
            )}
          </Animated.View>
          
          {/* Animated Recent Expenses or Skeleton */}
          <Animated.View 
            style={recentExpensesAnimatedStyle}
            className="px-4 py-2"
          >
            {isLoading ? renderSkeletonExpenseList() : (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-lg font-semibold">Recent Expenses</Text>
                  {recentExpenses.length > 0 && (
                    <Pressable onPress={handleViewAllExpenses}>
                      <Text className="text-green-500 text-sm font-medium">View All</Text>
                    </Pressable>
                  )}
                </View>
                
                <ExpenseList
                  expenses={recentExpenses.slice(0, 3)}
                  showGrouping={false}
                  showActions={false}
                  emptyMessage="No expenses yet. Start tracking your spending!"
                  onExpensePress={(expense) => router.push(`/expense-detail/${expense.id}`)}
                />
              </>
            )}
          </Animated.View>
          
          {/* Animated Smart Suggestions or Skeleton */}
          <Animated.View 
            style={suggestionsAnimatedStyle}
            className="py-4"
          >
            {isLoading ? renderSkeletonSuggestions() : (
              <SmartSuggestions
                suggestions={suggestions.slice(0, 2)}
                onActionPress={(suggestion, actionId) => handleSuggestionAction(suggestion.id, actionId)}
                onDismiss={handleSuggestionDismiss}
                maxVisible={2}
              />
            )}
          </Animated.View>
          
          {/* Footer spacing */}
          <View className="h-8" />
        </Animated.ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
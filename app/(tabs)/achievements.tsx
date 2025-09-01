import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AchievementService from '@/services/achievementService';
import { Achievement, AchievementTier } from '@/types';
import SkeletonLoader from '@/components/SkeletonLoader';
import LoadingOverlay from '@/components/LoadingOverlay';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Run achievement checks
      AchievementService.runAchievementChecks();
      
      // Get all achievements
      const allAchievements = AchievementService.getAllAchievements();
      setAchievements(allAchievements);
    } catch (err) {
      setError('Failed to load achievements. Please try again.');
      console.error('Achievements load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  };

  const getTierColor = (tier: AchievementTier) => {
    switch (tier) {
      case AchievementTier.BRONZE: return '#cd7f32';
      case AchievementTier.SILVER: return '#c0c0c0';
      case AchievementTier.GOLD: return '#ffd700';
      case AchievementTier.PLATINUM: return '#e5e4e2';
      default: return '#6b7280';
    }
  };

  const getTierIcon = (tier: AchievementTier) => {
    switch (tier) {
      case AchievementTier.BRONZE: return 'medal-outline';
      case AchievementTier.SILVER: return 'medal-outline';
      case AchievementTier.GOLD: return 'trophy';
      case AchievementTier.PLATINUM: return 'diamond';
      default: return 'star';
    }
  };

  const formatProgress = (current: number, target: number) => {
    if (target >= 1000) {
      return `₹${(current / 1000).toFixed(1)}K / ₹${(target / 1000).toFixed(1)}K`;
    }
    return `${current} / ${target}`;
  };

  // Skeleton components for loading states
  const renderStatsSkeleton = () => (
    <View className="px-4 pb-4">
      <View className="bg-dark-card rounded-2xl p-4 border border-dark-border">
        <View className="flex-row justify-between">
          {[1, 2, 3].map((item) => (
            <View key={item} className="items-center flex-1">
              <SkeletonLoader width={40} height={32} />
              <View className="mt-1">
                <SkeletonLoader width={60} height={14} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAchievementSkeleton = () => (
    <View className="bg-dark-card rounded-xl p-4 mb-3 border border-dark-border">
      <View className="flex-row items-center">
        <SkeletonLoader width={48} height={48} borderRadius={24} />
        
        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-1">
            <SkeletonLoader width="70%" height={18} />
            <SkeletonLoader width={24} height={24} borderRadius={12} />
          </View>
          
          <View className="mb-2">
            <SkeletonLoader width="100%" height={14} />
            <View className="mt-1">
              <SkeletonLoader width="90%" height={14} />
            </View>
          </View>
          
          <View className="flex-row items-center justify-between">
            <SkeletonLoader width={80} height={12} />
            <SkeletonLoader width={60} height={12} />
          </View>
          <View className="mt-1">
            <SkeletonLoader width="100%" height={8} borderRadius={4} />
          </View>
        </View>
      </View>
    </View>
  );

  // Error display component
  const renderError = () => {
    if (!error) return null;
    
    return (
      <View className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mx-4 mb-4">
        <View className="flex-row items-center">
          <Ionicons name="warning" size={20} color="#ef4444" />
          <Text className="text-red-400 font-medium ml-2">Error</Text>
        </View>
        <Text className="text-red-300 text-sm mt-1">{error}</Text>
        <TouchableOpacity 
          className="mt-2 self-start"
          onPress={loadAchievements}
        >
          <Text className="text-green-400 text-sm font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-dark-bg">
        {isLoading && <LoadingOverlay message="Loading achievements..." />}
        
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="p-4 pb-2">
            <Text className="text-white text-2xl font-bold">Achievements</Text>
            <Text className="text-gray-400 text-sm">
              Unlock badges and rewards as you progress
            </Text>
          </View>

          {/* Error display */}
          {renderError()}

          {/* Stats */}
          {isLoading ? renderStatsSkeleton() : (
            <View className="px-4 pb-4">
              <View className="bg-dark-card rounded-2xl p-4 border border-dark-border">
                <View className="flex-row justify-between">
                  <View className="items-center">
                    <Text className="text-fuel-full text-2xl font-bold">
                      {achievements.filter(a => a.unlockedAt).length}
                    </Text>
                    <Text className="text-gray-400 text-sm">Unlocked</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-fuel-medium text-2xl font-bold">
                      {achievements.filter(a => !a.unlockedAt).length}
                    </Text>
                    <Text className="text-gray-400 text-sm">Pending</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-gray-400 text-2xl font-bold">
                      {Math.round((achievements.filter(a => a.unlockedAt).length / achievements.length) * 100)}%
                    </Text>
                    <Text className="text-gray-400 text-sm">Complete</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Achievements List */}
          <View className="px-4 pb-8">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((item) => (
                <View key={item}>
                  {renderAchievementSkeleton()}
                </View>
              ))
            ) : (
              achievements.map((achievement) => (
                <View 
                  key={achievement.id}
                  className={`bg-dark-card rounded-xl p-4 mb-3 border ${
                    achievement.unlockedAt 
                      ? 'border-fuel-full' 
                      : 'border-dark-border'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                      achievement.unlockedAt 
                        ? '' 
                        : 'bg-gray-700'
                    }`}
                    style={{ 
                      backgroundColor: achievement.unlockedAt 
                        ? getTierColor(achievement.tier) + '20' 
                        : '#374151' 
                    }}
                    >
                      <Ionicons 
                        name={achievement.icon as any} 
                        size={24} 
                        color={achievement.unlockedAt ? getTierColor(achievement.tier) : '#6b7280'} 
                      />
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text 
                          className={`font-semibold text-base ${
                            achievement.unlockedAt ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          {achievement.title}
                        </Text>
                        {achievement.unlockedAt && (
                          <View className="flex-row items-center">
                            <Ionicons 
                              name={getTierIcon(achievement.tier)} 
                              size={16} 
                              color={getTierColor(achievement.tier)} 
                            />
                          </View>
                        )}
                      </View>
                      
                      <Text 
                        className={`text-sm mb-2 ${
                          achievement.unlockedAt ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      >
                        {achievement.description}
                      </Text>
                      
                      {achievement.unlockedAt ? (
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                          <Text className="text-fuel-full text-xs ml-1">
                            Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      ) : (
                        <View>
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-gray-400 text-xs">
                              Progress
                            </Text>
                            <Text className="text-gray-400 text-xs">
                              {formatProgress(
                                achievement.progress.current, 
                                achievement.progress.target
                              )}
                            </Text>
                          </View>
                          <View className="h-2 bg-gray-700 rounded-full">
                            <View 
                              className="h-2 bg-fuel-medium rounded-full"
                              style={{ width: `${achievement.progress.percentage}%` }}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '@/stores';
import { storageUtils } from '@/stores/persistence';
import SkeletonLoader from '@/components/SkeletonLoader';
import LoadingOverlay from '@/components/LoadingOverlay';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function SettingsScreen() {
  const { 
    settings, 
    updateSettings, 
    clearAllNotifications,
    notifications,
    isLoading,
    error
  } = useNotificationStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle global error state
  React.useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleToggleNotification = (key: keyof typeof settings, value: boolean) => {
    try {
      updateSettings({ [key]: value });
    } catch (err) {
      setLocalError('Failed to update settings. Please try again.');
      console.error('Settings update error:', err);
    }
  };

  const handleClearNotifications = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            try {
              clearAllNotifications();
              Alert.alert('Success', 'Notifications cleared successfully');
            } catch (err) {
              setLocalError('Failed to clear notifications. Please try again.');
              console.error('Clear notifications error:', err);
            }
          }
        }
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL your data including expenses, salary, and settings. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await storageUtils.clearAll();
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              setLocalError('Failed to clear data. Please try again.');
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await storageUtils.exportData();
      // In a real app, you'd implement proper export functionality
      Alert.alert('Export Complete', `Exported ${Object.keys(data).length} data categories`);
    } catch (error) {
      setLocalError('Failed to export data. Please try again.');
      Alert.alert('Export Failed', 'Could not export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Skeleton components for loading states
  const renderSettingItemSkeleton = () => (
    <View className="bg-dark-card rounded-xl p-4 mb-3 border border-dark-border flex-row items-center">
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      
      <View className="flex-1 ml-4">
        <SkeletonLoader width="60%" height={18} />
        <View className="mt-1">
          <SkeletonLoader width="90%" height={14} />
        </View>
      </View>
      
      <SkeletonLoader width={40} height={24} borderRadius={12} />
    </View>
  );

  const renderAppInfoSkeleton = () => (
    <View className="bg-dark-card rounded-xl p-6 mb-4 border border-dark-border">
      <View className="items-center mb-4">
        <SkeletonLoader width={48} height={48} borderRadius={24} />
        <View className="mt-2">
          <SkeletonLoader width={120} height={24} />
        </View>
        <View className="mt-1">
          <SkeletonLoader width={80} height={16} />
        </View>
      </View>
      
      <View className="mt-4">
        <SkeletonLoader width="100%" height={14} />
        <View className="mt-2">
          <SkeletonLoader width="90%" height={14} />
          <View className="mt-2">
            <SkeletonLoader width="95%" height={14} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderFeatureStatusSkeleton = () => (
    <View className="bg-dark-card rounded-xl p-4 mb-8 border border-dark-border">
      <SkeletonLoader width={100} height={20} />
      
      <View className="mt-3">
        {[1, 2, 3].map((item) => (
          <View key={item} className="flex-row items-center justify-between mb-2">
            <SkeletonLoader width={120} height={16} />
            <SkeletonLoader width={60} height={20} borderRadius={10} />
          </View>
        ))}
      </View>
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
        <TouchableOpacity 
          className="mt-2 self-start"
          onPress={() => setLocalError(null)}
        >
          <Text className="text-green-400 text-sm font-medium">Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const SettingItem = ({ 
    title, 
    description, 
    icon, 
    value, 
    onValueChange,
    type = 'switch',
    onPress
  }: {
    title: string;
    description?: string;
    icon: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    type?: 'switch' | 'button';
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      className="bg-dark-card rounded-xl p-4 mb-3 border border-dark-border flex-row items-center"
      onPress={type === 'button' ? onPress : undefined}
      disabled={type === 'switch'}
    >
      <View className="w-10 h-10 rounded-full bg-fuel-full/20 items-center justify-center mr-4">
        <Ionicons name={icon as any} size={20} color="#22c55e" />
      </View>
      
      <View className="flex-1">
        <Text className="text-white font-semibold text-base">{title}</Text>
        {description && (
          <Text className="text-gray-400 text-sm mt-1">{description}</Text>
        )}
      </View>
      
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#374151', true: '#22c55e' }}
          thumbColor={value ? '#ffffff' : '#6b7280'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      )}
    </TouchableOpacity>
  );

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-dark-bg">
        {isLoading && <LoadingOverlay message="Loading settings..." />}
        {isExporting && <LoadingOverlay message="Exporting data..." />}
        
        <ScrollView 
          className="flex-1 p-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Error display */}
          {renderError()}
          
          {/* Notifications Section */}
          <Text className="text-white text-xl font-bold mb-4">Notifications</Text>
          
          {isLoading ? (
            [1, 2, 3, 4, 5].map((item) => (
              <View key={item}>
                {renderSettingItemSkeleton()}
              </View>
            ))
          ) : (
            <>
              <SettingItem
                title="Fuel Alerts"
                description="Get notified when fuel is running low"
                icon="speedometer-outline"
                value={settings.fuelAlerts}
                onValueChange={(value) => handleToggleNotification('fuelAlerts', value)}
              />
              
              <SettingItem
                title="Big Spend Alerts"
                description="Alert when large expenses affect days remaining"
                icon="warning-outline"
                value={settings.bigSpendAlerts}
                onValueChange={(value) => handleToggleNotification('bigSpendAlerts', value)}
              />
              
              <SettingItem
                title="Achievement Alerts"
                description="Celebrate your financial milestones"
                icon="trophy-outline"
                value={settings.achievementAlerts}
                onValueChange={(value) => handleToggleNotification('achievementAlerts', value)}
              />
              
              <SettingItem
                title="Bill Reminders"
                description="Remind me when bills are due"
                icon="calendar-outline"
                value={settings.billReminders}
                onValueChange={(value) => handleToggleNotification('billReminders', value)}
              />
              
              <SettingItem
                title="Daily Reminders"
                description="Daily spending check-ins"
                icon="time-outline"
                value={settings.dailyReminders}
                onValueChange={(value) => handleToggleNotification('dailyReminders', value)}
              />
            </>
          )}

          {/* App Settings Section */}
          <Text className="text-white text-xl font-bold mb-4 mt-8">App Settings</Text>
          
          {isLoading ? renderSettingItemSkeleton() : (
            <>
              <SettingItem
                title="Sound Notifications"
                description="Play sounds for alerts"
                icon="volume-high-outline"
                value={settings.soundEnabled}
                onValueChange={(value) => handleToggleNotification('soundEnabled', value)}
              />
              
              <SettingItem
                title="Vibrations"
                description="Vibrate on notifications"
                icon="phone-portrait-outline"
                value={settings.vibrationEnabled}
                onValueChange={(value) => handleToggleNotification('vibrationEnabled', value)}
              />
            </>
          )}

          {/* Data Management Section */}
          <Text className="text-white text-xl font-bold mb-4 mt-8">Data Management</Text>
          
          {isLoading ? (
            <>
              {renderSettingItemSkeleton()}
              {renderSettingItemSkeleton()}
              {renderSettingItemSkeleton()}
            </>
          ) : (
            <>
              <SettingItem
                title="Clear Notifications"
                description={`Clear ${notifications.length} notifications`}
                icon="trash-outline"
                type="button"
                onPress={handleClearNotifications}
              />
              
              <SettingItem
                title="Export Data"
                description="Backup your financial data"
                icon="download-outline"
                type="button"
                onPress={handleExportData}
              />
              
              <SettingItem
                title="Clear All Data"
                description="Delete all app data permanently"
                icon="nuclear-outline"
                type="button"
                onPress={handleClearAllData}
              />
            </>
          )}

          {/* App Info Section */}
          <Text className="text-white text-xl font-bold mb-4 mt-8">About</Text>
          
          {isLoading ? renderAppInfoSkeleton() : (
            <View className="bg-dark-card rounded-xl p-6 mb-4 border border-dark-border">
              <View className="items-center mb-4">
                <Text className="text-fuel-full text-4xl mb-2">⛽</Text>
                <Text className="text-white text-xl font-bold">Fuel Tracker</Text>
                <Text className="text-gray-400 text-sm">Version 1.0.0</Text>
              </View>
              
              <Text className="text-gray-300 text-center text-sm leading-5">
                Transform your financial management into an engaging fuel tracking experience. 
                Monitor your spending, track your "fuel" levels, and get smart suggestions 
                to optimize your finances.
              </Text>
            </View>
          )}

          {/* Feature Status */}
          {isLoading ? renderFeatureStatusSkeleton() : (
            <View className="bg-dark-card rounded-xl p-4 mb-8 border border-dark-border">
              <Text className="text-white font-semibold mb-3">Features Status</Text>
              
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-400">Expense Tracking</Text>
                <View className="bg-fuel-full rounded-full px-3 py-1">
                  <Text className="text-white text-xs font-medium">Active</Text>
                </View>
              </View>
              
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-400">Smart Suggestions</Text>
                <View className="bg-fuel-medium rounded-full px-3 py-1">
                  <Text className="text-white text-xs font-medium">Beta</Text>
                </View>
              </View>
              
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-400">AI Integration</Text>
                <View className="bg-gray-600 rounded-full px-3 py-1">
                  <Text className="text-white text-xs font-medium">Coming Soon</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
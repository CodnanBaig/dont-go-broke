import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useNotificationStore } from '@/stores';
import NotificationHandler from '@/components/NotificationHandler';

export default function TabLayout() {
  const { unreadCount } = useNotificationStore();

  return (
    <>
      <NotificationHandler />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            backgroundColor: '#111827',
            borderTopColor: '#374151',
            borderTopWidth: 1,
            paddingBottom: 4,
            paddingTop: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: '#111827',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#374151',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            headerTitle: '⛽ Fuel Dashboard',
            tabBarIcon: ({ color, size }) => (
              <View className="items-center justify-center">
                <Ionicons 
                  name="speedometer-outline" 
                  size={size} 
                  color={color} 
                  accessibilityLabel="Dashboard"
                />
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-fuel-low rounded-full w-4 h-4 items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: 'Expenses',
            headerTitle: '💰 Expenses',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name="receipt-outline" 
                size={size} 
                color={color} 
                accessibilityLabel="Expenses"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="salary"
          options={{
            title: 'Salary',
            headerTitle: '💼 Salary & Bills',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name="wallet-outline" 
                size={size} 
                color={color} 
                accessibilityLabel="Salary"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="achievements"
          options={{
            title: 'Achievements',
            headerTitle: '🏆 Achievements',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name="trophy-outline" 
                size={size} 
                color={color} 
                accessibilityLabel="Achievements"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerTitle: '⚙️ Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name="settings-outline" 
                size={size} 
                color={color} 
                accessibilityLabel="Settings"
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
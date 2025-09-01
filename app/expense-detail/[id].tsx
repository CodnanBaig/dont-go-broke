import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/stores';
import { CATEGORY_METADATA } from '@/types';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenses, deleteExpense } = useAppStore();
  
  const expense = expenses.find(e => e.id === id);

  if (!expense) {
    return (
      <SafeAreaView className="flex-1 bg-dark-bg items-center justify-center">
        <Text className="text-white text-lg">Expense not found</Text>
        <TouchableOpacity 
          className="mt-4 bg-fuel-full rounded-xl px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const categoryData = CATEGORY_METADATA[expense.category];

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteExpense(expense.id);
            router.back();
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/edit-expense/${expense.id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center justify-between p-4 border-b border-dark-border">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text className="text-white text-lg font-semibold">Expense Details</Text>
        
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 p-4">
        <View className="bg-dark-card rounded-2xl p-6 border border-dark-border">
          {/* Category Icon */}
          <View className="items-center mb-6">
            <View 
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: categoryData.color + '20' }}
            >
              <Ionicons 
                name={categoryData.icon as any} 
                size={40} 
                color={categoryData.color} 
              />
            </View>
            <Text className="text-gray-400 text-lg">{expense.category}</Text>
          </View>

          {/* Amount */}
          <View className="items-center mb-8">
            <Text className="text-fuel-low text-4xl font-bold">
              -₹{expense.amount.toLocaleString()}
            </Text>
          </View>

          {/* Details */}
          <View className="space-y-4">
            <View className="flex-row items-center justify-between py-3 border-b border-dark-border">
              <Text className="text-gray-400">Description</Text>
              <Text className="text-white font-medium">{expense.description}</Text>
            </View>
            
            <View className="flex-row items-center justify-between py-3 border-b border-dark-border">
              <Text className="text-gray-400">Date</Text>
              <Text className="text-white font-medium">
                {new Date(expense.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
            
            <View className="flex-row items-center justify-between py-3 border-b border-dark-border">
              <Text className="text-gray-400">Source</Text>
              <Text className="text-white font-medium capitalize">{expense.source}</Text>
            </View>
            
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-gray-400">Time</Text>
              <Text className="text-white font-medium">
                {new Date(expense.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="mt-6">
          <TouchableOpacity 
            className="bg-gray-700 rounded-xl py-4 mb-3"
            onPress={handleEdit}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Edit Expense
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-fuel-low rounded-xl py-4"
            onPress={handleDelete}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Delete Expense
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
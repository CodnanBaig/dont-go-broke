import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/stores';
import ExpenseForm from '@/components/ExpenseForm';

export default function AddExpenseScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { addExpense, currentBalance, fuelStatus } = useAppStore();

  const handleSave = async (formData: any) => {
    try {
      setIsLoading(true);
      
      // Validate amount doesn't exceed current balance
      const expenseAmount = parseFloat(formData.amount);
      if (expenseAmount > currentBalance) {
        Alert.alert(
          'Insufficient Funds', 
          `This expense (₹${expenseAmount.toLocaleString('en-IN')}) exceeds your current balance (₹${currentBalance.toLocaleString('en-IN')}). Are you sure you want to proceed?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsLoading(false) },
            { 
              text: 'Proceed', 
              onPress: () => {
                completeAddExpense(formData);
              }
            }
          ]
        );
        return;
      }
      
      completeAddExpense(formData);
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
      setIsLoading(false);
    }
  };
  
  const completeAddExpense = async (formData: any) => {
    try {
      const expenseAmount = parseFloat(formData.amount);
      
      addExpense({
        amount: expenseAmount,
        category: formData.category,
        description: formData.description.trim(),
        source: 'manual'
      });
      
      // Show success message with fuel impact
      const newBalance = currentBalance - expenseAmount;
      const fuelPercentage = (newBalance / (currentBalance + expenseAmount)) * 100;
      
      Alert.alert(
        'Expense Added!', 
        `₹${expenseAmount.toLocaleString('en-IN')} has been deducted from your account.\n\n` +
        `New balance: ₹${newBalance.toLocaleString('en-IN')}\n` +
        `Fuel level: ${Math.round(fuelPercentage)}%`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              setIsLoading(false);
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error completing expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center justify-between p-4 border-b border-dark-border">
        <TouchableOpacity 
          onPress={handleCancel}
          accessibilityLabel="Cancel and close"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <Text className="text-white text-lg font-semibold">Add Expense</Text>
        
        <View className="w-6" /> {/* Spacer for alignment */}
      </View>

      <ExpenseForm
        onSubmit={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}
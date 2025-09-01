import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/stores';
import ExpenseForm from '@/components/ExpenseForm';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const { expenses, updateExpense, currentBalance, fuelStatus } = useAppStore();

  // Load expense data
  useEffect(() => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      setInitialData({
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description,
        date: new Date(expense.createdAt)
      });
    } else {
      Alert.alert('Error', 'Expense not found', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [id]);

  const handleSave = async (formData: any) => {
    try {
      setIsLoading(true);
      
      // Validate amount doesn't exceed current balance (considering other expenses)
      const expenseAmount = parseFloat(formData.amount);
      const originalExpense = expenses.find(e => e.id === id);
      
      if (originalExpense) {
        // Calculate what the balance would be if we removed the original expense first
        const balanceWithoutOriginal = currentBalance + originalExpense.amount;
        
        if (expenseAmount > balanceWithoutOriginal) {
          Alert.alert(
            'Insufficient Funds', 
            `This expense (₹${expenseAmount.toLocaleString('en-IN')}) exceeds your available balance (₹${balanceWithoutOriginal.toLocaleString('en-IN')}). Are you sure you want to proceed?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setIsLoading(false) },
              { 
                text: 'Proceed', 
                onPress: () => {
                  completeEditExpense(formData);
                }
              }
            ]
          );
          return;
        }
      }
      
      completeEditExpense(formData);
    } catch (error) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', 'Failed to update expense. Please try again.');
      setIsLoading(false);
    }
  };
  
  const completeEditExpense = async (formData: any) => {
    try {
      const expenseAmount = parseFloat(formData.amount);
      
      updateExpense(id, {
        amount: expenseAmount,
        category: formData.category,
        description: formData.description.trim()
      });
      
      // Show success message
      Alert.alert('Success', 'Expense updated successfully!', [
        { 
          text: 'OK', 
          onPress: () => {
            setIsLoading(false);
            router.back();
          }
        }
      ]);
    } catch (error) {
      console.error('Error completing expense update:', error);
      Alert.alert('Error', 'Failed to update expense. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    router.back();
  };

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
            try {
              useAppStore.getState().deleteExpense(id);
              router.back();
              router.back(); // Go back twice to exit the edit flow
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (!initialData) {
    return (
      <SafeAreaView className="flex-1 bg-dark-bg items-center justify-center">
        <Text className="text-white text-lg">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center justify-between p-4 border-b border-dark-border">
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <Text className="text-white text-lg font-semibold">Edit Expense</Text>
        
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ExpenseForm
        initialData={initialData}
        onSubmit={handleSave}
        onCancel={handleCancel}
        isEditing={true}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}
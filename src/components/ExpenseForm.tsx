import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Keyboard
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CATEGORY_METADATA, ExpenseCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface ExpenseFormProps {
  initialData?: {
    amount?: string;
    category?: ExpenseCategory;
    description?: string;
  };
  onSubmit: (data: { amount: number; category: ExpenseCategory; description: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText = 'Add Expense'
}) => {
  const { triggerHaptic } = useHapticFeedback();
  
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category || ExpenseCategory.FOOD);
  const [description, setDescription] = useState(initialData?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData?.amount) setAmount(initialData.amount);
    if (initialData?.category) setCategory(initialData.category);
    if (initialData?.description) setDescription(initialData.description);
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate amount
    const amountValue = parseFloat(amount);
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amountValue > 1000000) {
      newErrors.amount = 'Amount seems too high. Please verify';
    }
    
    // Validate description
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    triggerHaptic('impactLight');
    
    if (!validateForm()) {
      triggerHaptic('notificationError');
      return;
    }
    
    const amountValue = parseFloat(amount);
    
    onSubmit({
      amount: amountValue,
      category,
      description: description.trim()
    });
    
    // Success haptic feedback
    triggerHaptic('notificationSuccess');
    
    // Dismiss keyboard
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    triggerHaptic('selection');
    onCancel();
    Keyboard.dismiss();
  };

  const handleAmountChange = (text: string) => {
    // Allow only numbers and decimal point
    if (text === '' || /^\d*\.?\d*$/.test(text)) {
      setAmount(text);
      if (errors.amount) {
        setErrors(prev => ({ ...prev, amount: '' }));
      }
    }
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  };

  const handleCategoryChange = (value: ExpenseCategory) => {
    triggerHaptic('selection');
    setCategory(value);
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg p-4">
      {/* Amount Input */}
      <View className="mb-6">
        <Text className="text-gray-300 text-sm font-medium mb-2">
          Amount *
        </Text>
        <View className="relative">
          <View className="absolute left-4 top-4 z-10">
            <Text className="text-gray-300 text-lg font-medium">₹</Text>
          </View>
          <TextInput
            className="bg-dark-card border border-dark-border rounded-xl p-4 text-white text-lg pl-10"
            placeholder="0.00"
            placeholderTextColor="#6b7280"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={handleAmountChange}
            editable={!isLoading}
            accessibilityLabel="Expense amount"
            accessibilityHint="Enter the amount for this expense"
          />
        </View>
        {errors.amount && (
          <Text className="text-red-400 text-xs mt-1 ml-1">
            {errors.amount}
          </Text>
        )}
      </View>

      {/* Category Picker */}
      <View className="mb-6">
        <Text className="text-gray-300 text-sm font-medium mb-2">
          Category *
        </Text>
        <View className="bg-dark-card border border-dark-border rounded-xl">
          <Picker
            selectedValue={category}
            onValueChange={handleCategoryChange}
            enabled={!isLoading}
            dropdownIconColor="#6b7280"
            style={{ color: 'white' }}
            accessibilityLabel="Expense category"
            accessibilityHint="Select a category for this expense"
          >
            {Object.values(ExpenseCategory).map((cat) => (
              <Picker.Item 
                key={cat} 
                label={cat} 
                value={cat} 
                color="white"
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Description Input */}
      <View className="mb-8">
        <Text className="text-gray-300 text-sm font-medium mb-2">
          Description *
        </Text>
        <TextInput
          className="bg-dark-card border border-dark-border rounded-xl p-4 text-white"
          placeholder="What did you spend on?"
          placeholderTextColor="#6b7280"
          value={description}
          onChangeText={handleDescriptionChange}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!isLoading}
          accessibilityLabel="Expense description"
          accessibilityHint="Enter a description for this expense"
        />
        {errors.description && (
          <Text className="text-red-400 text-xs mt-1 ml-1">
            {errors.description}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View className="flex-row space-x-3">
        <TouchableOpacity
          className="flex-1 bg-gray-600 rounded-xl py-4"
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text className="text-white text-center font-semibold">Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 rounded-xl py-4 ${
            isLoading 
              ? 'bg-fuel-medium opacity-50' 
              : 'bg-fuel-full'
          }`}
          onPress={handleSubmit}
          disabled={isLoading}
          style={({ pressed }) => ({
            backgroundColor: pressed && !isLoading ? '#16a34a' : isLoading ? '#f59e0b' : '#22c55e',
            transform: [{ scale: pressed && !isLoading ? 0.98 : 1 }],
          })}
        >
          {isLoading ? (
            <View className="flex-row items-center justify-center">
              <Ionicons name="refresh" size={20} color="white" className="mr-2" />
              <Text className="text-white text-center font-semibold">Processing...</Text>
            </View>
          ) : (
            <Text className="text-white text-center font-semibold">{submitButtonText}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ExpenseForm;

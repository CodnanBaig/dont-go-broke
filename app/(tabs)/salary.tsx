import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal,
  Pressable,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores';
import { RecurringBill } from '@/types';
import SkeletonLoader from '@/components/SkeletonLoader';
import LoadingOverlay from '@/components/LoadingOverlay';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function SalaryScreen() {
  const { 
    salary, 
    recurringBills, 
    setSalary, 
    addRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
    isLoading,
    error
  } = useAppStore();
  
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [salaryAmount, setSalaryAmount] = useState(salary?.amount?.toString() || '');
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billFrequency, setBillFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [billAutoDeduct, setBillAutoDeduct] = useState(true);
  const [billCategory, setBillCategory] = useState('Others');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle global error state
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  // Reset form when editing bill
  useEffect(() => {
    if (editingBill) {
      setBillName(editingBill.name);
      setBillAmount(editingBill.amount.toString());
      setBillFrequency(editingBill.frequency);
      setBillAutoDeduct(editingBill.autoDeduct);
      setBillCategory(editingBill.category);
    } else {
      setBillName('');
      setBillAmount('');
      setBillFrequency('monthly');
      setBillAutoDeduct(true);
      setBillCategory('Others');
    }
    setErrors({});
  }, [editingBill, showBillModal]);

  const validateSalaryForm = () => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(salaryAmount);
    
    if (!salaryAmount.trim()) {
      newErrors.salaryAmount = 'Salary amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.salaryAmount = 'Please enter a valid salary amount';
    } else if (amount > 10000000) {
      newErrors.salaryAmount = 'Salary seems too high. Please verify';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBillForm = () => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(billAmount);
    
    if (!billName.trim()) {
      newErrors.billName = 'Bill name is required';
    } else if (billName.trim().length < 2) {
      newErrors.billName = 'Bill name must be at least 2 characters';
    }
    
    if (!billAmount.trim()) {
      newErrors.billAmount = 'Bill amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.billAmount = 'Please enter a valid amount';
    } else if (amount > 1000000) {
      newErrors.billAmount = 'Amount seems too high. Please verify';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSalarySave = () => {
    if (!validateSalaryForm()) {
      return;
    }
    
    const amount = parseFloat(salaryAmount);
    setSalary(amount);
    setShowSalaryModal(false);
    Alert.alert('Success', '🚀 Wallet recharged successfully!');
  };

  const handleBillSave = () => {
    if (!validateBillForm()) {
      return;
    }

    const amount = parseFloat(billAmount);
    const nextDueDate = new Date();
    
    // Set next due date based on frequency
    switch (billFrequency) {
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case 'yearly':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        break;
      case 'monthly':
      default:
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
    }

    if (editingBill) {
      // Update existing bill
      updateRecurringBill(editingBill.id, {
        name: billName.trim(),
        amount,
        frequency: billFrequency,
        nextDueDate,
        category: billCategory as any,
        autoDeduct: billAutoDeduct
      });
      Alert.alert('Success', 'Recurring bill updated successfully!');
    } else {
      // Add new bill
      addRecurringBill({
        name: billName.trim(),
        amount,
        frequency: billFrequency,
        nextDueDate,
        category: billCategory as any,
        autoDeduct: billAutoDeduct
      });
      Alert.alert('Success', 'Recurring bill added successfully!');
    }

    setEditingBill(null);
    setShowBillModal(false);
  };

  const handleEditBill = (bill: RecurringBill) => {
    setEditingBill(bill);
    setShowBillModal(true);
  };

  const handleDeleteBill = (billId: string, billName: string) => {
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete "${billName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteRecurringBill(billId)
        }
      ]
    );
  };

  const totalRecurringAmount = recurringBills
    .filter(bill => bill.isActive)
    .reduce((sum, bill) => sum + bill.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNextDueDate = (date: Date) => {
    const today = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    return dueDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const formatSalaryFrequency = (frequency: 'monthly' | 'weekly' | 'biweekly') => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      default: return 'Monthly';
    }
  };

  const calculateDaysUntilNextSalary = (nextSalaryDate: Date) => {
    const today = new Date();
    const nextSalary = new Date(nextSalaryDate);
    const diffTime = nextSalary.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSalaryCycleProgress = (lastUpdated: Date, nextSalaryDate: Date) => {
    const now = new Date();
    const start = new Date(lastUpdated);
    const end = new Date(nextSalaryDate);
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    if (totalDuration <= 0) return 0;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  // Skeleton components for loading states
  const renderSalarySkeleton = () => (
    <View className="p-4">
      <View className="bg-dark-card rounded-2xl p-6 mb-4 border border-dark-border">
        <View className="flex-row items-center justify-between mb-4">
          <SkeletonLoader width={160} height={24} />
          <SkeletonLoader width={32} height={32} borderRadius={16} />
        </View>
        
        <View className="mb-4">
          <SkeletonLoader width={120} height={36} />
        </View>
        
        <View className="mb-3">
          <SkeletonLoader width="100%" height={16} />
        </View>
        
        <View className="flex-row justify-between mt-4">
          {[1, 2, 3].map((item) => (
            <View key={item} className="flex-1 mx-1">
              <SkeletonLoader width="100%" height={14} />
              <View className="mt-1">
                <SkeletonLoader width="80%" height={16} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderBillsSkeleton = () => (
    <View className="px-4 pb-4">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <SkeletonLoader width={180} height={24} />
          <View className="mt-1">
            <SkeletonLoader width={120} height={16} />
          </View>
        </View>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
      </View>

      {[1, 2, 3].map((item) => (
        <View
          key={item}
          className="bg-dark-card rounded-xl p-4 mb-3 border border-dark-border"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <SkeletonLoader width={120} height={20} />
              <View className="mt-1">
                <SkeletonLoader width={80} height={20} />
              </View>
              <View className="flex-row items-center mt-2">
                <SkeletonLoader width={100} height={14} />
                <View className="mx-2">
                  <SkeletonLoader width={4} height={4} borderRadius={2} />
                </View>
                <SkeletonLoader width={60} height={14} />
              </View>
            </View>
            
            <View className="flex-row items-center">
              <SkeletonLoader width={60} height={24} borderRadius={12} />
              <View className="flex-row ml-2">
                <SkeletonLoader width={20} height={20} borderRadius={10} />
                <View className="ml-2">
                  <SkeletonLoader width={20} height={20} borderRadius={10} />
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
          onPress={() => setLocalError(null)}
        >
          <Text className="text-green-400 text-sm font-medium">Dismiss</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-dark-bg">
        {isLoading && <LoadingOverlay message="Loading salary data..." />}
        
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          {/* Error display */}
          {renderError()}
          
          {/* Header */}
          <View className="p-4 pb-2">
            <Text className="text-white text-2xl font-bold">Salary & Bills</Text>
            <Text className="text-gray-400 text-sm">
              Manage your income and recurring expenses
            </Text>
          </View>

          {/* Salary Section */}
          {isLoading ? renderSalarySkeleton() : (
            <View className="p-4">
              <View className="bg-dark-card rounded-2xl p-6 mb-4 border border-dark-border">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">Monthly Salary</Text>
                  <TouchableOpacity
                    className="bg-fuel-full rounded-full w-8 h-8 items-center justify-center"
                    onPress={() => setShowSalaryModal(true)}
                  >
                    <Ionicons name="pencil" size={16} color="white" />
                  </TouchableOpacity>
                </View>
                
                {salary ? (
                  <>
                    <Text className="text-fuel-full text-3xl font-bold mb-2">
                      {formatCurrency(salary.amount)}
                    </Text>
                    <Text className="text-gray-400 text-sm mb-1">
                      Last updated: {new Date(salary.lastUpdated).toLocaleDateString('en-IN')}
                    </Text>
                    <Text className="text-gray-400 text-sm mb-3">
                      Next salary: {new Date(salary.nextSalaryDate).toLocaleDateString('en-IN')}
                    </Text>
                    
                    {/* Salary Cycle Progress */}
                    <View className="mb-3">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-400 text-xs">Salary Cycle Progress</Text>
                        <Text className="text-gray-400 text-xs">
                          {Math.round(getSalaryCycleProgress(salary.lastUpdated, salary.nextSalaryDate))}%
                        </Text>
                      </View>
                      <View className="h-2 bg-gray-700 rounded-full">
                        <View 
                          className="h-2 bg-fuel-full rounded-full"
                          style={{ width: `${getSalaryCycleProgress(salary.lastUpdated, salary.nextSalaryDate)}%` }}
                        />
                      </View>
                    </View>
                    
                    {/* Salary Cycle Info */}
                    <View className="flex-row justify-between mt-2">
                      <View>
                        <Text className="text-gray-400 text-xs">Frequency</Text>
                        <Text className="text-white text-sm">{formatSalaryFrequency(salary.frequency)}</Text>
                      </View>
                      <View>
                        <Text className="text-gray-400 text-xs">Next in</Text>
                        <Text className="text-white text-sm">
                          {calculateDaysUntilNextSalary(salary.nextSalaryDate)} days
                        </Text>
                      </View>
                      <View>
                        <Text className="text-gray-400 text-xs">Bills Deducted</Text>
                        <Text className="text-white text-sm">
                          {formatCurrency(salary.recurringBillsDeducted)}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text className="text-gray-400 text-lg mb-4">
                      No salary set
                    </Text>
                    <TouchableOpacity
                      className="bg-fuel-full rounded-xl py-3 px-6"
                      onPress={() => setShowSalaryModal(true)}
                    >
                      <Text className="text-white font-semibold text-center">
                        Set Your Salary
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Recurring Bills Section */}
          {isLoading ? renderBillsSkeleton() : (
            <View className="px-4 pb-4">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-white text-xl font-bold">Recurring Bills</Text>
                  <Text className="text-gray-400 text-sm">
                    Total: {formatCurrency(totalRecurringAmount)}/month
                  </Text>
                </View>
                
                <TouchableOpacity
                  className="bg-fuel-medium rounded-full w-10 h-10 items-center justify-center"
                  onPress={() => {
                    setEditingBill(null);
                    setShowBillModal(true);
                  }}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>

              {recurringBills.length > 0 ? (
                recurringBills.map((bill) => (
                  <View
                    key={bill.id}
                    className="bg-dark-card rounded-xl p-4 mb-3 border border-dark-border"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-lg">
                          {bill.name}
                        </Text>
                        <Text className="text-fuel-medium text-lg font-bold">
                          {formatCurrency(bill.amount)}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Text className="text-gray-400 text-sm">
                            Due: {formatNextDueDate(bill.nextDueDate)}
                          </Text>
                          <View className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
                          <Text className="text-gray-400 text-sm capitalize">
                            {bill.frequency}
                          </Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center">
                        <View className={`rounded-full px-2 py-1 mr-2 ${bill.autoDeduct ? 'bg-fuel-full' : 'bg-gray-600'}`}>
                          <Text className="text-white text-xs font-medium">
                            {bill.autoDeduct ? 'Auto' : 'Manual'}
                          </Text>
                        </View>
                        
                        <View className="flex-row">
                          <TouchableOpacity
                            className="mr-2"
                            onPress={() => handleEditBill(bill)}
                          >
                            <Ionicons name="pencil" size={20} color="#6b7280" />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => handleDeleteBill(bill.id, bill.name)}
                          >
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View className="bg-dark-card rounded-xl p-6 border border-dark-border items-center">
                  <Ionicons name="receipt-outline" size={48} color="#6b7280" />
                  <Text className="text-gray-400 text-lg text-center mt-4">
                    No recurring bills
                  </Text>
                  <Text className="text-gray-500 text-sm text-center mt-2">
                    Add bills like rent, EMI, subscriptions
                  </Text>
                  <TouchableOpacity
                    className="bg-fuel-medium rounded-xl py-3 px-6 mt-4"
                    onPress={() => {
                      setEditingBill(null);
                      setShowBillModal(true);
                    }}
                  >
                    <Text className="text-white font-semibold text-center">
                      Add First Bill
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Salary Modal */}
        <Modal
          visible={showSalaryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSalaryModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-dark-card rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">
                  Set Monthly Salary
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSalaryModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <View className="mb-6">
                <Text className="text-gray-300 text-sm font-medium mb-2">
                  Monthly Salary Amount
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-4 z-10">
                    <Text className="text-gray-300 text-lg font-medium">₹</Text>
                  </View>
                  <TextInput
                    className="bg-dark-bg border border-dark-border rounded-xl p-4 text-white text-lg pl-10"
                    placeholder="0.00"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    value={salaryAmount}
                    onChangeText={(text) => {
                      setSalaryAmount(text);
                      if (errors.salaryAmount) {
                        setErrors(prev => ({ ...prev, salaryAmount: '' }));
                      }
                    }}
                    autoFocus
                  />
                </View>
                {errors.salaryAmount && (
                  <Text className="text-red-400 text-xs mt-1 ml-1">
                    {errors.salaryAmount}
                  </Text>
                )}
              </View>
              
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  className="flex-1 bg-gray-600 rounded-xl py-4"
                  onPress={() => setShowSalaryModal(false)}
                >
                  <Text className="text-white text-center font-semibold">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 bg-fuel-full rounded-xl py-4"
                  onPress={handleSalarySave}
                >
                  <Text className="text-white text-center font-semibold">Save Salary</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add/Edit Bill Modal */}
        <Modal
          visible={showBillModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowBillModal(false);
            setEditingBill(null);
          }}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-dark-card rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">
                  {editingBill ? 'Edit Recurring Bill' : 'Add Recurring Bill'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowBillModal(false);
                    setEditingBill(null);
                  }}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Bill Name */}
                <View className="mb-4">
                  <Text className="text-gray-300 text-sm font-medium mb-2">
                    Bill Name *
                  </Text>
                  <TextInput
                    className="bg-dark-bg border border-dark-border rounded-xl p-4 text-white text-lg"
                    placeholder="e.g., Rent, Netflix, Electricity"
                    placeholderTextColor="#6b7280"
                    value={billName}
                    onChangeText={(text) => {
                      setBillName(text);
                      if (errors.billName) {
                        setErrors(prev => ({ ...prev, billName: '' }));
                      }
                    }}
                  />
                  {errors.billName && (
                    <Text className="text-red-400 text-xs mt-1 ml-1">
                      {errors.billName}
                    </Text>
                  )}
                </View>
                
                {/* Bill Amount */}
                <View className="mb-4">
                  <Text className="text-gray-300 text-sm font-medium mb-2">
                    Amount *
                  </Text>
                  <View className="relative">
                    <View className="absolute left-4 top-4 z-10">
                      <Text className="text-gray-300 text-lg font-medium">₹</Text>
                    </View>
                    <TextInput
                      className="bg-dark-bg border border-dark-border rounded-xl p-4 text-white text-lg pl-10"
                      placeholder="0.00"
                      placeholderTextColor="#6b7280"
                      keyboardType="numeric"
                      value={billAmount}
                      onChangeText={(text) => {
                        setBillAmount(text);
                        if (errors.billAmount) {
                          setErrors(prev => ({ ...prev, billAmount: '' }));
                        }
                      }}
                    />
                  </View>
                  {errors.billAmount && (
                    <Text className="text-red-400 text-xs mt-1 ml-1">
                      {errors.billAmount}
                    </Text>
                  )}
                </View>
                
                {/* Frequency */}
                <View className="mb-4">
                  <Text className="text-gray-300 text-sm font-medium mb-2">
                    Frequency
                  </Text>
                  <View className="flex-row bg-dark-bg border border-dark-border rounded-xl p-2">
                    {(['monthly', 'weekly', 'yearly'] as const).map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        className={`flex-1 py-3 rounded-lg mx-1 ${
                          billFrequency === freq ? 'bg-fuel-full' : ''
                        }`}
                        onPress={() => setBillFrequency(freq)}
                      >
                        <Text 
                          className={`text-center text-sm font-medium ${
                            billFrequency === freq ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Auto Deduct */}
                <View className="mb-6">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-gray-300 text-sm font-medium">
                        Auto Deduct
                      </Text>
                      <Text className="text-gray-500 text-xs mt-1">
                        Automatically deduct from balance
                      </Text>
                    </View>
                    <Switch
                      trackColor={{ false: '#767577', true: '#22c55e' }}
                      thumbColor={billAutoDeduct ? '#f4f3f4' : '#f4f3f4'}
                      ios_backgroundColor="#3e3e3e"
                      onValueChange={setBillAutoDeduct}
                      value={billAutoDeduct}
                    />
                  </View>
                </View>
              </ScrollView>
              
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  className="flex-1 bg-gray-600 rounded-xl py-4"
                  onPress={() => {
                    setShowBillModal(false);
                    setEditingBill(null);
                  }}
                >
                  <Text className="text-white text-center font-semibold">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 bg-fuel-medium rounded-xl py-4"
                  onPress={handleBillSave}
                >
                  <Text className="text-white text-center font-semibold">
                    {editingBill ? 'Update Bill' : 'Add Bill'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
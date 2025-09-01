import { Platform } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Define haptic feedback types
type HapticType = 
  | 'selection' 
  | 'impactLight' 
  | 'impactMedium' 
  | 'impactHeavy' 
  | 'notificationSuccess' 
  | 'notificationWarning' 
  | 'notificationError';

// Haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Custom hook for haptic feedback
 * Provides consistent haptic feedback across iOS and Android
 */
export const useHapticFeedback = () => {
  /**
   * Trigger haptic feedback
   * @param type - Type of haptic feedback to trigger
   */
  const triggerHaptic = (type: HapticType) => {
    // Don't trigger haptics on web or if haptics are disabled
    if (Platform.OS === 'web') {
      return;
    }
    
    try {
      switch (type) {
        case 'selection':
          ReactNativeHapticFeedback.trigger('selection', hapticOptions);
          break;
        case 'impactLight':
          ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
          break;
        case 'impactMedium':
          ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
          break;
        case 'impactHeavy':
          ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
          break;
        case 'notificationSuccess':
          ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
          break;
        case 'notificationWarning':
          ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);
          break;
        case 'notificationError':
          ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
          break;
        default:
          ReactNativeHapticFeedback.trigger('selection', hapticOptions);
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  };

  /**
   * Trigger selection haptic feedback
   */
  const selection = () => {
    triggerHaptic('selection');
  };

  /**
   * Trigger impact haptic feedback
   * @param intensity - Intensity of the impact ('light', 'medium', 'heavy')
   */
  const impact = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    switch (intensity) {
      case 'light':
        triggerHaptic('impactLight');
        break;
      case 'medium':
        triggerHaptic('impactMedium');
        break;
      case 'heavy':
        triggerHaptic('impactHeavy');
        break;
    }
  };

  /**
   * Trigger notification haptic feedback
   * @param type - Type of notification ('success', 'warning', 'error')
   */
  const notification = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        triggerHaptic('notificationSuccess');
        break;
      case 'warning':
        triggerHaptic('notificationWarning');
        break;
      case 'error':
        triggerHaptic('notificationError');
        break;
    }
  };

  return {
    triggerHaptic,
    selection,
    impact,
    notification,
  };
};
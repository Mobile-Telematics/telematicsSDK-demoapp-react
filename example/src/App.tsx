import React, { useEffect, useState } from 'react';

import {
  Alert,
  LogBox,
  NativeEventEmitter,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import TelematicsSdk from 'react-native-telematics';
import { Button, Input } from './components';
import { ClearButton } from './components/ClearButton';

LogBox.ignoreLogs(['new NativeEventEmitter()']);

export default function App() {
  const [deviceToken, setDeviceToken] = useState('');
  const [sdkStatus, setSdkStatus] = useState(false);
  const [sdkTag, setSdkTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPermissionsGranted, setIsPermissionsGranted] = useState(false);

  useEffect(() => {
    TelematicsSdk.initialize();
    const checkPermissions = async () => {
      const isGranted = await TelematicsSdk.requestPermissions();
      setIsPermissionsGranted(isGranted);
    };
    checkPermissions();
    updateSdkStatus();
    getToken();

    // iOS only: Low power mode event
    // For React Native 0.75+, use NativeEventEmitter without argument
    const eventEmitter = new NativeEventEmitter();
    const emitter = eventEmitter.addListener('onLowPowerModeEnabled', () => {
      console.log('Low power enabled');
    });

    return () => {
      emitter.remove();
    };
  }, []);

  const showErrorAlert = (error: any) => {
    console.log(error);
    Alert.alert(
      '⚠️ Error',
      error.message || 'An error occurred while performing the operation',
      [{ text: 'OK', style: 'default' }],
      { cancelable: true }
    );
  };

  const clearSdkTag = () => setSdkTag('');

  // methods
  const getToken = async () => {
    const token = await TelematicsSdk.getDeviceToken();
    setDeviceToken(token);
  };

  const requestPermissions = async () => {
    const isGranted = await TelematicsSdk.requestPermissions();
  };

  const updateSdkStatus = async () => {
    try {
      const isEnabled = await TelematicsSdk.getStatus();
      setSdkStatus(isEnabled);
    } catch (error: any) {
      console.log(error);
    }
  };

  const enableSDK = async () => {
    console.log('=== Enabling SDK ===');
    console.log('Device token length:', deviceToken.length);
    console.log('Device token (first 20 chars):', deviceToken.substring(0, 20));
    
      if (!deviceToken || deviceToken.trim() === '') {
        Alert.alert('⚠️ Token required', 'Please enter device token to enable the SDK', [{ text: 'OK', style: 'default' }]);
        return;
      }

    setIsLoading(true);
    
    try {
      console.log('Checking permissions...');
      const hasPermissions = await TelematicsSdk.requestPermissions();
      console.log('Permissions granted:', hasPermissions);
      
      if (!hasPermissions) {
        setIsLoading(false);
        Alert.alert('⚠️ Permissions missing', 'Please grant all required permissions in Settings.', [
          { text: 'OK', style: 'default' },
          { text: 'Request again', onPress: requestPermissions, style: 'default' },
        ]);
        return;
      }

      console.log('Checking SDK status...');
      const currentStatus = await TelematicsSdk.getStatus();
      console.log('Current SDK status:', currentStatus);

      console.log('Calling TelematicsSdk.enable()...');
      const startTime = Date.now();
      
      const isEnabled = await TelematicsSdk.enable(deviceToken.trim());
      
      const duration = Date.now() - startTime;
      console.log(`Enable SDK completed in ${duration}ms`);
      console.log('SDK enabled result:', isEnabled);
      
      setIsLoading(false);
      
      if (!isEnabled) {
        console.log('Error during enabling process');
        Alert.alert('❌ Enable failed', 'Failed to enable SDK. Please check your token and permissions.', [{ text: 'OK', style: 'default' }]);
        return;
      }
      
      console.log('SDK enabled successfully!');
      await updateSdkStatus();
      Alert.alert('✅ Success', 'SDK enabled successfully. You can use telematics features now.', [{ text: 'Great', style: 'default' }]);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Enable SDK error:', error);
      showErrorAlert(error);
    }
  };

  const disableSDK = async () => {
    console.log('Disabling SDK');
    await TelematicsSdk.disable();
    setDeviceToken('');
    updateSdkStatus();
  };

  const setTag = async () => {
    try {
      const result = await TelematicsSdk.addFutureTrackTag('Some', 'Some');
      setSdkTag(JSON.stringify(result));
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const getTags = async () => {
    try {
      const result = await TelematicsSdk.getFutureTrackTags();
      setSdkTag(JSON.stringify(result));
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const removeAllTags = async () => {
    try {
      const result = await TelematicsSdk.removeAllFutureTrackTags();
      setSdkTag(JSON.stringify(result));
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const removeTag = async () => {
    try {
      const result = await TelematicsSdk.removeFutureTrackTag('Some');
      setSdkTag(JSON.stringify(result));
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const startPersistentTracking = async () => {
    try {
      const result = await TelematicsSdk.startPersistentTracking();
      !!result && setSdkTag(JSON.stringify(result));
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
    <SafeAreaView style={styles.container}>
      {sdkTag === '' ? <View /> : <ClearButton onPress={clearSdkTag} />}
      <Input
        placeholder={'Your device token'}
        value={deviceToken}
        onChangeText={setDeviceToken}
      />
      <Text style={styles.tagText}>{sdkTag}</Text>
      <View>
          <Button 
            text="Enable SDK" 
            onPress={enableSDK} 
            variant="success"
            disabled={isLoading}
          />
        <Button text="Add test tag" onPress={setTag} variant="secondary" />
        <Button text="Get all tags" onPress={getTags} variant="primary" />
        <Button text="Remove test tag" onPress={removeTag} variant="secondary" />
        <Button text="Remove all tags" onPress={removeAllTags} variant="secondary" />
        <Button text="Disable SDK" onPress={disableSDK} variant="danger" />
        <Button
          text="Start persistent tracking"
          onPress={startPersistentTracking}
          variant="primary"
        />
      </View>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    backgroundColor: '#F0F8FF',
    paddingVertical: 20,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
    textAlign: 'center',
  },
  status: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  value: {
    fontWeight: '700',
  },
  tagText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  loadingContainer: {
    marginHorizontal: 20,
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

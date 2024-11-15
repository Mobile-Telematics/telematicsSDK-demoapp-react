import React, { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  LogBox,
  NativeEventEmitter,
  SafeAreaView,
  StyleSheet,
  Text,
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

  useEffect(() => {
    TelematicsSdk.initialize();
    requestPermissions();
    updateSdkStatus();
    getToken();

    const eventEmitter = new NativeEventEmitter(TelematicsSdk);
    const emitter = eventEmitter.addListener('onLowPowerModeEnabled', () => {
      console.log('Low power enabled');
    });

    return () => {
      emitter.remove();
    };
  }, []);

  const showErrorAlert = (error: any) => {
    console.log(error);
    Alert.alert('Error', error.message, [{ text: 'OK' }]);
  };

  const clearSdkTag = () => setSdkTag('');

  // methods
  const getToken = async () => {
    const token = await TelematicsSdk.getDeviceToken();
    setDeviceToken(token);
  };

  const requestPermissions = async () => {
    try {
      const isGranted = await TelematicsSdk.requestPermissions();
      if (isGranted) console.log('All permissions granted');
    } catch (error: any) {
      showErrorAlert(error);
    }
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
    console.log('Enabling SDK');
    try {
      const isEnabled = await TelematicsSdk.enable(deviceToken);
      if (!isEnabled) {
        console.log('Error during enabling process');
        return;
      }
      updateSdkStatus();
    } catch (error: any) {
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

  const sdkStatusText = useMemo(() => {
    return `SDK Status: ${sdkStatus ? 'enabled' : 'disabled'}`;
  }, [sdkStatus]);

  return (
    <SafeAreaView style={styles.container}>
      {sdkTag === '' ? <View /> : <ClearButton onPress={clearSdkTag} />}
      <Text style={styles.status}>{sdkStatusText}</Text>
      <Input
        placeholder={'Your device token'}
        value={deviceToken}
        onChangeText={setDeviceToken}
      />
      <Text style={styles.tagText}>{sdkTag}</Text>
      <View>
        <Button text="Enable SDK" onPress={enableSDK} />
        <Button text="Add test tag" onPress={setTag} />
        <Button text="Get all tags" onPress={getTags} />
        <Button text="Remove test tag" onPress={removeTag} />
        <Button text="Remove all tags" onPress={removeAllTags} />
        <Button text="Disable SDK" onPress={disableSDK} />
        <Button
          text="Start persistent tracking"
          onPress={startPersistentTracking}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
  },
  status: {
    textAlign: 'center',
    fontSize: 20,
  },
  tagText: {
    textAlign: 'center',
  },
});

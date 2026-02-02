import React, { useEffect, useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Platform
} from 'react-native';

import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import TelematicsSdk, {
  AccidentDetectionSensitivity,
  ApiLanguage,
  addOnLowPowerModeListener,
  addOnLocationChangedListener,
  addOnTrackingStateChangedListener,
  addOnWrongAccuracyAuthorizationListener,
  addOnRtldColectedData,
  addOnSpeedViolationListener,
} from 'react-native-telematics';
import { Button, Input } from './components';
import { ClearButton } from './components/ClearButton';

export default function App() {
  const [deviceToken, setDeviceToken] = useState('');
  const [isSdkEnabled, setSdkStatus] = useState(false);
  const [sdkTag, setSdkTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPermissionsGranted, setIsPermissionsGranted] = useState(false);
  const [heartbeatReason, setHeartbeatReason] = useState('RN_Heartbeat_Test');
  const [accidentSensitivity, setAccidentSensitivity] = useState<AccidentDetectionSensitivity>(AccidentDetectionSensitivity.Normal);
  const [speedLimitKmH, setSpeedLimitKmH] = useState('80');
  const [speedLimitTimeout, setSpeedLimitTimeout] = useState('10');
  const [apiLanguage, setApiLanguage] = useState<ApiLanguage>(ApiLanguage.english);
  const [androidAutoStartEnable, setAndroidAutoStartEnable] = useState(true);
  const [androidAutoStartPermanent, setAndroidAutoStartPermanent] = useState(true);
  const [iosDisableTracking, setIosDisableTracking] = useState(false);
  const [iosAggressiveHeartbeats, setIosAggressiveHeartbeats] = useState(false);


  useEffect(() => {
    TelematicsSdk.initialize;
    const checkPermissions = async () => {
      const isGranted = await TelematicsSdk.showPermissionWizard(false, false);
      setIsPermissionsGranted(isGranted);
    };
    checkPermissions();
    updateSdkStatus();
    getToken();

    const subs: Array<{ remove: () => void }> = [];
    if (Platform.OS === 'ios') {
      subs.push(
        addOnLowPowerModeListener(({ enabled }) => {
          setSdkTag(`onLowPowerMode: ${enabled}`);
        })
      );

      subs.push(
        addOnWrongAccuracyAuthorizationListener(() => {
          setSdkTag('onWrongAccuracyAuthorization');
        })
      );

      subs.push(
        addOnRtldColectedData(() => {
          setSdkTag('onRtldColectedData');
        })
      );
    }

    subs.push(
      addOnLocationChangedListener((e) => {
        setSdkTag(`onLocationChanged: ${e.latitude}, ${e.longitude}`);
      })
    );

    subs.push(
      addOnTrackingStateChangedListener((state) => {
        setSdkTag(`onTrackingStateChanged: ${state}`);
      })
    );

    subs.push(
      addOnSpeedViolationListener((e) => {
        setSdkTag(
          `onSpeedViolation: speed=${e.speed} limit=${e.speedLimit} @ ${e.latitude},${e.longitude}`
        );
      })
    );
    return () => {
      subs.forEach((s) => s.remove());
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
    const token = await TelematicsSdk.getDeviceId();
    setDeviceToken(token);
  };

  const updateSdkStatus = async () => {
    try {
      const isSdkEnabled = await TelematicsSdk.isSdkEnabled();
      setSdkStatus(isSdkEnabled);
    } catch (error: any) {
      console.log(error);
    }
  };

  const showPermissionWizard = async () => {
    await TelematicsSdk.showPermissionWizard(false, false);
  };

  const checkInitialized = async () => {
    try {
      const v = await TelematicsSdk.isInitialized();
      setSdkTag(`isInitialized: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const checkTracking = async () => {
    try {
      const v = await TelematicsSdk.isTracking();
      setSdkTag(`isTracking: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const uploadTrips = async () => {
    try {
      await TelematicsSdk.uploadUnsentTrips();
      setSdkTag('uploadUnsentTrips: OK');
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const getUnsentCount = async () => {
    try {
      const v = await TelematicsSdk.getUnsentTripCount();
      setSdkTag(`getUnsentTripCount: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const sendHeartbeat = async () => {
    try {
      await TelematicsSdk.sendCustomHeartbeats(heartbeatReason);
      setSdkTag(`sendCustomHeartbeats: ${heartbeatReason}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const setSensitivity = async (s: AccidentDetectionSensitivity) => {
    try {
      setAccidentSensitivity(s);
      await TelematicsSdk.setAccidentDetectionSensitivity(s);
      setSdkTag(`setAccidentDetectionSensitivity: ${AccidentDetectionSensitivity[s]}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const checkRtld = async () => {
    try {
      const v = await TelematicsSdk.isRTLDEnabled();
      setSdkTag(`isRTLDEnabled: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const enableAccidents = async (enable: boolean) => {
    try {
      await TelematicsSdk.enableAccidents(enable);
      const v = await TelematicsSdk.isEnabledAccidents();
      setSdkTag(`enableAccidents(${enable}) => isEnabledAccidents: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const registerSpeed = async () => {
    try {
      const kmh = Number(speedLimitKmH);
      const timeout = Number(speedLimitTimeout);
      await TelematicsSdk.registerSpeedViolations({
        speedLimitKmH: Number.isFinite(kmh) ? kmh : 80,
        speedLimitTimeout: Number.isFinite(timeout) ? timeout : 10,
      });
      setSdkTag(`registerSpeedViolations: ${speedLimitKmH} km/h, ${speedLimitTimeout}s`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const setApiLang = async (lang: ApiLanguage) => {
    try {
      setApiLanguage(lang);
      await TelematicsSdk.setApiLanguage(lang);
      const current = await TelematicsSdk.getApiLanguage();
      setSdkTag(`setApiLanguage: ${lang} => getApiLanguage: ${current}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const checkApiLang = async () => {
    try {
      const current = await TelematicsSdk.getApiLanguage();
      setSdkTag(`getApiLanguage: ${current}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const iosAggressiveHeartbeat = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('iOS only', 'This method is only available on iOS');
        return;
      }
      const v = await TelematicsSdk.isAggressiveHeartbeat();
      setSdkTag(`isAggressiveHeartbeat: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const iosSetAggressiveHeartbeats = async (enable: boolean) => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('iOS only', 'This method is only available on iOS');
        return;
      }
      setIosAggressiveHeartbeats(enable);
      await TelematicsSdk.setAggressiveHeartbeats(enable);
      setSdkTag(`setAggressiveHeartbeats: ${enable}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const iosSetDisableTracking = async (value: boolean) => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('iOS only', 'This method is only available on iOS');
        return;
      }
      setIosDisableTracking(value);
      await TelematicsSdk.setDisableTracking(value);
      setSdkTag(`setDisableTracking: ${value}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const iosCheckDisableTracking = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('iOS only', 'This method is only available on iOS');
        return;
      }
      const v = await TelematicsSdk.isDisableTracking();
      setSdkTag(`isDisableTracking: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const iosCheckWrongAccuracyState = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('iOS only', 'This method is only available on iOS');
        return;
      }
      const v = await TelematicsSdk.isWrongAccuracyState();
      setSdkTag(`isWrongAccuracyState: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const iosRequestAlwaysLocation = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('iOS only', 'This method is only available on iOS');
        return;
      }
      const v = await TelematicsSdk.requestIOSLocationAlwaysPermission();
      setSdkTag(`requestIOSLocationAlwaysPermission: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const iosRequestMotion = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('iOS only', 'This method is only available on iOS');
        return;
      }
      const v = await TelematicsSdk.requestIOSMotionPermission();
      setSdkTag(`requestIOSMotionPermission: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const androidSetAutoStart = async () => {
    try {
      if (Platform.OS !== 'android') {
        Alert.alert('Android only', 'This method is only available on Android');
        return;
      }
      await TelematicsSdk.setAndroidAutoStartEnabled({
        enable: androidAutoStartEnable,
        permanent: androidAutoStartPermanent,
      });
      const v = await TelematicsSdk.isAndroidAutoStartEnabled();
      setSdkTag(`setAndroidAutoStartEnabled => isAndroidAutoStartEnabled: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const androidCheckAutoStart = async () => {
    try {
      if (Platform.OS !== 'android') {
        Alert.alert('Android only', 'This method is only available on Android');
        return;
      }
      const v = await TelematicsSdk.isAndroidAutoStartEnabled();
      setSdkTag(`isAndroidAutoStartEnabled: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
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
      const isAllRequiredPermissionsAndSensorsGranted = await TelematicsSdk.isAllRequiredPermissionsAndSensorsGranted();
      console.log('Permissions granted:', isAllRequiredPermissionsAndSensorsGranted);

      if (!isAllRequiredPermissionsAndSensorsGranted) {
        setIsLoading(false);
        Alert.alert('⚠️ Permissions missing', 'Please grant all required permissions in Settings.', [
          { text: 'OK', style: 'default' },
          { text: 'Request again', onPress: showPermissionWizard, style: 'default' },
        ]);
        return;
      }

      console.log('Checking SDK status...');
      const isSdkEnabled = await TelematicsSdk.isSdkEnabled();
      console.log('SDK enabled:', isSdkEnabled);

      console.log('Calling TelematicsSdk.enable()...');
      const startTime = Date.now();

      await TelematicsSdk.setDeviceId(deviceToken.trim());
      await TelematicsSdk.setEnableSdk(true);

      if (Platform.OS === 'ios') {
        await TelematicsSdk.setDisableTracking(false);
      }

      const isEnabled = await TelematicsSdk.isSdkEnabled();

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

  const logout = async () => {
    console.log('Logout');
    await TelematicsSdk.logout();
    setDeviceToken('');
    updateSdkStatus();
  };

  const setTag = async () => {
    try {
      const result = await TelematicsSdk.addFutureTrackTag('RN_Demo_Tag', 'RN_Demo_Source');
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
      const result = await TelematicsSdk.removeFutureTrackTag('RN_Demo_Tag');
      setSdkTag(JSON.stringify(result));
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const startPersistentTracking = async () => {
    try {
      await TelematicsSdk.startManualPersistentTracking();
      setSdkTag('startManualPersistentTracking');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const startTracking = async () => {
    try {
      await TelematicsSdk.startManualTracking();
      setSdkTag('startManualTracking');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const stopTracking = async () => {
    try {
      await TelematicsSdk.stopManualTracking();
      setSdkTag('stopManualTracking');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  return (
    <SafeAreaProvider>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}
          >
            {sdkTag === '' ? <View /> : <ClearButton onPress={clearSdkTag} />}
            <Input
              placeholder={'Your device token'}
              value={deviceToken}
              onChangeText={setDeviceToken}
            />
            <Input
              placeholder={'Heartbeat reason'}
              value={heartbeatReason}
              onChangeText={setHeartbeatReason}
            />
            <Input
              placeholder={'Speed limit km/h (e.g. 80)'}
              value={speedLimitKmH}
              onChangeText={setSpeedLimitKmH}
            />
            <Input
              placeholder={'Speed limit timeout seconds (e.g. 10)'}
              value={speedLimitTimeout}
              onChangeText={setSpeedLimitTimeout}
            />
            <Text style={styles.tagText}>{sdkTag}</Text>
            <View>
              <Button text="Enable SDK" onPress={enableSDK} variant="success" disabled={isLoading} />
              <Button text="Add test tag" onPress={setTag} variant="secondary" />
              <Button text="Get all tags" onPress={getTags} variant="primary" />
              <Button text="Remove test tag" onPress={removeTag} variant="secondary" />
              <Button text="Remove all tags" onPress={removeAllTags} variant="secondary" />
              <Button text="Logout" onPress={logout} variant="danger" />
              <Button text="Start tracking" onPress={startTracking} variant="primary" />
              <Button text="Start persistent tracking" onPress={startPersistentTracking} variant="primary" />
              <Button text="Stop tracking" onPress={stopTracking} variant="primary" />
              <Button text="isInitialized" onPress={checkInitialized} variant="secondary" />
              <Button text="isTracking" onPress={checkTracking} variant="secondary" />
              <Button text="Upload unsent trips" onPress={uploadTrips} variant="secondary" />
              <Button text="Get unsent trip count" onPress={getUnsentCount} variant="secondary" />
              <Button text="Send custom heartbeat" onPress={sendHeartbeat} variant="secondary" />
              <Button text="Is RTLD enabled" onPress={checkRtld} variant="secondary" />
              <Button text="Enable accidents" onPress={() => enableAccidents(true)} variant="secondary" />
              <Button text="Disable accidents" onPress={() => enableAccidents(false)} variant="secondary" />
              <Button text="Register speed violations" onPress={registerSpeed} variant="secondary" />

              <Button text="Sensitivity: Normal" onPress={() => setSensitivity(AccidentDetectionSensitivity.Normal)} variant="secondary" />
              <Button text="Sensitivity: Sensitive" onPress={() => setSensitivity(AccidentDetectionSensitivity.Sensitive)} variant="secondary" />
              <Button text="Sensitivity: Tough" onPress={() => setSensitivity(AccidentDetectionSensitivity.Tough)} variant="secondary" />

              <Button text="iOS: isAggressiveHeartbeat" onPress={iosAggressiveHeartbeat} variant="primary" />
              <Button text="iOS: setAggressiveHeartbeats ON" onPress={() => iosSetAggressiveHeartbeats(true)} variant="primary" />
              <Button text="iOS: setAggressiveHeartbeats OFF" onPress={() => iosSetAggressiveHeartbeats(false)} variant="primary" />
              <Button text="iOS: setDisableTracking ON" onPress={() => iosSetDisableTracking(true)} variant="primary" />
              <Button text="iOS: setDisableTracking OFF" onPress={() => iosSetDisableTracking(false)} variant="primary" />
              <Button text="iOS: isDisableTracking" onPress={iosCheckDisableTracking} variant="primary" />
              <Button text="iOS: isWrongAccuracyState" onPress={iosCheckWrongAccuracyState} variant="primary" />
              <Button text="iOS: request Always Location" onPress={iosRequestAlwaysLocation} variant="primary" />
              <Button text="iOS: request Motion" onPress={iosRequestMotion} variant="primary" />
              <Button text="iOS: getApiLanguage" onPress={checkApiLang} variant="primary" />
              <Button text="iOS: setApiLanguage English" onPress={() => setApiLang(ApiLanguage.english)} variant="primary" />
              <Button text="iOS: setApiLanguage Russian" onPress={() => setApiLang(ApiLanguage.russian)} variant="primary" />

              <Button text="Android: isAutoStartEnabled" onPress={androidCheckAutoStart} variant="primary" />
              <Button text="Android: setAutoStartEnabled" onPress={androidSetAutoStart} variant="primary" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    backgroundColor: '#F0F8FF',
    paddingVertical: 20,
  },
  scrollView: {
    backgroundColor: '#FFF',
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
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  }
});

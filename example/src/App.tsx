import React, { useEffect, useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Platform,
} from 'react-native';

import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import TelematicsSdk, {
  AccidentDetectionSensitivity,
  ApiLanguage,
  TrackingMode,
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
  const [accidentSensitivity, setAccidentSensitivity] =
    useState<AccidentDetectionSensitivity>(AccidentDetectionSensitivity.Normal);
  const [speedLimitKmH, setSpeedLimitKmH] = useState('80');
  const [speedLimitTimeout, setSpeedLimitTimeout] = useState('10');
  const [maxPersistentTrackingInterval, setMaxPersistentTrackingInterval] =
    useState('60');
  const [apiLanguage, setApiLanguage] = useState<ApiLanguage>(
    ApiLanguage.english
  );
  const androidAutoStartEnable = true;
  const androidAutoStartPermanent = true;
  const [iosDisableTracking, setIosDisableTracking] = useState(false);
  const [iosAggressiveHeartbeats, setIosAggressiveHeartbeats] = useState(false);

  useEffect(() => {
    TelematicsSdk.initializeSdk();
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
          console.log('onLowPowerMode:', enabled);
        })
      );

      subs.push(
        addOnWrongAccuracyAuthorizationListener(() => {
          console.log('onWrongAccuracyAuthorization');
        })
      );

      subs.push(
        addOnRtldColectedData(() => {
          console.log('onRtldColectedData');
        })
      );
    }

    subs.push(
      addOnLocationChangedListener((e) => {
        const text = `onLocationChanged: latitude=${e.latitude}, longitude=${e.longitude}`;
        console.log(text);
      })
    );

    subs.push(
      addOnTrackingStateChangedListener((state) => {
        console.log(`onTrackingStateChanged: ${state}`);
      })
    );

    subs.push(
      addOnSpeedViolationListener((e) => {
        console.log(
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

  const showInfoAlert = (text: string) => {
    console.log(text);
    Alert.alert('✅ Success', text, [{ text: 'OK', style: 'default' }], {
      cancelable: true,
    });
  };

  const clearSdkTag = () => setSdkTag('');

  // methods
  const getToken = async () => {
    const token = await TelematicsSdk.getDeviceId();
    setDeviceToken(token);
  };

  const updateSdkStatus = async () => {
    try {
      const sdkEnabled = await TelematicsSdk.isSdkEnabled();
      setSdkStatus(sdkEnabled);
    } catch (error: any) {
      console.log(error);
    }
  };

  const showPermissionWizard = async () => {
    await TelematicsSdk.showPermissionWizard(false, false);
  };

  const checkInitialized = async () => {
    try {
      const v = await TelematicsSdk.isInitializedSdk();
      showInfoAlert(`isInitialized: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const checkTracking = async () => {
    try {
      const v = await TelematicsSdk.isTracking();
      showInfoAlert(`isTracking: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const uploadTrips = async () => {
    try {
      await TelematicsSdk.uploadUnsentTrips();
      showInfoAlert('uploadUnsentTrips: OK');
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const getUnsentCount = async () => {
    try {
      const v = await TelematicsSdk.getUnsentTripCount();
      showInfoAlert(`getUnsentTripCount: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const sendHeartbeat = async () => {
    try {
      await TelematicsSdk.sendCustomHeartbeats(heartbeatReason);
      showInfoAlert(`sendCustomHeartbeats: ${heartbeatReason}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const getDeviceIdRegistrationState = async () => {
    try {
      const state = await TelematicsSdk.getDeviceIdRegistrationState();
      const checkedAt =
        state.checkedAtMillis > 0
          ? new Date(state.checkedAtMillis).toISOString()
          : 'not checked';
      showInfoAlert(
        `getDeviceIdRegistrationState:\nstatus=${state.status}\ncheckedAtMillis=${state.checkedAtMillis}\ncheckedAt=${checkedAt}`
      );
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const getTrackingState = async () => {
    try {
      const state = await TelematicsSdk.getTrackingState();
      showInfoAlert(
        `getTrackingState:\nautomaticTrackingStatus=${state.automaticTrackingStatus}\nmanualTrackingStatus=${state.manualTrackingStatus}`
      );
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const setPersistentTrackingInterval = async () => {
    try {
      const minutes = Number(maxPersistentTrackingInterval);
      if (!Number.isFinite(minutes)) {
        Alert.alert('Invalid value', 'Enter interval in minutes');
        return;
      }
      await TelematicsSdk.setMaxPersistentTrackingInterval(minutes);
      showInfoAlert(`setMaxPersistentTrackingInterval: ${minutes} minutes`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const getPersistentTrackingInterval = async () => {
    try {
      const minutes = await TelematicsSdk.getMaxPersistentTrackingInterval();
      showInfoAlert(`getMaxPersistentTrackingInterval: ${minutes} minutes`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const setTrackingMode = async (mode: TrackingMode) => {
    try {
      await TelematicsSdk.setTrackingMode(mode);
      showInfoAlert(`setTrackingMode: ${TrackingMode[mode]} (${mode})`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const getTrackingMode = async () => {
    try {
      const mode = await TelematicsSdk.getTrackingMode();
      showInfoAlert(`getTrackingMode: ${TrackingMode[mode]} (${mode})`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const setSensitivity = async (s: AccidentDetectionSensitivity) => {
    try {
      setAccidentSensitivity(s);
      await TelematicsSdk.setAccidentDetectionSensitivity(s);
      showInfoAlert(
        `setAccidentDetectionSensitivity: ${AccidentDetectionSensitivity[s]}`
      );
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const checkRtld = async () => {
    try {
      const v = await TelematicsSdk.isRTLDEnabled();
      showInfoAlert(`isRTLDEnabled: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const enableAccidents = async (enable: boolean) => {
    try {
      await TelematicsSdk.enableAccidents(enable);
      const v = await TelematicsSdk.isEnabledAccidents();
      showInfoAlert(`enableAccidents(${enable}) => isEnabledAccidents: ${v}`);
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
      showInfoAlert(
        `registerSpeedViolations: ${speedLimitKmH} km/h, ${speedLimitTimeout}s`
      );
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const setApiLang = async (lang: ApiLanguage) => {
    try {
      setApiLanguage(lang);
      await TelematicsSdk.setApiLanguage(lang);
      const current = await TelematicsSdk.getApiLanguage();
      showInfoAlert(`setApiLanguage: ${lang} => getApiLanguage: ${current}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const checkApiLang = async () => {
    try {
      const current = await TelematicsSdk.getApiLanguage();
      showInfoAlert(`getApiLanguage: ${current}`);
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
      const v = await TelematicsSdk.isAggressiveHeartbeats();
      showInfoAlert(`isAggressiveHeartbeats: ${v}`);
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
      showInfoAlert(`setAggressiveHeartbeats: ${enable}`);
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
      showInfoAlert(`setDisableTracking: ${value}`);
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
      showInfoAlert(`isDisableTracking: ${v}`);
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
      showInfoAlert(`isWrongAccuracyState: ${v}`);
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
      await TelematicsSdk.requestIOSLocationAlwaysPermission();
      showInfoAlert('requestIOSLocationAlwaysPermission: OK');
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
      await TelematicsSdk.requestIOSMotionPermission();
      showInfoAlert('requestIOSMotionPermission: OK');
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
      showInfoAlert(
        `setAndroidAutoStartEnabled => isAndroidAutoStartEnabled: ${v}`
      );
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
      showInfoAlert(`isAndroidAutoStartEnabled: ${v}`);
    } catch (e: any) {
      showErrorAlert(e);
    }
  };

  const enableSDK = async () => {
    console.log('=== Enabling SDK ===');
    console.log('Device token length:', deviceToken.length);
    console.log('Device token (first 20 chars):', deviceToken.substring(0, 20));

    if (!deviceToken || deviceToken.trim() === '') {
      Alert.alert(
        '⚠️ Token required',
        'Please enter device token to enable the SDK',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      console.log('Checking permissions...');
      const isAllRequiredPermissionsAndSensorsGranted =
        await TelematicsSdk.isAllRequiredPermissionsAndSensorsGranted();
      console.log(
        'Permissions granted:',
        isAllRequiredPermissionsAndSensorsGranted
      );

      if (!isAllRequiredPermissionsAndSensorsGranted) {
        setIsLoading(false);
        Alert.alert(
          '⚠️ Permissions missing',
          'Please grant all required permissions in Settings.',
          [
            { text: 'OK', style: 'default' },
            {
              text: 'Request again',
              onPress: showPermissionWizard,
              style: 'default',
            },
          ]
        );
        return;
      }

      console.log('Checking SDK status...');
      const sdkEnabled = await TelematicsSdk.isSdkEnabled();
      console.log('SDK enabled:', sdkEnabled);

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
        Alert.alert(
          '❌ Enable failed',
          'Failed to enable SDK. Please check your token and permissions.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      console.log('SDK enabled successfully!');
      await updateSdkStatus();
      Alert.alert(
        '✅ Success',
        'SDK enabled successfully. You can use telematics features now.',
        [{ text: 'Great', style: 'default' }]
      );
    } catch (error: any) {
      setIsLoading(false);
      console.error('Enable SDK error:', error);
      showErrorAlert(error);
    }
  };

  const logout = async () => {
    showInfoAlert('Logout');
    await TelematicsSdk.logout();
    setDeviceToken('');
    updateSdkStatus();
  };

  const setTag = async () => {
    try {
      const result = await TelematicsSdk.addFutureTrackTag(
        'RN_Demo_Tag',
        'RN_Demo_Source'
      );
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
      const result = await TelematicsSdk.removeFutureTrackTag(
        'RN_Demo_Tag',
        'RN_Demo_Source'
      );
      setSdkTag(JSON.stringify(result));
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const startPersistentTracking = async () => {
    try {
      await TelematicsSdk.startTrackAsPersistent();
      showInfoAlert('startTrackAsPersistent');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const startTracking = async () => {
    try {
      await TelematicsSdk.startManualTracking();
      showInfoAlert('startManualTracking');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const stopTracking = async () => {
    try {
      await TelematicsSdk.stopManualTracking();
      showInfoAlert('stopManualTracking');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  return (
    <SafeAreaProvider>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <SafeAreaView style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
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
            <Input
              placeholder={'Max persistent tracking interval minutes (5..600)'}
              value={maxPersistentTrackingInterval}
              onChangeText={setMaxPersistentTrackingInterval}
            />
            <Text style={styles.status}>
              SDK enabled:{' '}
              <Text style={styles.value}>{String(isSdkEnabled)}</Text>
              {'\n'}
              Permissions granted:{' '}
              <Text style={styles.value}>{String(isPermissionsGranted)}</Text>
              {'\n'}
              Sensitivity:{' '}
              <Text style={styles.value}>
                {AccidentDetectionSensitivity[accidentSensitivity]}
              </Text>
              {'\n'}
              API language: <Text style={styles.value}>{apiLanguage}</Text>
              {'\n'}
              Android auto-start (demo):{' '}
              <Text style={styles.value}>
                enable={String(androidAutoStartEnable)} permanent=
                {String(androidAutoStartPermanent)}
              </Text>
              {'\n'}
              iOS disableTracking:{' '}
              <Text style={styles.value}>{String(iosDisableTracking)}</Text>
              {'\n'}
              iOS aggressiveHeartbeats:{' '}
              <Text style={styles.value}>
                {String(iosAggressiveHeartbeats)}
              </Text>
            </Text>
            <Text style={styles.tagText}>{sdkTag}</Text>
            <View>
              <Button
                text="Enable SDK"
                onPress={enableSDK}
                variant="success"
                disabled={isLoading}
              />
              <Button
                text="Add test tag"
                onPress={setTag}
                variant="secondary"
              />
              <Button text="Get all tags" onPress={getTags} variant="primary" />
              <Button
                text="Remove test tag"
                onPress={removeTag}
                variant="secondary"
              />
              <Button
                text="Remove all tags"
                onPress={removeAllTags}
                variant="secondary"
              />
              <Button text="Logout" onPress={logout} variant="danger" />
              <Button
                text="Start tracking"
                onPress={startTracking}
                variant="primary"
              />
              <Button
                text="Start persistent tracking"
                onPress={startPersistentTracking}
                variant="primary"
              />
              <Button
                text="Stop tracking"
                onPress={stopTracking}
                variant="primary"
              />
              <Button
                text="isInitialized"
                onPress={checkInitialized}
                variant="secondary"
              />
              <Button
                text="isTracking"
                onPress={checkTracking}
                variant="secondary"
              />
              <Button
                text="Upload unsent trips"
                onPress={uploadTrips}
                variant="secondary"
              />
              <Button
                text="Get unsent trip count"
                onPress={getUnsentCount}
                variant="secondary"
              />
              <Button
                text="Send custom heartbeat"
                onPress={sendHeartbeat}
                variant="secondary"
              />
              <Button
                text="Get device ID registration state"
                onPress={getDeviceIdRegistrationState}
                variant="secondary"
              />
              <Button
                text="Get tracking state"
                onPress={getTrackingState}
                variant="secondary"
              />
              <Button
                text="Set max persistent interval"
                onPress={setPersistentTrackingInterval}
                variant="secondary"
              />
              <Button
                text="Get max persistent interval"
                onPress={getPersistentTrackingInterval}
                variant="secondary"
              />
              <Button
                text="Tracking mode: Standard"
                onPress={() => setTrackingMode(TrackingMode.Standard)}
                variant="secondary"
              />
              <Button
                text="Tracking mode: Persistent"
                onPress={() => setTrackingMode(TrackingMode.Persistent)}
                variant="secondary"
              />
              <Button
                text="Get tracking mode"
                onPress={getTrackingMode}
                variant="secondary"
              />
              <Button
                text="Is RTLD enabled"
                onPress={checkRtld}
                variant="secondary"
              />
              <Button
                text="Enable accidents"
                onPress={() => enableAccidents(true)}
                variant="secondary"
              />
              <Button
                text="Disable accidents"
                onPress={() => enableAccidents(false)}
                variant="secondary"
              />
              <Button
                text="Register speed violations"
                onPress={registerSpeed}
                variant="secondary"
              />

              <Button
                text="Sensitivity: Normal"
                onPress={() =>
                  setSensitivity(AccidentDetectionSensitivity.Normal)
                }
                variant="secondary"
              />
              <Button
                text="Sensitivity: Sensitive"
                onPress={() =>
                  setSensitivity(AccidentDetectionSensitivity.Sensitive)
                }
                variant="secondary"
              />
              <Button
                text="Sensitivity: Tough"
                onPress={() =>
                  setSensitivity(AccidentDetectionSensitivity.Tough)
                }
                variant="secondary"
              />

              <Button
                text="iOS: isAggressiveHeartbeats"
                onPress={iosAggressiveHeartbeat}
                variant="primary"
              />
              <Button
                text="iOS: setAggressiveHeartbeats ON"
                onPress={() => iosSetAggressiveHeartbeats(true)}
                variant="primary"
              />
              <Button
                text="iOS: setAggressiveHeartbeats OFF"
                onPress={() => iosSetAggressiveHeartbeats(false)}
                variant="primary"
              />
              <Button
                text="iOS: setDisableTracking ON"
                onPress={() => iosSetDisableTracking(true)}
                variant="primary"
              />
              <Button
                text="iOS: setDisableTracking OFF"
                onPress={() => iosSetDisableTracking(false)}
                variant="primary"
              />
              <Button
                text="iOS: isDisableTracking"
                onPress={iosCheckDisableTracking}
                variant="primary"
              />
              <Button
                text="iOS: isWrongAccuracyState"
                onPress={iosCheckWrongAccuracyState}
                variant="primary"
              />
              <Button
                text="iOS: request Always Location"
                onPress={iosRequestAlwaysLocation}
                variant="primary"
              />
              <Button
                text="iOS: request Motion"
                onPress={iosRequestMotion}
                variant="primary"
              />
              <Button
                text="iOS: getApiLanguage"
                onPress={checkApiLang}
                variant="primary"
              />
              <Button
                text="iOS: setApiLanguage English"
                onPress={() => setApiLang(ApiLanguage.english)}
                variant="primary"
              />
              <Button
                text="iOS: setApiLanguage Russian"
                onPress={() => setApiLang(ApiLanguage.russian)}
                variant="primary"
              />

              <Button
                text="Android: isAutoStartEnabled"
                onPress={androidCheckAutoStart}
                variant="primary"
              />
              <Button
                text="Android: setAutoStartEnabled"
                onPress={androidSetAutoStart}
                variant="primary"
              />
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
  },
});

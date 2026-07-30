import React, { useEffect, useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
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

export default function App() {
  const [deviceToken, setDeviceToken] = useState('');
  const [deviceIdDraft, setDeviceIdDraft] = useState('');
  const [isSdkEnabled, setSdkStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPermissionsGranted, setIsPermissionsGranted] = useState(false);
  const [isManualTracking, setIsManualTracking] = useState(false);
  const [trackingMode, setCurrentTrackingMode] = useState<TrackingMode | null>(
    null
  );
  const [location, setLocation] = useState<string | null>(null);
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
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [subUnits, setSubUnits] = useState<Record<string, string>>({});

  useEffect(() => {
    TelematicsSdk.initializeSdk();
    updateSdkStatus();
    getToken();
    updatePermissionsStatus();
    updateTrackingMode();
    refreshMetadata();

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
        setLocation(`${e.latitude}, ${e.longitude}`);
      })
    );

    subs.push(
      addOnTrackingStateChangedListener((state) => {
        console.log(`onTrackingStateChanged: ${state}`);
        setIsManualTracking(state);
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

  const updatePermissionsStatus = async () => {
    try {
      setIsPermissionsGranted(
        await TelematicsSdk.isAllRequiredPermissionsAndSensorsGranted()
      );
    } catch (error: any) {
      console.log(error);
    }
  };

  const updateTrackingMode = async () => {
    try {
      setCurrentTrackingMode(await TelematicsSdk.getTrackingMode());
    } catch (error: any) {
      console.log(error);
    }
  };

  const showPermissionWizard = async () => {
    const isGranted = await TelematicsSdk.showPermissionWizard({
      themeMode: 'system',
      blockEarlyExit: false,
      skipWizardPages: false,
    });
    setIsPermissionsGranted(isGranted);
    await updatePermissionsStatus();
  };

  const refreshMetadata = async () => {
    try {
      const [currentProperties, currentSubUnits] = await Promise.all([
        TelematicsSdk.getProperties(),
        TelematicsSdk.getSubUnits(),
      ]);
      setProperties(currentProperties);
      setSubUnits(currentSubUnits);
    } catch (error: any) {
      console.log('Unable to load SDK metadata:', error);
    }
  };

  const setDemoProperties = async () => {
    try {
      await TelematicsSdk.setProperties({
        order_id: 'RN-Demo-12345',
        shift: 'morning',
      });
      await refreshMetadata();
      showInfoAlert('Properties updated');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const clearDemoProperties = async () => {
    try {
      await TelematicsSdk.clearProperties();
      await refreshMetadata();
      showInfoAlert('Properties cleared');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const setDemoSubUnits = async () => {
    try {
      await TelematicsSdk.setSubUnits({
        DriverId: 'RN-D-001',
        VehicleId: 'RN-V-002',
      });
      await refreshMetadata();
      showInfoAlert('Sub-units updated');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const clearDemoSubUnits = async () => {
    try {
      await TelematicsSdk.clearSubUnits();
      await refreshMetadata();
      showInfoAlert('Sub-units cleared');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const addDemoActivityLog = async () => {
    try {
      await TelematicsSdk.addActivityLog('Activity log from RN demo', {
        source: 'react-native-demo',
      });
      showInfoAlert('Demo activity log added');
    } catch (error: any) {
      showErrorAlert(error);
    }
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
      setCurrentTrackingMode(mode);
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

  const setAccidentDetectionEnabled = async (enable: boolean) => {
    try {
      await TelematicsSdk.setAccidentDetectionEnabled(enable);
      const v = await TelematicsSdk.isAccidentDetectionEnabled();
      showInfoAlert(
        `setAccidentDetectionEnabled(${enable}) => isAccidentDetectionEnabled: ${v}`
      );
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
      setIsPermissionsGranted(isAllRequiredPermissionsAndSensorsGranted);
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
    try {
      await TelematicsSdk.logout();
      setDeviceToken('');
      setDeviceIdDraft('');
      setIsManualTracking(false);
      await updateSdkStatus();
      showInfoAlert('Logout');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const updateDeviceId = async () => {
    const token = deviceIdDraft.trim();
    if (!token) {
      Alert.alert(
        'Device ID is empty',
        'Enter a device ID before applying it.'
      );
      return;
    }

    try {
      await TelematicsSdk.setDeviceId(token);
      await getToken();
      setDeviceIdDraft('');
      showInfoAlert('Device ID updated');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const disableSDK = async () => {
    try {
      if (isManualTracking) {
        await TelematicsSdk.stopManualTracking();
        setIsManualTracking(false);
      }
      if (Platform.OS === 'ios') {
        await TelematicsSdk.setDisableTracking(true);
        setIosDisableTracking(true);
      }
      await TelematicsSdk.setEnableSdk(false);
      await updateSdkStatus();
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const startPersistentTracking = async () => {
    try {
      if (!deviceToken.trim()) {
        Alert.alert('Device ID is empty', 'Set a device ID first.');
        return;
      }
      if (!isSdkEnabled) {
        Alert.alert('Enable SDK first');
        return;
      }
      if (!isPermissionsGranted) {
        Alert.alert(
          'Permissions required',
          'Grant all required permissions first.'
        );
        return;
      }
      if (isManualTracking) {
        Alert.alert(
          'Tracking already started',
          'Stop the current track first.'
        );
        return;
      }
      const interval = Number(maxPersistentTrackingInterval);
      if (!Number.isFinite(interval) || interval < 5 || interval > 600) {
        Alert.alert(
          'Invalid interval',
          'Enter a persistent tracking interval from 5 to 600 minutes.'
        );
        return;
      }
      await TelematicsSdk.setMaxPersistentTrackingInterval(interval);
      await TelematicsSdk.startTrackAsPersistent();
      setIsManualTracking(true);
      showInfoAlert('startTrackAsPersistent');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const startTracking = async () => {
    try {
      if (!deviceToken.trim()) {
        Alert.alert('Device ID is empty', 'Set a device ID first.');
        return;
      }
      if (!isSdkEnabled) {
        Alert.alert('Enable SDK first');
        return;
      }
      if (!isPermissionsGranted) {
        Alert.alert(
          'Permissions required',
          'Grant all required permissions first.'
        );
        return;
      }
      if (isManualTracking) {
        Alert.alert(
          'Tracking already started',
          'Stop the current track first.'
        );
        return;
      }
      await TelematicsSdk.startManualTracking();
      setIsManualTracking(true);
      showInfoAlert('startManualTracking');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const stopTracking = async () => {
    try {
      if (!isManualTracking) {
        Alert.alert('Tracking is not active', 'Start tracking first.');
        return;
      }
      await TelematicsSdk.stopManualTracking();
      setIsManualTracking(false);
      showInfoAlert('stopManualTracking');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const getFutureTrackTags = async () => {
    try {
      const result = await TelematicsSdk.getFutureTrackTags();
      const tags = result.tags.map(
        (tag) => `${tag.tag} (${tag.source ?? '-'})`
      );
      showInfoAlert(`Future track tags: ${tags.join(', ') || 'none'}`);
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const addFutureTrackTag = async () => {
    try {
      await TelematicsSdk.addFutureTrackTag(
        'MyBestTripTagForRPTest',
        'RPTestSource'
      );
      showInfoAlert('Future track tag added');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const removeFutureTrackTag = async () => {
    try {
      await TelematicsSdk.removeFutureTrackTag(
        'MyBestTripTagForRPTest',
        'RPTestSource'
      );
      showInfoAlert('Future track tag removed');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  const removeAllFutureTrackTags = async () => {
    try {
      await TelematicsSdk.removeAllFutureTrackTags();
      showInfoAlert('Future track tags removed');
    } catch (error: any) {
      showErrorAlert(error);
    }
  };

  return (
    <SafeAreaProvider>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.appBar}>
            <Text style={styles.appBarTitle}>TelematicsSDK_demo</Text>
          </View>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.screenContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.statusText}>
              SDK status: {isSdkEnabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.statusText}>
              Permissions: {isPermissionsGranted ? 'Granted' : 'Not granted'}
            </Text>
            {Platform.OS === 'ios' ? (
              <Text style={styles.statusText}>
                Tracking:{' '}
                {isSdkEnabled && !iosDisableTracking ? 'Enabled' : 'Disabled'}
              </Text>
            ) : null}
            <Text style={styles.statusText}>
              Manual Tracking: {isManualTracking ? 'Started' : 'Not started'}
            </Text>
            <Text style={styles.statusText}>
              Location: {location ?? 'null'}
            </Text>
            <Text style={styles.statusText}>
              Device ID: {deviceToken || '—'}
            </Text>
            <Text style={styles.statusText}>
              Sensitivity: {AccidentDetectionSensitivity[accidentSensitivity]}
            </Text>
            <Text style={styles.statusText}>API language: {apiLanguage}</Text>

            <View style={styles.buttonRow}>
              <View style={styles.buttonCell}>
                <Button
                  text="Get Device ID Registration State"
                  onPress={getDeviceIdRegistrationState}
                  style={styles.actionButton}
                  textStyle={styles.buttonTextCentered}
                />
              </View>
              <View style={styles.buttonCell}>
                <Button
                  text="Get Tracking State"
                  onPress={getTrackingState}
                  style={styles.actionButton}
                  textStyle={styles.buttonTextCentered}
                />
              </View>
            </View>

            <Input
              label="Max persistent interval, minutes"
              placeholder="5–600 minutes"
              value={maxPersistentTrackingInterval}
              onChangeText={setMaxPersistentTrackingInterval}
              keyboardType="number-pad"
            />
            <Button
              text="Set Max Persistent Interval"
              onPress={setPersistentTrackingInterval}
              style={styles.fullButton}
            />

            <View style={styles.segmentedControl}>
              <Button
                text="Standard"
                onPress={() => setTrackingMode(TrackingMode.Standard)}
                style={[
                  styles.segmentButton,
                  trackingMode === TrackingMode.Standard &&
                    styles.segmentSelected,
                ]}
                textStyle={styles.segmentText}
              />
              <Button
                text="Persistent"
                onPress={() => setTrackingMode(TrackingMode.Persistent)}
                style={[
                  styles.segmentButton,
                  trackingMode === TrackingMode.Persistent &&
                    styles.segmentSelected,
                ]}
                textStyle={styles.segmentText}
              />
            </View>

            <Text style={styles.sectionTitle}>Properties</Text>
            <Text style={styles.detailsText}>
              Current properties: {JSON.stringify(properties)}
            </Text>
            <View style={styles.wrap}>
              <Button text="Set Properties" onPress={setDemoProperties} />
              <Button text="Get Properties" onPress={refreshMetadata} />
              <Button text="Clear Properties" onPress={clearDemoProperties} />
            </View>

            <Text style={styles.sectionTitle}>Sub-units</Text>
            <Text style={styles.detailsText}>
              Current sub-units: {JSON.stringify(subUnits)}
            </Text>
            <View style={styles.wrap}>
              <Button text="Set Sub-units" onPress={setDemoSubUnits} />
              <Button text="Get Sub-units" onPress={refreshMetadata} />
              <Button text="Clear Sub-units" onPress={clearDemoSubUnits} />
            </View>

            <Text style={styles.sectionTitle}>Activity Log</Text>
            <Button
              text="Add Demo Activity Log"
              onPress={addDemoActivityLog}
              style={styles.fullButton}
            />

            <Text style={styles.sectionTitle}>
              Future Track Tags (Deprecated)
            </Text>
            <Button
              text="Get Future Track Tags"
              onPress={getFutureTrackTags}
              style={styles.fullButton}
            />
            <View style={styles.buttonRow}>
              <View style={styles.buttonCell}>
                <Button
                  text="Add Future Track Tag"
                  onPress={addFutureTrackTag}
                  style={styles.actionButton}
                  textStyle={styles.buttonTextCentered}
                />
              </View>
              <View style={styles.buttonCell}>
                <Button
                  text="Remove Future Track Tag"
                  onPress={removeFutureTrackTag}
                  style={styles.actionButton}
                  textStyle={styles.buttonTextCentered}
                />
              </View>
            </View>
            <Button
              text="Remove All Future Track Tags"
              onPress={removeAllFutureTrackTags}
              style={styles.fullButton}
            />

            <Input
              label="Override device ID"
              placeholder="Submit to apply a new token"
              value={deviceIdDraft}
              onChangeText={setDeviceIdDraft}
              onSubmitEditing={updateDeviceId}
            />
            <View style={styles.buttonRow}>
              <View style={styles.buttonCell}>
                <Button
                  text="Enable SDK"
                  onPress={enableSDK}
                  disabled={isSdkEnabled || isLoading}
                  style={styles.actionButton}
                />
              </View>
              <View style={styles.buttonCell}>
                <Button
                  text="Disable SDK"
                  onPress={disableSDK}
                  disabled={!isSdkEnabled || isLoading}
                  style={styles.actionButton}
                />
              </View>
            </View>
            <Button
              text="Logout"
              onPress={logout}
              disabled={isSdkEnabled || !deviceToken}
              style={styles.fullButton}
            />

            <Button
              text="Start Permission Wizard"
              onPress={showPermissionWizard}
              style={styles.fullButton}
            />

            {Platform.OS === 'ios' ? (
              <>
                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>Aggressive Heartbeats</Text>
                  <Switch
                    value={iosAggressiveHeartbeats}
                    onValueChange={iosSetAggressiveHeartbeats}
                    disabled={!isSdkEnabled}
                  />
                </View>
                <View style={styles.buttonRow}>
                  <View style={styles.buttonCell}>
                    <Button
                      text="Enable Tracking"
                      onPress={() => iosSetDisableTracking(false)}
                      disabled={!isSdkEnabled || !iosDisableTracking}
                      style={styles.actionButton}
                    />
                  </View>
                  <View style={styles.buttonCell}>
                    <Button
                      text="Disable Tracking"
                      onPress={() => iosSetDisableTracking(true)}
                      disabled={!isSdkEnabled || iosDisableTracking}
                      style={styles.actionButton}
                    />
                  </View>
                </View>
              </>
            ) : null}

            <View style={styles.buttonRow}>
              <View style={styles.buttonCell}>
                <Button
                  text="Start tracking manually"
                  onPress={startTracking}
                  disabled={isManualTracking}
                  style={styles.actionButton}
                  textStyle={styles.buttonTextCentered}
                />
              </View>
              <View style={styles.buttonCell}>
                <Button
                  text="Start persistent tracking manually"
                  onPress={startPersistentTracking}
                  disabled={isManualTracking}
                  style={styles.actionButton}
                  textStyle={styles.buttonTextCentered}
                />
              </View>
              <View style={styles.buttonCell}>
                <Button
                  text="Stop tracking manually"
                  onPress={stopTracking}
                  disabled={!isManualTracking}
                  style={styles.actionButton}
                  textStyle={styles.buttonTextCentered}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              Additional React Native SDK APIs
            </Text>
            <Input
              label="Heartbeat reason"
              value={heartbeatReason}
              onChangeText={setHeartbeatReason}
            />
            <Button
              text="Send custom heartbeat"
              onPress={sendHeartbeat}
              style={styles.fullButton}
            />
            <View style={styles.wrap}>
              <Button text="isInitialized" onPress={checkInitialized} />
              <Button text="isTracking" onPress={checkTracking} />
              <Button text="Upload unsent trips" onPress={uploadTrips} />
              <Button text="Get unsent trip count" onPress={getUnsentCount} />
              <Button text="Get tracking mode" onPress={getTrackingMode} />
              <Button
                text="Get max persistent interval"
                onPress={getPersistentTrackingInterval}
              />
              <Button text="Is RTLD enabled" onPress={checkRtld} />
              <Button
                text="Enable accidents"
                onPress={() => setAccidentDetectionEnabled(true)}
              />
              <Button
                text="Disable accidents"
                onPress={() => setAccidentDetectionEnabled(false)}
              />
            </View>
            <Input
              label="Speed limit, km/h"
              value={speedLimitKmH}
              onChangeText={setSpeedLimitKmH}
              keyboardType="number-pad"
            />
            <Input
              label="Speed-limit timeout, seconds"
              value={speedLimitTimeout}
              onChangeText={setSpeedLimitTimeout}
              keyboardType="number-pad"
            />
            <Button
              text="Register speed violations"
              onPress={registerSpeed}
              style={styles.fullButton}
            />
            <View style={styles.wrap}>
              <Button
                text="Sensitivity: Normal"
                onPress={() =>
                  setSensitivity(AccidentDetectionSensitivity.Normal)
                }
              />
              <Button
                text="Sensitivity: Sensitive"
                onPress={() =>
                  setSensitivity(AccidentDetectionSensitivity.Sensitive)
                }
              />
              <Button
                text="Sensitivity: Tough"
                onPress={() =>
                  setSensitivity(AccidentDetectionSensitivity.Tough)
                }
              />
            </View>
            {Platform.OS === 'ios' ? (
              <View style={styles.wrap}>
                <Button
                  text="iOS: isAggressiveHeartbeats"
                  onPress={iosAggressiveHeartbeat}
                />
                <Button
                  text="iOS: isDisableTracking"
                  onPress={iosCheckDisableTracking}
                />
                <Button
                  text="iOS: isWrongAccuracyState"
                  onPress={iosCheckWrongAccuracyState}
                />
                <Button
                  text="iOS: request Always Location"
                  onPress={iosRequestAlwaysLocation}
                />
                <Button text="iOS: request Motion" onPress={iosRequestMotion} />
                <Button text="iOS: getApiLanguage" onPress={checkApiLang} />
                <Button
                  text="iOS: setApiLanguage English"
                  onPress={() => setApiLang(ApiLanguage.english)}
                />
                <Button
                  text="iOS: setApiLanguage Russian"
                  onPress={() => setApiLang(ApiLanguage.russian)}
                />
              </View>
            ) : (
              <View style={styles.wrap}>
                <Button
                  text="Android: isAutoStartEnabled"
                  onPress={androidCheckAutoStart}
                />
                <Button
                  text="Android: setAutoStartEnabled"
                  onPress={androidSetAutoStart}
                />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    backgroundColor: '#FFF',
  },
  appBar: {
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#6750A4',
    elevation: 4,
  },
  appBarTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '500',
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 8,
  },
  statusText: {
    color: '#1D1B20',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    marginTop: 16,
    color: '#1D1B20',
    fontSize: 16,
    fontWeight: '500',
  },
  detailsText: {
    color: '#49454F',
    fontSize: 14,
    lineHeight: 20,
  },
  fullButton: {
    width: '100%',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  buttonCell: {
    flex: 1,
  },
  actionButton: {
    width: '100%',
    minHeight: 48,
  },
  buttonTextCentered: {
    textAlign: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#79747E',
    borderRadius: 20,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
    elevation: 0,
  },
  segmentSelected: {
    backgroundColor: '#E8DEF8',
  },
  segmentText: {
    color: '#1D1B20',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginTop: 8,
  },
  switchText: {
    color: '#1D1B20',
    fontSize: 16,
  },
});

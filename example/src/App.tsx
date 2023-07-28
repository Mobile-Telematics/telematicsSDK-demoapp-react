import * as React from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  NativeEventEmitter,
  Alert,
} from 'react-native';
import TelematicsSdk from 'react-native-telematics';

export default function App() {
  const [deviceToken, setDeviceToken] = React.useState<string>('');
  const [sdkStatus, setSdkStatus] = React.useState(false);
  const [sdkTag, setSdkTag] = React.useState('');

  React.useEffect(() => {
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

  const getToken = async () => {
    const token = await TelematicsSdk.getDeviceToken();
    setDeviceToken(token);
  };

  const clearSdkTag = () => setSdkTag('');

  const requestPermissions = async () => {
    try {
      const isGranted = await TelematicsSdk.requestPermissions();
      if (isGranted) console.log('All permissions granted');
    } catch (error: any) {
      Alert.alert('Error', error.message, [{ text: 'OK' }]);
      console.log(error);
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
      Alert.alert('Error', error.message, [{ text: 'OK' }]);
      console.log(error.message);
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
      Alert.alert('Error', error.message, [{ text: 'OK' }]);
      console.log(error);
    }
  };

  const getTags = async () => {
    try {
      const result = await TelematicsSdk.getFutureTrackTags();
      setSdkTag(JSON.stringify(result));
    } catch (error: any) {
      Alert.alert('Error', error.message, [{ text: 'OK' }]);
      console.log(error);
    }
  };

  const removeAllTags = async () => {
    try {
      const result = await TelematicsSdk.removeAllFutureTrackTags();
      setSdkTag(JSON.stringify(result));
    } catch (error: any) {
      Alert.alert('Error', error.message, [{ text: 'OK' }]);
      console.log(error);
    }
  };

  const removeTag = async () => {
    try {
      const result = await TelematicsSdk.removeFutureTrackTag('Some');
      setSdkTag(JSON.stringify(result));
    } catch (error: any) {
      Alert.alert('Error', error.message, [{ text: 'OK' }]);
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {sdkTag === '' ? (
        <View />
      ) : (
        <View style={styles.clearButton}>
          <TouchableOpacity onPress={clearSdkTag}>
            <Text style={styles.clearButtonText}>X</Text>
          </TouchableOpacity>
        </View>
      )}
      {!sdkStatus ? (
        <Text style={styles.status}>SDK Status: disabled</Text>
      ) : (
        <Text style={styles.status}>SDK Status: enabled</Text>
      )}
      <TextInput
        placeholder={'Your device token'}
        value={deviceToken}
        onChangeText={setDeviceToken}
        multiline={true}
        blurOnSubmit={true}
        style={styles.input}
      />
      <Text style={styles.tagText}>{sdkTag}</Text>
      <View>
        <TouchableOpacity onPress={enableSDK} style={styles.button}>
          <Text>Enable SDK</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={setTag} style={styles.button}>
          <Text>Add test tag</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={getTags} style={styles.button}>
          <Text>Get all tags</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={removeTag} style={styles.button}>
          <Text>Remove test tag</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={removeAllTags} style={styles.button}>
          <Text>Remove all tags</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={disableSDK} style={styles.button}>
          <Text>Disable SDK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: 'green',
    height: 50,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 24,
    marginVertical: 8,
  },
  input: {
    marginHorizontal: 24,
    fontSize: 20,
    textAlign: 'center',
  },
  status: {
    textAlign: 'center',
    fontSize: 20,
  },
  tagText: {
    textAlign: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
  },
  clearButtonText: {
    fontSize: 24,
  },
});

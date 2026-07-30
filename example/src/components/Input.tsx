import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

interface InputProps {
  placeholder?: string;
  label?: string;
  value: string;
  onChangeText: TextInputProps['onChangeText'];
  keyboardType?: TextInputProps['keyboardType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
}

export const Input = ({
  placeholder,
  label,
  value,
  onChangeText,
  keyboardType,
  onSubmitEditing,
}: InputProps) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
        multiline={false}
        blurOnSubmit
        style={styles.input}
        placeholderTextColor="#999"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#79747E',
    paddingHorizontal: 12,
  },
  label: {
    alignSelf: 'flex-start',
    marginTop: -9,
    paddingHorizontal: 4,
    color: '#6750A4',
    fontSize: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    fontSize: 16,
    paddingVertical: 10,
    color: '#000',
    textAlign: 'left',
    minHeight: 44,
  },
});

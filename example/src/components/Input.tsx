import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: TextInputProps['onChangeText'];
}

export const Input = ({ placeholder, value, onChangeText }: InputProps) => {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline
      blurOnSubmit
      style={styles.input}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    marginHorizontal: 24,
    fontSize: 20,
    textAlign: 'center',
  },
});

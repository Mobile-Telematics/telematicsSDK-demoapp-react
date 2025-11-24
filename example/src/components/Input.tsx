import React from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: TextInputProps['onChangeText'];
}

export const Input = ({ placeholder, value, onChangeText }: InputProps) => {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        multiline
        blurOnSubmit
        style={styles.input}
        placeholderTextColor="#999"
        textAlign="center"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
    borderColor: '#5AC8FA',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    fontSize: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: '#000',
    textAlign: 'left',
    minHeight: 50,
  },
});

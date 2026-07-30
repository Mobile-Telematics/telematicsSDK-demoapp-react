import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  text: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button = ({
  onPress,
  text,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: ButtonProps) => {
  const buttonStyle: StyleProp<ViewStyle> = [
    styles.button,
    styles[variant],
    disabled ? styles.disabled : undefined,
    style,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={buttonStyle}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text
        style={[styles.buttonText, disabled && styles.disabledText, textStyle]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  primary: {
    backgroundColor: '#6750A4',
  },
  secondary: {
    backgroundColor: '#6750A4',
  },
  danger: {
    backgroundColor: '#B3261E',
  },
  success: {
    backgroundColor: '#6750A4',
  },
  disabled: {
    backgroundColor: '#E7E0EC',
    elevation: 0,
  },
  disabledText: {
    color: '#938F99',
  },
});

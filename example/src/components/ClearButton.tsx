import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ClearButtonProps {
  onPress: () => void;
}

export const ClearButton = ({ onPress }: ClearButtonProps) => {
  return (
    <View style={styles.clearButton}>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.clearButtonText}>X</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  clearButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
  },
  clearButtonText: {
    fontSize: 24,
  },
});

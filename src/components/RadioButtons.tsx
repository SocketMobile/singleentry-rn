import React from 'react';
import {Pressable, View, Text, StyleSheet, type PressableProps} from 'react-native';

interface RadioButtonData {
  label: string;
  value: string;
}

interface RadioButtonProps extends PressableProps {
  title: string;
  handleTriggerType: Function;
  value: string;
  data: RadioButtonData[]
}

const RadioButtons: React.FC<RadioButtonProps> = ({
  data,
  handleTriggerType,
  value,
  title,
}) => {
  return (
    <View style={RadioStyles.container}>
      <Text>{title}</Text>
      {data.map((item, i) => {
        return (
          <Pressable onPress={() => handleTriggerType(item.value)} key={i}>
            <Text
              style={
                item.value === value
                  ? RadioStyles.selected
                  : RadioStyles.radioButton
              }>
              {' '}
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default RadioButtons;

const RadioStyles = StyleSheet.create({
  container: {
    margin: 10,
  },
  radioButton: {
    backgroundColor: 'white',
    margin: 2,
    borderColor: 'black',
    borderWidth: 1,
  },
  selected: {
    borderColor: 'black',
    borderWidth: 1,
    backgroundColor: 'lightblue',
    margin: 2,
  },
});

import React from 'react';
import {Pressable, View, Text, StyleSheet} from 'react-native';

const RadioButtons = ({data, setTriggerType, value, title}) => {
  return (
    <View style={RadioStyles.container}>
      <Text>{title}</Text>
      {data.map((item, i) => {
        return (
          <Pressable onPress={() => setTriggerType(item.value)} key={i}>
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
    // color: 'white',
  },
});

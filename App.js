/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState } from 'react';

import {
  SafeAreaView,
  FlatList,
  StatusBar,
  Button,
  StyleSheet,
  Text,
  View,
  TextInput
} from 'react-native';


const App = () => {
  let status= 'No scanner connected';
  const [decodedData, setDecodedData] = useState({data: '', length: 0, name: ''});
  const [decodedDataList, setDecodedDataList] = useState([
    {data: '1233243242123', length: 13, name: 'EAN13', id: 1},
    {data: '033453243244', length: 12, name: 'UPC-A', id: 2},
    {data: '1233243242123', length: 13, name: 'EAN13', id: 3},
    {data: '1233243242123', length: 13, name: 'EAN13', id: 4},
    {data: '033453243244', length: 12, name: 'UPC-A', id: 5},
    {data: '033453243244', length: 12, name: 'UPC-A', id: 6},
    {data: '1233243242123', length: 13, name: 'EAN13', id: 7},
    {data: '1233243242123', length: 13, name: 'EAN13', id: 8},
    {data: '033453243244', length: 12, name: 'UPC-A', id: 9},
  ]);
  const clearHandler = () => {
    setDecodedDataList([]);
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.status}>
        <Text style={styles.title}>Status: {status}</Text>
      </View>
      <TextInput style={styles.input} value={decodedData.data}/>
      <FlatList 
        keyExtractor = {(item) => item.id}
        data = {decodedDataList}
        renderItem = {({item}) =>(
          <View>
            <Text>{item.name} ({item.length}) {item.data}</Text>
          </View>
        )}
      />
      <Button title="Clear" onPress={clearHandler}/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#aaa',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'red',
    borderWidth: 3
  },
  status:{
    padding: 30
  },
  title: {
    fontWeight: 'bold',
  },
  input: {
    width: '80%',
    height: 40,
    margin: 12,
    borderWidth: 1,
  },
});

export default App;

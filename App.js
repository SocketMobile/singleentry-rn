/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect, useCallback} from 'react';

import {
  SafeAreaView,
  FlatList,
  Button,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';

import {CaptureRn, CaptureEventIds} from 'beta-react-native-capture';
function arrayToString(dataArray) {
  return String.fromCharCode.apply(null, dataArray);
}

class MyLogger {
  log(message, arg) {
    console.log('SingleEntryRN: ' + message, arg);
  }
}

const myLogger = new MyLogger();
const capture = new CaptureRn(myLogger);
let dataId = 10;
let lastDecodedData = {
  name: '',
  length: 0,
  data: '',
};

const App = () => {
  const onCaptureEvent = useCallback(
    e => {
      if (!e) {
        return;
      }
      console.log('onCaptureEvent: ', e);
      switch (e.id) {
        case CaptureEventIds.DeviceArrival:
          const newDevice = new CaptureRn();
          newDevice
            .openDevice(e.value.guid, capture)
            .then(result => {
              console.log('opening a device returns: ', result);
              setStatus(`result of opening a device: ${result}`);
              setDevices(devices.push({guid: e.value.guid, device: newDevice}));
            })
            .catch(err => {
              console.log(err);
              setStatus(`error opening a device: ${err}`);
            });
          break;
        case CaptureEventIds.DeviceRemoval:
          const removeDevice = devices.find(d => d.guid === e.value.guid);
          if (!removeDevice) {
            return;
          }
          setDevices(devices.filter(d => d.guid !== e.value.guid));
          console.log('removeDevice: ', removeDevice);
          removeDevice.device
            .close()
            .then(result => {
              console.log('closing a device returns: ', result);
              setStatus(`result of closing a device: ${result}`);
            })
            .catch(err => {
              console.log(`error closing a device: ${err.message}`);
              setStatus(`error closing a device: ${err}`);
            });
          break;
        case CaptureEventIds.DecodedData:
          console.log('previous decoded data: ', lastDecodedData);
          if (lastDecodedData.length) {
            setDecodedDataList(prevList => {
              const newDecodedData = {...lastDecodedData};
              newDecodedData.id = dataId++;
              console.log('new decoded data id: ', newDecodedData.id);
              return [newDecodedData, ...prevList];
            });
          }
          lastDecodedData = {
            data: arrayToString(e.value.data),
            length: e.value.data.length,
            name: e.value.name,
          };
          setDecodedData(lastDecodedData);
          break;
      }
    },
    [devices],
  );
  const closeCapture = useCallback(() => {
    console.log('close Capture');
    capture
      .close()
      .then(result => {
        console.log('Success in closing Capture: ', result);
      })
      .catch(err => {
        console.log(`failed to close Capture: ${err}`);
      });
  }, []);
  const [devices, setDevices] = useState([{}]);
  const [status, setStatus] = useState('No scanner connected');
  const [decodedData, setDecodedData] = useState({
    data: '',
    length: 0,
    name: '',
  });
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

  useEffect(() => {
    const appInfo = {
      appId: 'web:com.socketmobile.SingleEntryRN',
      developerId: 'bb57d8e1-f911-47ba-b510-693be162686a',
      appKey:
        'MC4CFQCcoE4i6nBXLRLKVkx8jwbEnzToWAIVAJdfJOE3U+5rUcrRGDLuXWpz0qgu',
    };
    capture
      .open(appInfo, onCaptureEvent)
      .then(() => {
        setStatus('capture open success');
      })
      .catch(err => {
        console.error(err);
        setStatus(`failed to open Capture: ${err}`);
      });
    return closeCapture;
  }, [closeCapture, onCaptureEvent]);

  const clearHandler = () => {
    setDecodedDataList([]);
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.status}>
        <Text style={styles.title}>Status: {status}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={`${decodedData.name.toUpperCase()} (${decodedData.length}): ${
          decodedData.data
        }`}
        editable={false}
      />
      <FlatList
        keyExtractor={item => item.id}
        data={decodedDataList}
        renderItem={({item}) => (
          <View>
            <Text>
              {item.name.toUpperCase()} ({item.length}) {item.data}
            </Text>
          </View>
        )}
      />
      <Button title="Clear" onPress={clearHandler} />
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
    borderWidth: 3,
  },
  status: {
    padding: 30,
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

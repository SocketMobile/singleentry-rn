/**
 * Sample React Native App
 * https://github.com/socketmobile/SingleEntryRN
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

import {CaptureRn, CaptureEventIds, SktErrors, CaptureEventTypes, CaptureEvent, CaptureDataSourceID, CaptureDeviceType} from 'beta-react-native-capture';
function arrayToString(dataArray) {
  return String.fromCharCode.apply(null, dataArray);
}

// The logger can help to troubleshoot the communication
// with Capture, this is totally optional and CaptureRn
// can be instantiated directly without any argument
class MyLogger {
  log(message, arg) {
    arg = arg !== undefined ? arg : '';
    console.log('SingleEntryRN: ' + message, arg);
  }
  error(message, arg) {
    arg = arg !== undefined ? arg : '';
    console.error('SingleEntryRN: ' + message, arg);
  }
}

const myLogger = new MyLogger();
const capture = new CaptureRn();
let dataId = 10;
let lastDecodedData = {
  name: '',
  length: 0,
  data: '',
};

const App = () => {
  const onCaptureEvent = useCallback(
    (e, handle) => {
      if (!e) {
        return;
      }
      myLogger.log(`onCaptureEvent from ${handle}: `, e);
      switch (e.id) {
        // **********************************
        // Device Arrival Event
        //   a device needs to be opened in
        //   to receive the decoded data
        //  e = {
        //    id: CaptureEventIds.DeviceArrival,
        //    type: CaptureEventTypes.DeviceInfo,
        //    value: {
        //      guid: "b876d9a8-85b6-1bb5-f1f6-1bb5d78a2c6e",
        //      name: "Socket S740 [E2ABB4]",
        //      type: CaptureDeviceType.ScannerS740
        //    }
        //  }
        // **********************************
        case CaptureEventIds.DeviceArrival:
          const newDevice = new CaptureRn();
          const {guid, name} = e.value;
          newDevice
            .openDevice(guid, capture)
            .then(result => {
              myLogger.log('opening a device returns: ', result);
              setStatus(`result of opening ${e.value.name} : ${result}`);
              setDevices(prevDevices => {
                prevDevices = prevDevices || [];
                prevDevices.push({
                  guid,
                  name,
                  handle: newDevice.clientOrDeviceHandle,
                  device: newDevice,
                });
                return [...prevDevices];
              });
            })
            .catch(err => {
              myLogger.log(err);
              setStatus(`error opening a device: ${err}`);
            });
          break;
        // **********************************
        // Device Removal Event
        //   it is better to close the device
        //  e = {
        //    id: CaptureEventIds.DeviceRemoval,
        //    type: CaptureEventTypes.DeviceInfo,
        //    value: {
        //      guid: "b876d9a8-85b6-1bb5-f1f6-1bb5d78a2c6e",
        //      name: "Socket S740 [E2ABB4]",
        //      type: CaptureDeviceType.ScannerS740
        //    }
        //  }
        // **********************************
        case CaptureEventIds.DeviceRemoval:
          const removeDevice = devices.find(d => d.guid === e.value.guid);
          if (!removeDevice) {
            myLogger.log(`no matching devices found for ${e.value.name}`);
            return;
          }
          setDevices(prevDevices => {
            prevDevices = prevDevices.filter(d => d.guid !== e.value.guid);
            return prevDevices;
          });
          myLogger.log('removeDevice: ', removeDevice.name);
          removeDevice.device
            .close()
            .then(result => {
              myLogger.log('closing a device returns: ', result);
              setStatus(`result of closing ${removeDevice.name}: ${result}`);
            })
            .catch(err => {
              myLogger.log(`error closing a device: ${err.message}`);
              setStatus(`error closing a device: ${err}`);
            });
          break;
        // **********************************
        // Decoded Data
        //   receive the decoded data from
        //   a specific device
        //  e = {
        //    id: CaptureEventIds.DecodedData,
        //    type: CaptureEventTypes.DecodedData,
        //    value: {
        //      data: [55, 97, 100, 57, 53, 100, 97, 98, 48, 102, 102, 99, 52, 53, 57, 48, 97, 52, 57, 54, 49, 97, 51, 49, 57, 50, 99, 49, 102, 51, 53, 55],
        //      id: CaptureDataSourceID.SymbologyQRCode,
        //      name: "QR Code"
        //    }
        //  }
        // **********************************
        case CaptureEventIds.DecodedData:
          const deviceSource = devices.find(d => d.handle === handle);
          if (deviceSource) {
            setStatus(`decoded data from: ${deviceSource.name}`);
          }
          if (lastDecodedData.length) {
            setDecodedDataList(prevList => {
              const newDecodedData = {...lastDecodedData};
              newDecodedData.id = dataId++;
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
    myLogger.log('close Capture');
    capture
      .close()
      .then(result => {
        myLogger.log('Success in closing Capture: ', result);
      })
      .catch(err => {
        myLogger.log(`failed to close Capture: ${err}`);
      });
  }, []);
  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState('Opening Capture...');
  const [decodedData, setDecodedData] = useState({
    data: '',
    length: 0,
    name: '',
  });
  const [decodedDataList, setDecodedDataList] = useState([]);

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
        myLogger.error(err);
        setStatus(`failed to open Capture: ${err}`);
        // this is mostly for Android platform which requires
        // Socket Mobile Companion app to be installed
        if (err === SktErrors.ESKT_UNABLEOPENDEVICE) {
          setStatus('Is Socket Mobile Companion app installed?');
        }
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
    color: 'black',
  },
});

export default App;

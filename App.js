import React, {useState, useEffect, useRef} from 'react';

import {SafeAreaView, StyleSheet, Text, View, TextInput} from 'react-native';

import {
  CaptureRn,
  CaptureEventIds,
  SktErrors,
  SocketCamTypes,
  CaptureProperty,
  CapturePropertyIds,
  CapturePropertyTypes,
} from 'react-native-capture';

import SocketCam from './src/components/SocketCam.js';
import Footer from './src/components/Footer.js';
import MainView from './src/components/MainView.js';

function arrayToString(dataArray) {
  return String.fromCharCode.apply(null, dataArray);
}

const resToString = res => {
  return JSON.stringify(res, null, 4);
};

const appInfo = {
  appIdIos: 'ios:com.socketmobile.SingleEntryRN',
  appIdAndroid: 'android:com.newsingleentryrn',
  developerId: 'ecc6c526-970b-ec11-b6e6-0022480a2304',
  appKeyIos: 'MC0CFQDtJ9ja8/cOcZcTAyHRc272RhoxvgIUCzlrizAAtsYpTRLtsKjTigfgUPM=',
  appKeyAndroid:
    'MC0CFQCDPFMEiP0M3mjs5ZVx5S9ihuvYLwIUWDUCLUDGvNz7vef7czQPnMThQgQ=',
};

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

let lastDecodedData = {
  name: '',
  length: 0,
  data: '',
};

const App = () => {
  const [capture, setCapture] = useState(new CaptureRn());
  const [useSocketCam, setUseSocketCam] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  // deviceGuidMap is used to keep track of devices already
  // added to the list; meant to prevent adding a device twice
  const [deviceGuidMap, setDeviceGuidMap] = useState({});
  const [batteryLevel, setBatteryLevel] = useState('0%');
  const [status, setStatus] = useState('Opening Capture...');
  const [decodedData, setDecodedData] = useState({
    data: '',
    length: 0,
    name: '',
  });
  const [decodedDataList, setDecodedDataList] = useState([]);
  const [deviceCapture, setDeviceCapture] = useState(null);
  const [bleDeviceManagerCapture, setBleDeviceManagerCapture] = useState(null);
  const [newName, setNewName] = useState('');
  const [socketcamDevice, setSocketCamDevice] = useState(null);
  const [socketCamHandle, setSocketCamHandle] = useState(0);
  // useRef is required to reliably reference component state in a callback
  // that is executed outside of the scope of the component.
  // onCaptureEvent is not called directly by the component, but rather
  // by the capture instance managing events.
  const stateRef = useRef();

  stateRef.current = {
    devices,
    deviceCapture,
    bleDeviceManagerCapture,
    socketcamDevice,
    deviceGuidMap,
  };

  const onCaptureEvent = (e, handle) => {
    if (!e) {
      return;
    }

    myLogger.log(`onCaptureEvent from ${handle}: `, e);
    let devs = stateRef.current.devices;
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
        openDeviceHelper(newDevice, e, false, handle);
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
        let index = devs.findIndex(d => {
          return d.guid === e.value.guid;
        });

        if (index < 0) {
          myLogger.error(`no matching devices found for ${e.value.name}`);
          return;
        }

        let removeDevice = devs[index];

        myLogger.log('removeDevice: ', removeDevice.name);
        removeDevice.device
          .close()
          .then(result => {
            myLogger.log('closing a device returns: ', result);
            setStatus(`result of closing ${removeDevice.name}: ${result}`);
            devs = devs.splice(index, 1);
            setDevices(devs);
            let myMap = {...stateRef.current.deviceGuidMap};
            delete myMap[e.value.guid];
            setDeviceGuidMap(myMap);
            if (
              bleDeviceManagerCapture &&
              e.value.guid === bleDeviceManagerCapture.guid
            ) {
              setBleDeviceManagerCapture(null);
            } else {
              setDeviceCapture(null);
              setBatteryLevel('0%');
            }
          })
          .catch(res => {
            let {error} = res;
            let {message, code} = error;
            myLogger.error(`error closing a device: ${code}: ${message}`);
            setStatus(`error closing a device: ${code}: ${message}`);
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
        let dev = stateRef.current.devices.find(d => d.handle === handle);
        if (dev) {
          setStatus('Decoded Data from ' + dev.name);
        } else {
          setStatus('Decoded Data!');
        }
        setDecodedDataList(prevList => {
          const newDecodedData = {...lastDecodedData};
          newDecodedData.id = prevList.length + 1;
          return [newDecodedData, ...prevList];
        });
        lastDecodedData = {
          data: arrayToString(e.value.data),
          length: e.value.data.length,
          name: e.value.name,
        };
        setDecodedData(lastDecodedData);
        break;
      case CaptureEventIds.DeviceManagerArrival:
        const newBleDeviceManager = new CaptureRn();
        openDeviceHelper(newBleDeviceManager, e, true);
        break;
      case CaptureEventIds.DeviceManagerRemoval:
        setBleDeviceManagerCapture(null);
        break;
      default:
        console.log('DEFAULT');
        break;
    }
  };

  const openDeviceHelper = (dev, e, isManager, handle) => {
    let {name, guid, type} = e.value;
    let loggedOption = isManager ? 'device manager' : 'device';
    dev
      .openDevice(guid, capture)
      .then(result => {
        myLogger.log(`opening a ${loggedOption} returns: `, result);
        setStatus(`result of opening ${name} : ${result}`);
        let myMap = {...stateRef.current.deviceGuidMap};
        if (!myMap[guid] && !isManager) {
          dev.guid = guid;
          dev.type = type;
          let device = {
            guid,
            name,
            handle: dev.clientOrDeviceHandle,
            device: dev,
          };
          let devs = [...stateRef.current.devices, device];
          setDevices(devs);
          myMap[guid] = 1;
          setDeviceGuidMap(myMap);
        }
        if (!isManager) {
          // check for socket cam device type
          if (SocketCamTypes.indexOf(e.value.type) > -1) {
            setSocketCamHandle(handle);
            setSocketCamDevice(dev);
          } else {
            setDeviceCapture(dev);
          }
        } else {
          setBleDeviceManagerCapture(dev);
          getFavorite(dev);
        }
      })
      .catch(res => {
        var {error} = res;
        const {code, message} = error;
        myLogger.error(resToString(error));
        setStatus(`error opening a device: ${code} \n ${message}}`);
      });
  };

  const closeCapture = () => {
    capture
      .close()
      .then(result => {
        myLogger.log('Success in closing Capture: ', result);
        setStatus('Success in closing Capture.');
        setIsOpen(false);
      })
      .catch(err => {
        var error = resToString(err);
        myLogger.error(`failed to close Capture: ${error}`);
      });
  };

  useEffect(() => {
    openCapture();
  }, []);

  const openCapture = () => {
    capture
      .open(appInfo, onCaptureEvent)
      .then(data => {
        setStatus('capture open success');
        setIsOpen(true);
      })
      .catch(err => {
        myLogger.error(resToString(err));
        const {error} = err;
        const {code, message} = error;
        setStatus(`failed to open Capture: ${code} \n ${message}`);
        // this is for Android which requires Socket Mobile Companion
        if (err === SktErrors.ESKT_UNABLEOPENDEVICE) {
          setStatus('Is Socket Mobile Companion app installed?');
        }
      });
  };

  const clearAllScans = () => {
    setDecodedDataList([]);
  };

  const getFavorite = async dev => {
    var property = new CaptureProperty(
      CapturePropertyIds.Favorite,
      CapturePropertyTypes.None,
      {},
    );

    try {
      let favorite = await dev.getProperty(property);

      setStatus('retrieving BLE Device Manager favorite... ');
      if (favorite.value.length === 0) {
        setFavorite(dev);
      } else {
        setStatus('Favorite found! Try using an NFC reader!');
      }
    } catch (err) {
      myLogger.error(`${err.code} : ${err.message}`);
      setStatus(`failed to get favorite: ${err.code} : ${err.message}`);
    }
  };

  const setFavorite = async bleDevice => {
    var property = new CaptureProperty(
      CapturePropertyIds.Favorite,
      CapturePropertyTypes.String,
      '*',
    );

    try {
      var data = await bleDevice.setProperty(property);
      myLogger.log(JSON.stringify(data.value));
      setStatus(
        `successfully set favorite for BLE Device Manager: '${newName}' `,
      );
    } catch (res) {
      let {code, message} = res.error;
      myLogger.error(`${code} : ${message}`);
      setStatus(`failed to set favorite: ${code} : ${message}`);
    }
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
      {!useSocketCam ? (
        <MainView
          deviceCapture={deviceCapture}
          setStatus={setStatus}
          myLogger={myLogger}
        />
      ) : (
        <SocketCam
          setStatus={setStatus}
          myLogger={myLogger}
          socketcamDevice={socketcamDevice}
          socketCamHandle={socketCamHandle}
          socketcamCapture={capture}
          clientOrDeviceHandle={capture.clientOrDeviceHandle}
        />
      )}
      <Footer
        clearAllScans={clearAllScans}
        decodedDataList={decodedDataList}
        isOpen={isOpen}
        closeCapture={closeCapture}
        openCapture={openCapture}
        useSocketCam={useSocketCam}
        setUseSocketCam={setUseSocketCam}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  status: {
    padding: 15,
  },
  input: {
    width: '80%',
    height: 40,
    borderWidth: 1,
    color: 'black',
    fontSize: 10,
  },
});

export default App;

import React, {useState, useEffect, useRef} from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Platform,
} from 'react-native';

import {
  CaptureRn,
  CaptureEventIds,
  SktErrors,
  SocketCamTypes,
  CaptureProperty,
  CapturePropertyIds,
  CapturePropertyTypes,
  CaptureEvent,
  JRpcError,
  type AppInfoRn,
  type DeviceGuidMap,
  type DecodedData,
  type SocketLogger,
  type Notification,
  type CaptureDeviceInfo,
} from 'react-native-capture';

import SocketCam from './components/SocketCam';
import MainView from './components/MainView';

interface StateData {
  devices: CaptureDeviceInfo[];
  deviceCapture: CaptureRn | null;
  bleDeviceManagerCapture: CaptureRn | null;
  socketCamDevice: CaptureDeviceInfo | null;
  deviceGuidMap: DeviceGuidMap;
  isContinuousTrigger: boolean;
  isAndroid: boolean;
}

const initialState: StateData = {
  devices: [],
  deviceCapture: null,
  bleDeviceManagerCapture: null,
  socketCamDevice: null,
  deviceGuidMap: {},
  isContinuousTrigger: false,
  isAndroid: false,
};

const arrayToString = (dataArray: number[]) => {
  return String.fromCharCode.apply(null, dataArray);
};

const resToString = (res: any) => {
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
const myLogger: SocketLogger = {
  log(message: string, arg?: any) {
    arg = arg !== undefined ? arg : '';
    console.log('SingleEntryRN: ' + message, arg);
  },
  error(message: string, arg?: any) {
    arg = arg !== undefined ? arg : '';
    console.error('SingleEntryRN: ' + message, arg);
  },
};

let lastDecodedData: DecodedData = {
  name: '',
  length: 0,
  data: '',
  id: -1,
};

const App = () => {
  const [capture] = useState(new CaptureRn());
  const [useSocketCam, setUseSocketCam] = useState<boolean>(false);
  const [devices, setDevices] = useState<CaptureDeviceInfo[]>([]);
  // deviceGuidMap is used to keep track of devices already
  // added to the list; meant to prevent adding a device twice
  const [deviceGuidMap, setDeviceGuidMap] = useState<DeviceGuidMap>({});
  const [status, setStatus] = useState<string>('Opening Capture...');
  const [decodedData, setDecodedData] = useState<DecodedData>({
    data: '',
    length: 0,
    name: '',
  });
  const [deviceCapture, setDeviceCapture] = useState<CaptureRn | null>(null);
  const [bleDeviceManagerCapture, setBleDeviceManagerCapture] =
    useState<CaptureRn | null>(null);
  const [socketCamDevice, setSocketCamDevice] =
    useState<CaptureDeviceInfo | null>(null);
  const [isContinuousTrigger, setIsContinuousTrigger] =
    useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [openSocketCamView, setOpenSocketCamView] = useState<boolean>(false);
  // useRef is required to reliably reference component state in a callback
  // that is executed outside of the scope of the component.
  // onCaptureEvent is not called directly by the component, but rather
  // by the capture instance managing events.
  const stateRef = useRef<StateData>(initialState);

  stateRef.current = {
    devices,
    deviceCapture,
    bleDeviceManagerCapture,
    socketCamDevice,
    deviceGuidMap,
    isContinuousTrigger,
    isAndroid,
  };

  const onCaptureEvent = (e: CaptureEvent<any>, handle: number) => {
    if (!e) {
      return;
    }

    myLogger.log(`onCaptureEvent from ${handle}: `, e);
    let devs: CaptureDeviceInfo[] = [...stateRef.current.devices];
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
        openDeviceHelper(newDevice, e, false);
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
        let index = devs.findIndex((d: CaptureDeviceInfo) => {
          return d.guid === e.value.guid;
        });
        if (index < 0) {
          myLogger.error(`no matching devices found for ${e.value.name}`);
          return;
        } else {
          let removeDevice = devs[index];
          myLogger.log('removeDevice: ', removeDevice?.name);
          removeDevice!.devCapture
            .close()
            .then((result: number) => {
              myLogger.log('closing a device returns: ', `${result}`);
              setStatus(`result of closing ${removeDevice?.name}: ${result}`);
              devs.splice(index, 1);
              setDevices(devs);
              let myMap = {...stateRef.current.deviceGuidMap};
              delete myMap[e.value.guid];
              setDeviceGuidMap(myMap);
              let bleDeviceManagerCaptureDev =
                bleDeviceManagerCapture as CaptureDeviceInfo;
              if (
                bleDeviceManagerCaptureDev &&
                e.value.guid === bleDeviceManagerCaptureDev.guid
              ) {
                setBleDeviceManagerCapture(null);
              } else {
                setDeviceCapture(null);
              }
            })
            .catch((res: JRpcError) => {
              let {error} = res;
              let {message, code} = error;
              // The error code -38 is related to SocketCam extension closing the SocketCam device when you DISABLE SocketCam on android.
              // When you disable SocketCam, it closes the device via the extension so there is no need to close it in the React Native side.
              // It will not show up with other devices and therefore can be ignored.
              // Other error codes must be handled accordingly.
              if (code !== -38) {
                myLogger.error(`error closing a device: ${code}: ${message}`);
                setStatus(`error closing a device: ${code}: ${message}`);
              }
            });
        }
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
        let devWithInfo = stateRef.current.devices.find(
          (d: CaptureDeviceInfo) => {
            return d.handle === handle;
          },
        );

        if (devWithInfo) {
          setStatus('Decoded Data from ' + devWithInfo.name);
          if (e?.result === SktErrors.ESKT_CANCEL) {
            setOpenSocketCamView(false);
            // return here because we don't add this to the decodedDataList as it's a cancel event not a data scan.
            return;
          }
          if (SocketCamTypes.indexOf(devWithInfo.type) > -1) {
            setOpenSocketCamView(false);
          }
        } else {
          setStatus('Decoded Data!');
        }
        lastDecodedData = {
          data: arrayToString(e.value.data),
          length: e.value.data.length,
          name: e.value.name,
          id: -1, //number placeholder
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
      case CaptureEventIds.BatteryLevel:
        console.log('CaptureEventIds.batteryLevel: ', e);
        setStatus(`Battery has changed to ${e.value}%`);
        break;
      default:
        console.log('Event not handled: ', e.id);
        break;
    }
  };

  const handleIsContinuous = (v: boolean) => {
    setIsContinuousTrigger(v);
  };

  const genDevice = (
    dev: CaptureRn,
    guid: String,
    name: String,
    type: number,
  ) => {
    return {
      guid,
      name,
      type,
      handle: dev.clientOrDeviceHandle,
      devCapture: dev,
    } as CaptureDeviceInfo;
  };

  const openDeviceHelper = (
    dev: CaptureRn,
    e: CaptureEvent<any>,
    isManager: boolean,
  ) => {
    let {name, guid, type} = e.value;
    let loggedOption = isManager ? 'device manager' : 'device';
    dev
      .openDevice(guid, capture)
      .then((result: number) => {
        myLogger.log(`opening a ${loggedOption} returns: `, `${result}`);
        setStatus(`result of opening ${name} : ${result}`);
        let myMap = {...stateRef.current.deviceGuidMap};
        if (!myMap[guid] && !isManager) {
          let device = genDevice(dev, guid, name, type);
          let devs = [...stateRef.current.devices, device];
          setDevices(devs);
          myMap[guid] = '1';
          setDeviceGuidMap(myMap);
        }
        if (!isManager) {
          // check for SocketCam device type
          if (SocketCamTypes.indexOf(e.value.type) > -1) {
            let device = genDevice(dev, guid, name, type);
            setSocketCamDevice(device);
          } else {
            setDeviceCapture(dev);
          }
        } else {
          setBleDeviceManagerCapture(dev);
          getFavorite(dev);
        }
      })
      .catch((res: JRpcError) => {
        let {error} = res;
        const {code, message} = error;
        myLogger.error(resToString(error));
        setStatus(`error opening a device: ${code} \n ${message}}`);
      });
  };

  useEffect(() => {
    let isAndroid = Platform.OS === 'android';
    setIsAndroid(isAndroid);
    setUseSocketCam(false);
    openCapture();
  }, []);

  const openCapture = () => {
    capture
      .open(appInfo, onCaptureEvent as Notification)
      .then(() => {
        setStatus('CaptureSDK open with success');
        setUseSocketCam(true);
      })
      .catch((err: any) => {
        myLogger.error(resToString(err));
        const {error} = err;
        const {code, message} = error;
        setStatus(`Failed to open CaptureSDK: ${code} \n ${message}`);
        // this is for Android which requires Socket Mobile Companion
        if (code === SktErrors.ESKT_UNABLEOPENDEVICE) {
          setStatus('Is Socket Mobile Companion app installed?');
        }
      });
  };

  const getFavorite = async (dev: CaptureRn) => {
    let property = new CaptureProperty(
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
    } catch (err: any) {
      myLogger.error(`${err.code} : ${err.message}`);
      setStatus(`failed to get favorite: ${err.code} : ${err.message}`);
    }
  };

  const setFavorite = async (bleDevice: CaptureRn) => {
    let property = new CaptureProperty(
      CapturePropertyIds.Favorite,
      CapturePropertyTypes.String,
      '*',
    );

    try {
      let data = await bleDevice.setProperty(property);
      myLogger.log(JSON.stringify(data.value));
      setStatus(`successfully set favorite for BLE Device Manager!`);
    } catch (res: any) {
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
        <MainView
          deviceCapture={deviceCapture}
          setStatus={setStatus}
          myLogger={myLogger}
          devices={devices}
        />
      {useSocketCam ? (
        <SocketCam
          setStatus={setStatus}
          myLogger={myLogger}
          socketCamDevice={socketCamDevice}
          socketCamCapture={capture}
          clientOrDeviceHandle={capture.clientOrDeviceHandle}
          handleIsContinuous={handleIsContinuous}
          isAndroid={isAndroid}
          openSocketCamView={openSocketCamView}
          setOpenSocketCamView={setOpenSocketCamView}
        />
      ) : null}
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

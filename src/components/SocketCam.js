import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  NativeModules,
  DeviceEventEmitter,
  Platform,
} from 'react-native';
import {
  CapturePropertyIds,
  CapturePropertyTypes,
  CaptureProperty,
  Trigger,
} from 'react-native-capture';
import RadioButtons from './RadioButtons';

const {NativeCaptureModule} = NativeModules;

const androidSupportOpts = {
  1: {message: 'NOT_SUPPORTED', buttonText: 'Enable Support', value: 1},
  2: {message: 'SUPPORTED', buttonText: 'Disable Support', value: 2},
  3: {message: 'ENABLE', buttonText: 'Enable', value: 3},
  4: {message: 'Disable', buttonText: 'Disable', value: 4},
};

const iosSupportOpts = {
  0: {message: 'ENABLED', buttonText: 'Enable', value: 0},
  1: {message: 'Disable', buttonText: 'Disable', value: 1},
};

const androidInverse = {
  3: 4,
  4: 3,
};

const iosInverse = {
  0: 1,
  1: 0,
};

const triggerOptions = [
  {label: 'Start', value: Trigger.Start},
  {label: 'Stop', value: Trigger.Stop},
  {label: 'Continuous Scan', value: Trigger.ContinuousScan},
];

const errorCheck = error => {
  return error?.error || error;
};

const Button = props => {
  const {onPress, title = 'Save', disabled, style} = props;

  return (
    <Pressable style={style} onPress={onPress} disable={disabled}>
      <Text style={SocketCamStyles.buttonText}>{title}</Text>
    </Pressable>
  );
};

const SocketCam = ({
  socketcamCapture,
  setStatus,
  myLogger,
  socketcamDevice,
  disabled,
  clientOrDeviceHandle,
}) => {
  const [socketCamEnabled, setSocketCamEnabled] = useState(0);
  const [triggerType, setTriggerType] = useState(1);
  const [socketCamExtensionStatus, setSocketCamExtensionStatus] = useState(
    'Not Ready',
  );
  const [inverse, setInverse] = useState({});
  const [supportOpts, setSupportOpts] = useState({});
  const [os, setOs] = useState(0);
  useEffect(() => {
    if (clientOrDeviceHandle) {
      if (Platform.OS === 'android') {
        setOs(1);
        setInverse(androidInverse);
        setSupportOpts(androidSupportOpts);
        startSocketCamExtension(clientOrDeviceHandle);
      } else {
        setOs(0);
        setInverse(iosInverse);
        setSupportOpts(iosSupportOpts);
        genericGetProperty('SocketCamStatus', true);
      }
    }
  }, [clientOrDeviceHandle]);

  useEffect(() => {
    if (socketcamDevice) {
      setStatus('Setting Overlay View...');
      setOverlayView();
    }
  }, [socketcamDevice]);

  const socketCamExtensionCallback = eventData => {
    const {message, status} = eventData;
    myLogger.log('SocketCamExtension', message);
    setSocketCamExtensionStatus(message);
    if (status === 2) {
      genericGetProperty('SocketCamStatus', true);
    }
  };

  const startSocketCamExtension = handle => {
    setSocketCamExtensionStatus('Starting...');

    DeviceEventEmitter.addListener(
      'SocketCamExtension',
      socketCamExtensionCallback,
    );

    NativeCaptureModule.startSocketCamExtension(handle);
  };

  const setProvidedVal = (arg, data) => {
    switch (arg) {
      case 'SocketCamStatus':
        setSocketCamEnabled(data);
        break;
      case 'TriggerDevice':
        // TO DO
        break;
    }
  };

  const genericGetProperty = async (propertyArg, fromCallback) => {
    var property = new CaptureProperty(
      CapturePropertyIds[propertyArg],
      CapturePropertyTypes.None,
      {},
    );

    try {
      var data = await socketcamCapture.getProperty(property);
      myLogger.log(JSON.stringify(data.value));

      var x = supportOpts[data.value];
      setProvidedVal(propertyArg, data.value);
      if (!fromCallback) {
        setStatus(`successfully retrieved ${propertyArg}: '${x.message}' `);
      }
    } catch (error) {
      var err = errorCheck(error);
      myLogger.error(`${err.code} : ${err.message}`);
      setStatus(`failed to get ${propertyArg}: ${err.code} : ${err.message}`);
    }
  };

  const setSocketCamStatus = async arg => {
    var property = new CaptureProperty(
      CapturePropertyIds.SocketCamStatus,
      CapturePropertyTypes.Byte,
      arg,
    );

    try {
      var data = await socketcamCapture.setProperty(property);
      myLogger.log(arg);
      myLogger.log(socketCamEnabled);
      setSocketCamEnabled(data);
      setStatus(
        `successfully changed socket cam status: '${supportOpts[arg].message}'`,
      );
      genericGetProperty('SocketCamStatus', true);
    } catch (error) {
      var err = errorCheck(error);
      myLogger.error(`${err.code} : ${err.message}`);
      setStatus(
        `failed to set socket cam status: ${err.code} : ${err.message}`,
      );
    }
  };

  const setSocketCamTrigger = async () => {
    var property = new CaptureProperty(
      CapturePropertyIds.TriggerDevice,
      CapturePropertyTypes.Byte,
      triggerType,
    );

    try {
      var data = await socketcamDevice.setProperty(property);
      var triggerOpt = triggerOptions.find(x => x.value === triggerType);
      setStatus(`successfully changed TriggerDevice: '${triggerOpt?.label}'`);
    } catch (error) {
      var err = errorCheck(error);
      myLogger.error(`${err.code} : ${err.message}`);
      setStatus(`failed to set TriggerDevice: ${err.code} : ${err.message}`);
    }
  };

  const setOverlayView = async () => {
    var property = new CaptureProperty(
      CapturePropertyIds.OverlayViewDevice,
      CapturePropertyTypes.Object,
      {
        SocketCamContext: 0x1234,
      },
    );

    try {
      await socketcamDevice.setProperty(property);
      setStatus('successfully set OverlayView!');
    } catch (error) {
      var err = errorCheck(error);
      myLogger.error(`${err.code} : ${err.message}`);
      setStatus(`failed to set OverlayView: ${err.code} : ${err.message}`);
    }
  };

  const socketCamValueHelper = () => {
    if (Platform.OS === 'android') {
      return socketCamEnabled === 1 ? 2 : inverse[socketCamEnabled];
    } else {
      return inverse[socketCamEnabled];
    }
  };

  return (
    <View style={SocketCamStyles.socketContainer}>
      <Button
        title={
          socketCamEnabled === 3 || socketCamEnabled === 0
            ? 'Disable'
            : 'Enable'
        }
        onPress={() => setSocketCamStatus(socketCamValueHelper())}
        disabled={!socketcamCapture || socketCamEnabled === 1}
        style={
          socketCamEnabled === 3 || socketCamEnabled === 0
            ? SocketCamStyles.disableBtn
            : SocketCamStyles.enableBtn
        }></Button>
      <Text style={SocketCamStyles.titleText}> SOCKET CAM </Text>
      {os ? (
        <Text> SOCKET CAM EXTENSION STATUS: {socketCamExtensionStatus} </Text>
      ) : null}
      <View style={SocketCamStyles.innerContainer}>
        {!socketcamCapture ? (
          <Text>Open Capture To Try Socket Cam!</Text>
        ) : (
          <Text>
            {socketCamEnabled === 4 || socketCamEnabled === 1
              ? 'Enable Socket Cam (top right) to get started!'
              : null}
          </Text>
        )}
        {!socketcamDevice ? (
          <Text>No Socket Cam Device Found.</Text>
        ) : (
          <>
            {socketCamEnabled === 3 || socketCamEnabled === 0 ? (
              <View
                style={{
                  width: '50%',
                  flexDirection: 'row',
                }}>
                <RadioButtons
                  title="Scan Trigger Type"
                  data={triggerOptions}
                  setTriggerType={setTriggerType}
                  value={triggerType}
                />
                <Button
                  title="Open Socket Cam!"
                  disabled={disabled}
                  onPress={setSocketCamTrigger}
                  style={{
                    ...SocketCamStyles.button,
                    marginLeft: 5,
                    width: '100%',
                  }}></Button>
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
};

export default SocketCam;

const button = {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 5,
  paddingHorizontal: 6,
  borderRadius: 4,
  elevation: 3,
  backgroundColor: 'blue',
  zIndex: 10,
  elevation: 10,
};

const absBtn = {
  position: 'absolute',
  top: 5,
  right: 5,
};

const SocketCamStyles = StyleSheet.create({
  socketContainer: {
    height: 350,
    padding: 10,
    margin: 10,
    width: '100%',
  },
  innerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button,
  buttonText: {
    color: 'white',
  },
  enableBtn: {
    ...button,
    ...absBtn,
    backgroundColor: 'green',
  },
  disableBtn: {
    ...button,
    ...absBtn,
    backgroundColor: 'red',
  },
  dropdownView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    flexDirection: 'row',
    zIndex: 1000,
  },
});

import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  CaptureRn,
  Trigger,
  type CaptureDeviceInfo,
  CaptureHelper,
} from 'react-native-capture';
import RadioButtons from './RadioButtons';
import {SocketCamViewContainer} from 'react-native-capture';
// import RNSocketCamCustomViewManager from './RNSocketCamCustomViewManager';

interface ButtonProps extends PressableProps {
  onPress: () => void;
  title?: string;
  disabled?: boolean;
  style?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  title = 'Save',
  disabled,
  style,
}) => {
  return (
    <Pressable style={style} onPress={onPress} disabled={disabled}>
      <Text style={SocketCamStyles.buttonText}>{title}</Text>
    </Pressable>
  );
};

interface SocketCamProps {
  socketCamCapture: CaptureRn;
  setStatus: Function;
  myLogger?: any;
  socketCamDevice: CaptureDeviceInfo | null;
  clientOrDeviceHandle: number;
  handleIsContinuous: Function;
  isAndroid: boolean;
  openSocketCamView: boolean;
  setOpenSocketCamView: React.Dispatch<React.SetStateAction<boolean>>;
}

const SocketCam: React.FC<SocketCamProps> = ({
  socketCamCapture,
  setStatus,
  myLogger,
  socketCamDevice,
  clientOrDeviceHandle,
  handleIsContinuous,
  isAndroid,
  openSocketCamView,
  setOpenSocketCamView,
}) => {
  const [socketCamEnabled, setSocketCamEnabled] = useState<number>(1);
  const [triggerType, setTriggerType] = useState<number>(1);
  const [socketCamExtensionStatus, setSocketCamExtensionStatus] =
    useState<string>('Not Ready');

  const handleTriggerType = (value: string) => {
    // need to pass this to App.tsx so it can tell in DecodedData whether or not to close UIViewController on iOS
    let isCont = value === Trigger.ContinuousScan.toString();
    handleIsContinuous(isCont);
    setTriggerType(parseInt(value));
  };

  const handleOpenSocketCamView = () => {
    setOpenSocketCamView(!openSocketCamView);
  };

  const handleSetStatus = (stat: string) => {
    setStatus(stat);
  };

  const handleSetSocketCamExtensionStatus = (stat: string) => {
    setSocketCamExtensionStatus(stat);
  };

  const handleSetSocketCamEnabled = (stat: number) => {
    setSocketCamEnabled(stat);
  };

  return (
    <View style={SocketCamStyles.socketContainer}>
      <Text style={SocketCamStyles.titleText}> SOCKETCAM </Text>
      {/* If you want to see the status of the SocketCam extension on Android, use the below lines. Otherwise, these are optional. */}
      {isAndroid ? (
        <Text> SOCKETCAM EXTENSION STATUS: {socketCamExtensionStatus} </Text>
      ) : null}
      <View style={SocketCamStyles.innerContainer}>
        {!socketCamCapture ? <Text>Open Capture To Try SocketCam!</Text> : null}
        {!socketCamDevice ? (
          <Text>No SocketCam Device Found.</Text>
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
                  data={CaptureHelper.SocketCamTriggerOptions}
                  handleTriggerType={handleTriggerType}
                  value={triggerType.toString()}
                />
                <Button
                  title={
                    openSocketCamView ? 'Close SocketCam!' : 'Open SocketCam!'
                  }
                  onPress={handleOpenSocketCamView}
                  style={{
                    ...SocketCamStyles.button,
                    marginLeft: 5,
                    width: '100%',
                  }}></Button>
              </View>
            ) : null}
          </>
        )}
        <View>
          <SocketCamViewContainer
            openSocketCamView={openSocketCamView}
            handleSetSocketCamEnabled={handleSetSocketCamEnabled}
            clientOrDeviceHandle={clientOrDeviceHandle}
            triggerType={triggerType}
            socketCamCapture={socketCamCapture}
            socketCamDevice={socketCamDevice}
            myLogger={myLogger}
            handleSetStatus={handleSetStatus}
            handleSetSocketCamExtensionStatus={
              handleSetSocketCamExtensionStatus
            }
            socketCamCustomModalStyle={{
              presentationStyle: 'overFullScreen',
              animationType: 'fade',
              transparent: true,
            }}
            socketCamCustomStyle={SocketCamViewStyles.container}
            // androidSocketCamCustomView={
            // <RNSocketCamCustomViewManager
            //   isScanContinuous={triggerType === Trigger.ContinuousScan}
            // />}
          />
        </View>
      </View>
    </View>
  );
};

// here is where you declare your styles for SocketCamView
const SocketCamViewStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FDD7E4',
    alignSelf: 'stretch',
    flex: 1,
    alignItems: 'center',
    width: 200,
    position: 'relative',
    zIndex: 1, // so it doesn't hide dropdown
    elevation: -1, // elevation is zIndex for Android
  },
});

const button: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 5,
  paddingHorizontal: 6,
  borderRadius: 4,
  elevation: 3,
  backgroundColor: 'blue',
  zIndex: 10,
};

const absBtn: ViewStyle = {
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
    color: 'white',
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

export default SocketCam;

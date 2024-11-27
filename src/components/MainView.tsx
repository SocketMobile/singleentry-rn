import React, {useState} from 'react';
import {TextInput, Button, Text, View, StyleSheet, Platform} from 'react-native';
import {
  CaptureProperty,
  CapturePropertyTypes,
  CapturePropertyIds,
  type CaptureDeviceInfo,
  CaptureRn,
  CaptureDataSourceID,
  CaptureDataSourceFlags,
  CaptureDataSourceStatus,
} from 'react-native-capture';
import { CaptureDeviceTypeInterface } from 'socketmobile-capturejs/lib/gen/deviceTypes';

interface MainViewProps {
  deviceCapture: CaptureRn | null;
  setStatus: (status: string) => void;
  myLogger: any;
  devices: CaptureDeviceInfo[];
}

const MainView: React.FC<MainViewProps> = ({
  deviceCapture,
  setStatus,
  myLogger,
  devices,
}) => {
  const [newName, setNewName] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<string>('0%');

  const getFriendlyName = async () => {
    let property = new CaptureProperty(
      CapturePropertyIds.FriendlyNameDevice,
      CapturePropertyTypes.None,
      {},
    );

    try {
      let device = devices.find((device) => device.handle === deviceCapture!.clientOrDeviceHandle) as CaptureDeviceInfo;
      let data = await device.devCapture.getProperty(property);
      myLogger.log(JSON.stringify(data.value));
      setStatus(`successfully retrieved friendly name: '${data.value}' `);
    } catch (res: any) {
      let {code, message} = res.error;
      let str = `${code} : ${message}`;
      myLogger.error(str);
      setStatus(`failed to get friendlyName: ${str}`);
    }
  };

  const setFriendlyName = async () => {
    let property = new CaptureProperty(
      CapturePropertyIds.FriendlyNameDevice,
      CapturePropertyTypes.String,
      newName,
    );

    try {
      let device = devices.find((device) => device.handle === deviceCapture!.clientOrDeviceHandle) as CaptureDeviceInfo;
      let data = await device.devCapture.setProperty(property);
      myLogger.log(JSON.stringify(data.value));
      setStatus(`successfully changed friendly name: '${newName}' `);
    } catch (res: any) {
      let {code, message} = res.error;
      myLogger.error(`${code} : ${message}`);
      setStatus(`failed to set friendlyName: ${code} : ${message}`);
    }

    setNewName('');
  };

  const getBatteryLevel = async () => {
    let property = new CaptureProperty(
      CapturePropertyIds.BatteryLevelDevice,
      CapturePropertyTypes.None,
      {},
    );

    try {
      let device = devices.find((device) => device.handle === deviceCapture!.clientOrDeviceHandle) as CaptureDeviceInfo;
      let data = await device.devCapture.getProperty(property);
      let val = handleBatteryConversion(data);
      setStatus(`Successfully retrieved battery level: ${val}%`);
      setBatteryLevel(`${val}%`);
    } catch (err: any) {
      myLogger.error(`${err.code} : ${err.message}`);
      setStatus(`failed to get battery level: ${err.code} : ${err.message}`);
    }
  };

  const handleBatteryConversion = (data: any) => {
    let device = devices.find((device) => device.handle === deviceCapture!.clientOrDeviceHandle) as CaptureDeviceInfo;
    let deviceTypeInterface = (device.type >> 16) & 0xff;
    if (deviceTypeInterface == CaptureDeviceTypeInterface.Ble) {
      if (Platform.OS === 'ios') {
        return (data.value & 0xff00) >> 8;
      } else {
        return data.value;
      }
    } else {
      return (data.value & 0xff00) >> 8;
    }
  };

  const getSymbologyStatus = async () => {
    let property = new CaptureProperty(
      CapturePropertyIds.DataSourceDevice,
      CapturePropertyTypes.DataSource,
      {
        id: CaptureDataSourceID.SymbologyEan13,
        flags: CaptureDataSourceFlags.Status,
      },
    );
    try {
      let device = devices.find((device) => device.handle === deviceCapture!.clientOrDeviceHandle) as CaptureDeviceInfo;
      let data = await device.devCapture.getProperty(property);
      myLogger.log(JSON.stringify(data));
      setStatus('successfully retrieved symbology!');
    } catch (res: any) {
      let {code, message} = res.error;
      myLogger.error(`${code} : ${message}`);
      setStatus(`failed to set symbology: ${code} : ${message}`);
    }
  };

  const setSymbology = async () => {
    let property = new CaptureProperty(
      CapturePropertyIds.DataSourceDevice,
      CapturePropertyTypes.DataSource,
      {
        id: CaptureDataSourceID.SymbologyEan13,
        flags: CaptureDataSourceFlags.Status,
        status: CaptureDataSourceStatus.Enable, // use CaptureDataSourceStatus.Disable to disable it
      },
    );

    try {
      let device = devices.find((device) => device.handle === deviceCapture!.clientOrDeviceHandle) as CaptureDeviceInfo;
      let data = await device.devCapture.setProperty(property);
      myLogger.log(JSON.stringify(data));
      setStatus('successfully set symbology!');
    } catch (res: any) {
      let {code, message} = res.error;
      myLogger.error(`${code} : ${message}`);
      setStatus(`failed to set symbology: ${code} : ${message}`);
    }
  };

  return (
    <View>
      <>
        <Button
          title="get symbology"
          onPress={getSymbologyStatus}
          disabled={deviceCapture === null}
        />
        <Button
          title="set symbology"
          onPress={setSymbology}
          disabled={deviceCapture === null}
        />
        <Button
          title="Get Friendly Name"
          onPress={getFriendlyName}
          disabled={deviceCapture === null}
        />
        {deviceCapture ? (
          <TextInput
            style={{...mainStyles.input, padding: 10, width: 200}}
            onChangeText={(val) => setNewName(val)}
            value={newName}
            placeholder="new name"
          />
        ) : (
          <Text style={{padding: 5, textAlign: 'center'}}>
            Please connect a physical device to get/set properties
          </Text>
        )}
        <Button
          title="Set Friendly Name"
          onPress={setFriendlyName}
          disabled={!deviceCapture || newName.length === 0}
        />
      </>
      <>
        <Button
          title="Get Battery Level"
          onPress={getBatteryLevel}
          disabled={deviceCapture === null}
        />
        {deviceCapture ? <Text>Battery Level: {batteryLevel}</Text> : null}
      </>
    </View>
  );
};

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
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

export default MainView;

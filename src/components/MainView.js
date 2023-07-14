import React, {useState, useEffect} from 'react';

import {TextInput, Button, Text, View, StyleSheet} from 'react-native';

import {
  CaptureProperty,
  CapturePropertyTypes,
  CapturePropertyIds,
  NFCDeviceTypes,
} from 'react-native-capture';

const MainView = ({deviceCapture, setStatus, myLogger}) => {
  const [newName, setNewName] = useState('');
  const [batteryLevel, setBatteryLevel] = useState('0%');

  const getFriendlyName = async () => {
    var property = new CaptureProperty(
      CapturePropertyIds.FriendlyNameDevice,
      CapturePropertyTypes.None,
      {},
    );

    try {
      var data = await deviceCapture.getProperty(property);
      myLogger.log(JSON.stringify(data.value));
      setStatus(`successfully retrieved friendly name: '${data.value}' `);
    } catch (res) {
      let {code, message} = res.error;
      let str = `${code} : ${message}`;
      myLogger.error(str);
      setStatus(`failed to get friendlyName: ${str}`);
    }
  };

  const setFriendlyName = async () => {
    var property = new CaptureProperty(
      CapturePropertyIds.FriendlyNameDevice,
      CapturePropertyTypes.String,
      newName,
    );

    try {
      var data = await deviceCapture.setProperty(property);
      myLogger.log(JSON.stringify(data.value));
      setStatus(`successfully changed friendly name: '${newName}' `);
    } catch (res) {
      let {code, message} = res.error;
      myLogger.error(`${code} : ${message}`);
      setStatus(`failed to set friendlyName: ${code} : ${message}`);
    }

    setNewName('');
  };

  const getBatteryLevel = async () => {
    var property = new CaptureProperty(
      CapturePropertyIds.BatteryLevelDevice,
      CapturePropertyTypes.None,
      {},
    );

    try {
      let data = await deviceCapture.getProperty(property);
      let val = handleBatteryConversion(data);
      setStatus(`Successfully retrieved battery level: ${val}%`);
      setBatteryLevel(`${val}%`);
    } catch (err) {
      myLogger.error(`${err.code} : ${err.message}`);
      setStatus(`failed to get battery level: ${err.code} : ${err.message}`);
    }
  };

  const handleBatteryConversion = data => {
    if (NFCDeviceTypes.indexOf(deviceCapture.type) > -1) {
      return data.value;
    } else {
      // Non NFC Battery is represented bitwise
      return (data.value & 0xff00) >> 8;
    }
  };

  return (
    <View>
      <>
        <Button
          title="Get Friendly Name"
          onPress={getFriendlyName}
          disabled={deviceCapture === null}
        />
        {deviceCapture ? (
          <TextInput
            style={{...mainStyles.input, padding: 10, width: 200}}
            onChangeText={val => setNewName(val)}
            value={newName}
            placeholder="new name"
          />
        ) : (
          <Text style={{padding: 5, textAlign: 'center'}}>
            Please connect a physical device to see/change properties
          </Text>
        )}
        <Button
          title="Set Friendly Name"
          onPress={setFriendlyName}
          disabled={!deviceCapture || newName.length == 0}
        />
      </>
      <>
        <Button
          title="Get Battery Level"
          onPress={getBatteryLevel}
          disabled={deviceCapture === null}
        />
        {deviceCapture ? (
          <Text>Battery Level: {batteryLevel}</Text>
        ) : (
          <Text style={{padding: 5}}>
            Please connect a physical device to see/change properties
          </Text>
        )}
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

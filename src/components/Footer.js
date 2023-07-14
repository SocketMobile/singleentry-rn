import React from 'react';

import {FlatList, Button, Text, View, StyleSheet} from 'react-native';

const Footer = ({
  clearAllScans,
  decodedDataList,
  isOpen,
  closeCapture,
  openCapture,
  useSocketCam,
  setUseSocketCam,
}) => {
  const toggleView = () => {
    setUseSocketCam(!useSocketCam);
  };

  return (
    <View style={footerStyles.container}>
      <Text style={{fontWeight: 'bold', margin: 10}}>Scanned Data</Text>
      <View style={footerStyles.scannedDataContainer}>
        {decodedDataList.length > 0 ? (
          <FlatList
            keyExtractor={item => item.id}
            data={decodedDataList}
            renderItem={({item}) => (
              <View>
                <Text>
                  - {item.name.toUpperCase()} ({item.length}) {item.data}
                </Text>
              </View>
            )}
          />
        ) : (
          <Text>No scans yet.</Text>
        )}
      </View>
      <View style={footerStyles.buttonGroup}>
        <Button title="Clear" onPress={clearAllScans} />
        <Button
          title={isOpen ? 'Close Capture Client' : 'Open Capture Client'}
          onPress={isOpen ? closeCapture : openCapture}
        />

        <Button
          title={!useSocketCam ? 'Socket Cam' : 'Back to Main'}
          onPress={toggleView}
        />
      </View>
    </View>
  );
};

const footerStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FDD7E4',
    alignSelf: 'stretch',
    flex: 1,
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    zIndex: -1, // so it doesn't hide dropdown
    elevation: -1, // elevation is zIndex for Android
  },
  scannedDataContainer: {
    maxHeight: 100,
  },
  buttonStyle: {
    backgroundColor: 'blue',
  },
  buttonGroup: {
    position: 'absolute',
    bottom: 0,
  },
  viewSwitchStyle: {
    textAlign: 'center',
  },
});

export default Footer;

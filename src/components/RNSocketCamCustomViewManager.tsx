import {requireNativeComponent} from 'react-native';

interface SocketCamCustomViewProps {
  isScanContinuous: boolean;
}

const RNSocketCamCustomViewManager =
  requireNativeComponent<SocketCamCustomViewProps>(
    'RNSocketCamCustomViewManager',
  );

export default RNSocketCamCustomViewManager;

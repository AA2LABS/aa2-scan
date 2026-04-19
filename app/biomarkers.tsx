import { SafeAreaView } from 'react-native';
import BiomarkerManager from './biomarker-manager';

export default function BiomarkersScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0804' }}>
      <BiomarkerManager />
    </SafeAreaView>
  );
}

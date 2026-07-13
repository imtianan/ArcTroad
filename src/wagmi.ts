import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arcTestnet } from './types';

export const config = getDefaultConfig({
  appName: 'ArcTroad',
  projectId: 'c910a5eaa7706e3837e0b8712d92dd13',
  chains: [arcTestnet],
  ssr: false,
});

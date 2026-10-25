import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '3K FC Official Website & Fan Platform',
    short_name: '3K FC',
    description: 'Official digital fan platform of 3K FC, Embu County, Kenya (FKF Premier League)',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0D12',
    theme_color: '#B91C1C',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

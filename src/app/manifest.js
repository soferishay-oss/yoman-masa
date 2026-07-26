export default function manifest() {
  return {
    name: 'יומן מסע',
    short_name: 'יומן',
    description: 'יומן מסע אישי לתלמידים',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/app-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/app-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      },
    ],
  };
}

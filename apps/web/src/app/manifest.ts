import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'KBM Timework',
        short_name: 'Timework',
        description: 'Sistem Penerbitan Otomatis untuk KBM Timework',
        start_url: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay'],
        background_color: '#f8fafc',
        theme_color: '#cd1717',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    }
}

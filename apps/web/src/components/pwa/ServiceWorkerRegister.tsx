'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('SW registration successful with scope: ', registration.scope);
                })
                .catch((err) => {
                    console.error('SW registration failed: ', err);
                });
        }
    }, []);

    return null;
}

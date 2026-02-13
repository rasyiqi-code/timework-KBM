'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Interface untuk event `beforeinstallprompt` yang merupakan PWA-specific browser API.
 * Belum masuk ke standard TypeScript DOM lib, jadi kita definisikan sendiri.
 */
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Extension untuk navigator iOS Safari yang memiliki properti `standalone` */
interface NavigatorStandalone extends Navigator {
    standalone?: boolean;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Cek apakah berjalan dalam standalone mode (PWA)
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as NavigatorStandalone).standalone
            || document.referrer.includes('android-app://');

        // Gunakan setTimeout agar tidak langsung setState di effect body
        setTimeout(() => setIsStandalone(isInStandaloneMode), 0);

        if (isInStandaloneMode) return;

        // Listen untuk event beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent mini-infobar
            e.preventDefault();
            // Simpan event untuk trigger nanti
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Tampilkan prompt instalasi
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleClose = () => {
        setShowPrompt(false);
        setDeferredPrompt(null); // Optional: if you want to prevent showing it again until reload
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 flex flex-col gap-4 relative overflow-hidden w-full max-w-sm">
                        {/* KBM Red Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#cd1717]" />

                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-start gap-4 mt-2">
                            <div className="w-12 h-12 rounded-lg bg-[#cd1717] flex items-center justify-center shrink-0">
                                <Download className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Install KBM Timework</h3>
                                <p className="text-sm text-slate-500 mt-1 leading-tight">
                                    Akses lebih cepat & fitur offline dengan menginstall aplikasi.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Nanti Saja
                            </button>
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-[#cd1717] rounded-lg hover:bg-[#a50f0f] transition-colors shadow-sm"
                            >
                                Install App
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

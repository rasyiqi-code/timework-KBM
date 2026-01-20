'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function InstallPrompt() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if running in standalone mode (PWA)
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        // Avoid direct state update in effect if possible, but here we need it for hydration match
        // We use a small timeout to avoid the "synchronous update" warning if needed, or just suppress
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsStandalone(isInStandaloneMode);

        if (isInStandaloneMode) return;

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            // Only show if not already dismissed in this session (optional, simpler to just show)
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
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-4 md:right-4 md:left-auto md:w-96"
                >
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 flex flex-col gap-4 relative overflow-hidden">
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

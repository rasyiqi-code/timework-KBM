'use client';

import { Download } from 'lucide-react';
import { type Dictionary } from '@/i18n/dictionaries';
import { getProjectColor } from './utils';

// We need to define the Project type structure used in the table
// Since we don't have a shared type file for this complex structure yet, we'll define a compatible interface here
// or import it if ProjectTable exports it. Ideally we should export it from ProjectTable or a types file.
// For now, let's look at ProjectTableProps to see the structure.

interface ProjectTableFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    protocolFilter: string;
    setProtocolFilter: (filter: string) => void;
    statusFilter: 'ALL' | 'ACTIVE' | 'COMPLETED';
    setStatusFilter: (filter: 'ALL' | 'ACTIVE' | 'COMPLETED') => void;
    colorFilter: string | null;
    setColorFilter: (filter: string | null) => void; // Allow passing function or value, but here we just pass value usually. Wait, setState accepts function. Let's simplify to value setter for this component interface.
    // Actually, checking usage: setColorFilter(prev => ...) is used. So it expects a state setter.
    // Let's type it as Dispatch<SetStateAction<string | null>>

    protocols?: { id: string, name: string }[];
    projects: {
        items: {
            status: string;
            updatedAt: Date;
            metadata: unknown;
            title: string;
        }[];
    }[]; // Minimal structure needed for getProjectColor
    handleExport: () => void;
    dict: Dictionary;
}

export function ProjectTableFilters({
    searchQuery,
    setSearchQuery,
    protocolFilter,
    setProtocolFilter,
    statusFilter,
    setStatusFilter,
    colorFilter,
    setColorFilter,
    protocols,
    projects,
    handleExport,
    dict
}: ProjectTableFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

            {/* Left Group: Search & Dropdowns */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto shrink-0">
                {/* Search Input */}
                <div className="relative w-full sm:w-56">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        placeholder={dict.project.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-[#cd1717] focus:border-[#cd1717] text-xs sm:text-sm transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={protocolFilter}
                            onChange={(e) => setProtocolFilter(e.target.value)}
                            className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-xs sm:text-sm text-slate-900 border-slate-200 focus:outline-none focus:ring-[#cd1717] focus:border-[#cd1717] rounded-md bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800 max-w-[150px] truncate"
                        >
                            <option value="ALL">{dict.project.allProtocols}</option>
                            {protocols?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-xs sm:text-sm text-slate-900 border-slate-200 focus:outline-none focus:ring-[#cd1717] focus:border-[#cd1717] rounded-md bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                        >
                            <option value="ALL">{dict.project.allStatus}</option>
                            <option value="ACTIVE">{dict.project.status.ACTIVE}</option>
                            <option value="COMPLETED">{dict.project.status.COMPLETED}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Middle Group: Color Legend (Scrollable) */}
            <div className="flex-1 w-full sm:w-auto min-w-0 border-l border-slate-200 pl-3 ml-1 dark:border-slate-700">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mask-gradient-right py-1">
                    {(() => {
                        // Dynamically generate legend from Visible Projects
                        const uniqueEffects = new Map<string, string>(); // color -> label
                        projects.forEach(p => {
                            const info = getProjectColor(p);
                            if (info && info.color && !uniqueEffects.has(info.color)) {
                                uniqueEffects.set(info.color, info.label);
                            }
                        });

                        if (uniqueEffects.size === 0) return <span className="text-xs text-slate-400 italic px-2">No active filters</span>;

                        return (
                            <>
                                {Array.from(uniqueEffects.entries()).map(([color, label]) => (
                                    <button
                                        key={color}
                                        onClick={() => setColorFilter(colorFilter === color ? null : color)}
                                        className={`h-6 px-2.5 rounded-full flex items-center gap-1.5 transition-all text-[10px] font-medium border whitespace-nowrap shrink-0 ${colorFilter === color
                                            ? `ring-2 ring-offset-1 ring-slate-400 border-transparent shadow-sm`
                                            : 'border-slate-200 hover:scale-105 dark:border-slate-700 bg-white dark:bg-slate-800'
                                            }`}
                                        title={`Filter: ${label}`}
                                        style={colorFilter === color ? { backgroundColor: color, color: '#000' } : {}}
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: color }} />
                                        <span className={colorFilter === color ? 'font-bold' : 'text-slate-600 dark:text-slate-300'}>{label}</span>
                                    </button>
                                ))}
                                {colorFilter && (
                                    <button
                                        onClick={() => setColorFilter(null)}
                                        className="text-xs text-slate-400 hover:text-slate-600 px-1 dark:text-slate-500 dark:hover:text-slate-300 whitespace-nowrap sticky right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                                    >
                                        Clear
                                    </button>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Right Group: Export */}
            <button
                onClick={handleExport}
                className="flex shrink-0 items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-sm text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
                title="Export to Excel"
            >
                <Download size={16} />
                <span className="hidden sm:inline">Export Excel</span>
            </button>
        </div>
    );
}

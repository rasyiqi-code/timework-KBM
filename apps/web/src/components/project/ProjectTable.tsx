'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { type Dictionary } from '@/i18n/dictionaries';
import { Trash2, Loader2, Download } from 'lucide-react';
import { deleteProject, getProjectsMatrix } from '@/actions/project';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useState, useTransition, useEffect } from 'react';

import { useProjectListRealtime } from '@/hooks/useProjectListRealtime';

type ProjectItemMetadata = {
    completionEffect?: {
        rowColor: string | null;
    } | null;
};

export interface ProjectTableProps {
    projects: {
        id: string;
        title: string;
        status: string;
        items: {
            id: string;
            title: string;
            status: string;
            updatedAt: Date;
            originProtocolItemId: string | null;
            metadata: unknown;
        }[];
    }[];
    headers: {
        id: string;
        title: string;
    }[];
    dict: Dictionary;
    nextCursor?: string;
    organizationId: string;
    currentUser?: { role: string } | null;
    protocols?: { id: string, name: string }[];
}

export function ProjectTable({ projects: initialProjects, headers, dict, nextCursor: initialNextCursor, organizationId, currentUser, protocols }: ProjectTableProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);

    // Sync state with props on router.refresh()
    useEffect(() => {
        setProjects(initialProjects);
        setNextCursor(initialNextCursor);
    }, [initialProjects, initialNextCursor]);
    const [isPending, startTransition] = useTransition();
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Filter Logic State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
    const [protocolFilter, setProtocolFilter] = useState<string>('ALL');

    // Resizable Column Logic State
    const [colWidth, setColWidth] = useState(350);
    const [isResizing, setIsResizing] = useState(false);

    // Enable Realtime Updates
    useProjectListRealtime(organizationId);

    // Resizable Column Effect
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            setColWidth(prev => {
                const newWidth = prev + e.movementX;
                return Math.max(200, Math.min(800, newWidth)); // Min 200px, Max 800px
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.body.style.cursor = 'col-resize';
    };

    const handleDelete = (id: string) => {
        if (confirm(dict.project.deleteConfirm)) {
            startTransition(async () => {
                try {
                    await deleteProject(id);
                    toast.success(dict.project.deleteSuccess);
                    // Optimistically remove from list
                    setProjects(prev => prev.filter(p => p.id !== id));
                } catch {
                    toast.error(dict.project.deleteError);
                }
            });
        }
    };

    const handleExport = () => {
        const rows = filteredProjects.map(project => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const total = project.items.length;
            const done = project.items.filter(i => i.status === 'DONE').length;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;
            const effectiveStatus = percent === 100 ? 'COMPLETED' : project.status;

            // Base Row Data
            const rowData: Record<string, string | number> = {
                'Project Title': project.title,
                'Status': effectiveStatus,
                'Progress (%)': percent,
                'Completed Steps': `${done}/${total}`,
            };

            // Dynamic Columns (Steps)
            headers.forEach(header => {
                const item = project.items.find(i =>
                    i.originProtocolItemId === header.id ||
                    (i.title === header.title && !i.originProtocolItemId)
                );

                if (item) {
                    const isDone = item.status === 'DONE';
                    // Format: "DONE (Date) (Time)" or "STATUS"
                    rowData[header.title] = isDone
                        ? `DONE (${format(new Date(item.updatedAt), 'dd/MM/yyyy HH:mm')})`
                        : dict.project.status[item.status as keyof typeof dict.project.status] || item.status;
                } else {
                    rowData[header.title] = '-';
                }
            });

            return rowData;
        });

        // Create Worksheet
        const worksheet = XLSX.utils.json_to_sheet(rows);

        // Adjust Column Widths (Optional but good for UX)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const colWidths = Object.keys(rows[0] || {}).map(key => ({
            wch: Math.max(key.length, 15) // Min width 15 chars
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (worksheet as any)['!cols'] = colWidths;

        // Create Workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");

        // Download
        XLSX.writeFile(workbook, `Timework_Export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
    };

    const handleLoadMore = async () => {
        if (!nextCursor || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const { projects: newProjects, nextCursor: newCursor } = await getProjectsMatrix(50, nextCursor);
            setProjects(prev => [...prev, ...newProjects as unknown as ProjectTableProps['projects']]);
            setNextCursor(newCursor);
        } catch {
            toast.error(dict.common.error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const getProjectRowStyle = (project: ProjectTableProps['projects'][0]) => {
        const total = project.items.length;
        const done = project.items.filter(i => i.status === 'DONE');

        // 1. All Done -> Green (Global Rule)
        if (total > 0 && done.length === total) {
            // We can check if the last item dictates a specific color, if so, prefer that?
            // Or prefer "All Done" green? 
            // Let's defer to the explicit metadata of the last item if present, otherwise default to All Done Green?
            // User prompt said: "Apabila semua tahapan sudah di isi alias clear semuanya maka warna berubah menjadi Hijau"
            return 'bg-emerald-100 hover:bg-emerald-200 transition-colors dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30';
        }

        // 2. Check for completion effects
        if (done.length > 0) {
            // Sort descending by updatedAt (most recent first)
            const lastDone = [...done].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

            const meta = lastDone.metadata as unknown as ProjectItemMetadata;
            const rowColor = meta?.completionEffect?.rowColor;

            if (rowColor) {
                // Map legacy 50 values to 100 for brighter look
                if (rowColor === 'bg-red-50' || rowColor === 'bg-red-100') return 'bg-red-100 hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:hover:bg-red-900/40';
                if (rowColor === 'bg-amber-50' || rowColor === 'bg-amber-100') return 'bg-amber-100 hover:bg-amber-200 transition-colors dark:bg-amber-900/30 dark:hover:bg-amber-900/40';
                if (rowColor === 'bg-emerald-50' || rowColor === 'bg-emerald-100') return 'bg-emerald-100 hover:bg-emerald-200 transition-colors dark:bg-emerald-900/30 dark:hover:bg-emerald-900/40';
                return rowColor;
            }
        }

        // Default
        return 'hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30';
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());

        // Dynamic Status Logic for Filter
        const total = project.items.length;
        const done = project.items.filter(i => i.status === 'DONE').length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        const effectiveStatus = percent === 100 ? 'COMPLETED' : project.status;

        const matchesStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;

        // Protocol Filter (Check protocolId if available, or try to infer? Assuming protocolId exists on project or strict typing will fail)
        // We need to cast project to any or update type definition to include protocolId
        // The projects prop type definition below needs update.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchesProtocol = protocolFilter === 'ALL' || (project as any).protocolId === protocolFilter;

        return matchesSearch && matchesStatus && matchesProtocol;
    });

    if (projects.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                    🚀
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1 dark:text-slate-200">{dict.project.noProjects}</h3>
                <p className="text-slate-500 text-xs max-w-xs mx-auto dark:text-slate-400">
                    {dict.project.noProjectsDesc}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
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

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Protocol Filter */}
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={protocolFilter}
                            onChange={(e) => setProtocolFilter(e.target.value)}
                            className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-xs sm:text-sm text-slate-900 border-slate-200 focus:outline-none focus:ring-[#cd1717] focus:border-[#cd1717] rounded-md bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800 max-w-[180px] truncate"
                        >
                            <option value="ALL">{dict.project.allProtocols}</option>
                            {protocols?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
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

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-[#cd1717] focus:border-[#cd1717] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        title="Export to Excel"
                    >
                        <Download size={14} />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto scrollbar-hover rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative max-h-[75vh]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
                            <th
                                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap sticky left-0 bg-slate-50 z-20 dark:bg-slate-900 dark:text-slate-400 group/th relative"
                                style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                            >
                                {dict.project.title}
                                {/* Resizer Handle */}
                                <div
                                    onMouseDown={startResizing}
                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#cd1717] active:bg-[#a50f0f] transition-colors z-30"
                                ></div>
                            </th>
                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap border-l border-slate-100 dark:border-slate-800 dark:text-slate-400">
                                {dict.project.detail.progress}
                            </th>
                            {headers.map(header => (
                                <th key={header.id} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap border-l border-slate-100 dark:border-slate-800 dark:text-slate-400">
                                    {header.title}
                                </th>
                            ))}
                            {(currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')) && (
                                <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 text-right sticky right-0 bg-slate-50 z-20 dark:bg-slate-900 dark:text-slate-400">
                                    {dict.project.detail.settings}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredProjects.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="py-12 text-center text-slate-500 text-sm">
                                    No projects matching your filter.
                                </td>
                            </tr>
                        ) : (
                            filteredProjects.map(project => {
                                // Calculate Status dynamically
                                const total = project.items.length;
                                const done = project.items.filter(i => i.status === 'DONE').length;
                                const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                                const effectiveStatus = percent === 100 ? 'COMPLETED' : project.status;

                                return (
                                    <tr key={project.id} className={getProjectRowStyle(project)}>
                                        {/* Project Title Column */}
                                        <td
                                            className="px-4 py-2 sticky left-0 bg-white z-10 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800"
                                            style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                        >
                                            <Link href={`/projects/${project.id}`} className="group block" title={project.title}>
                                                <div className="flex items-center gap-2 w-full">
                                                    <span className="font-bold text-sm text-slate-800 group-hover:text-[#cd1717] transition-colors dark:text-slate-200 dark:group-hover:text-[#cd1717] truncate">
                                                        {project.title}
                                                    </span>
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${effectiveStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                                                        effectiveStatus === 'COMPLETED' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                                            'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                        }`}>
                                                        {dict.project.status[effectiveStatus as keyof typeof dict.project.status]}
                                                    </span>
                                                </div>
                                            </Link>
                                        </td>

                                        {/* Progress Column */}
                                        <td className="px-4 py-2 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                            <div className="w-24">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                        {percent}%
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                        {done}/{total}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-500' : 'bg-[#cd1717]'
                                                            }`}
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Dynamic Task Columns */}
                                        {headers.map(header => {
                                            // Find matching item in project
                                            const item = project.items.find(i =>
                                                i.originProtocolItemId === header.id ||
                                                (i.title === header.title && !i.originProtocolItemId) // Fallback by Title
                                            );

                                            if (!item) {
                                                return <td key={header.id} className="px-4 py-2 text-center border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
                                                    <span className="text-slate-300 text-xs dark:text-slate-700">-</span>
                                                </td>;
                                            }

                                            const isDone = item.status === 'DONE';

                                            return (
                                                <td key={header.id} className={`px-4 py-2 border-l border-slate-100 dark:border-slate-800 whitespace-nowrap ${isDone ? 'bg-emerald-50/10' : ''}`}>
                                                    {isDone ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                                {format(new Date(item.updatedAt), 'dd/MM/yyyy')}
                                                            </span>
                                                            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70">
                                                                {format(new Date(item.updatedAt), 'HH:mm')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 opacity-50">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'IN_PROGRESS' ? 'bg-amber-400' :
                                                                item.status === 'OPEN' ? 'bg-[#cd1717]' : 'bg-slate-300'
                                                                }`}></span>
                                                            <span className="text-[10px] text-slate-400 uppercase font-medium dark:text-slate-600">
                                                                {dict.project.status[item.status as keyof typeof dict.project.status].replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}

                                        {/* Actions Column (Admin Only) */}
                                        {(currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')) && (
                                            <td className="px-4 py-2 text-right sticky right-0 bg-white z-10 dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => handleDelete(project.id)}
                                                    disabled={isPending}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors dark:hover:bg-red-900/20"
                                                    title={dict.common.delete}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div >

            {nextCursor && (
                <div className="flex justify-center pt-2">
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
                    >
                        {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isLoadingMore ? dict.project.loadingMore : dict.project.loadMore}
                    </button>
                </div>
            )
            }
        </div >
    );
}

'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { type Dictionary } from '@/i18n/dictionaries';
import { Trash2, Loader2, Download, Paperclip, Lock } from 'lucide-react';
import { deleteProject, getProjectsMatrix } from '@/actions/project';
import { toast } from 'sonner';
import { useState, useTransition, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

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
            requireAttachment: boolean;
            files: unknown[];
            dependsOn?: { prerequisite: { id: string; title: string; status: string } }[];
            completedBy: { name: string | null } | null;
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
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [projects, setProjects] = useState(initialProjects);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);

    // Sync state with props on router.refresh()
    useEffect(() => {
        setProjects(initialProjects);
        setNextCursor(initialNextCursor);
    }, [initialProjects, initialNextCursor]);
    const [isPending, startTransition] = useTransition();
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Horizontal Scroll Logic with non-passive listener to prevent default page scroll
    useEffect(() => {
        const container = tableContainerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Filter Logic State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
    const [protocolFilter, setProtocolFilter] = useState<string>('ALL');
    const [colorFilter, setColorFilter] = useState<string | null>(null);

    // Extract Color Logic for reuse
    // Darker Colors for "Pekat" look
    const COLOR_MAP = {
        RED: '#890000',    // Deep Red/Maroon
        AMBER: '#b45309',  // Amber 700
        EMERALD: '#064e3b' // Emerald 900
    };

    const getProjectColor = (project: ProjectTableProps['projects'][0]) => {
        const total = project.items.length;
        const done = project.items.filter(i => i.status === 'DONE' || i.status === 'SKIPPED');

        // 1. All Done -> Green (Global Rule)
        if (total > 0 && done.length === total) {
            return { color: COLOR_MAP.EMERALD, label: 'All Completed' };
        }

        // 2. Check for completion effects
        if (done.length > 0) {
            // Sort by latest first
            const sortedDone = [...done].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            // Find the most recent item that has a row effect
            for (const item of sortedDone) {
                const meta = item.metadata as unknown as ProjectItemMetadata;
                const rowColor = meta?.completionEffect?.rowColor;

                if (rowColor) {
                    // Handle Legacy Classes -> Hex Map
                    if (rowColor.includes('red')) return { color: COLOR_MAP.RED, label: item.title };
                    if (rowColor.includes('amber')) return { color: COLOR_MAP.AMBER, label: item.title };
                    if (rowColor.includes('emerald')) return { color: COLOR_MAP.EMERALD, label: item.title };

                    // Assume Hex
                    return { color: rowColor, label: item.title };
                }
            }
        }
        return null;
    };

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

    const handleExport = () => {
        try {
            // Group projects by protocolId
            const projectsByProtocol = new Map<string, ProjectTableProps['projects']>();
            const protocolNames = new Map<string, string>();

            // Helper to get protocol name (best effort)
            // Ideally we should pass protocols map prop, but for now we iterate
            protocols?.forEach(p => protocolNames.set(p.id, p.name));

            filteredProjects.forEach(p => {
                // If protocolId is missing, group under 'Unknown' or 'Other'
                // We cast p as any because protocolId isn't in the strict type yet, but backend sends it.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const pId = (p as any).protocolId || 'OTHER';
                if (!projectsByProtocol.has(pId)) {
                    projectsByProtocol.set(pId, []);
                }
                projectsByProtocol.get(pId)?.push(p);
            });

            // Create Workbook
            const wb = XLSX.utils.book_new();
            let sheetCount = 0;

            projectsByProtocol.forEach((projectsGroup, protocolId) => {
                if (projectsGroup.length === 0) return;

                // Determine Headers for this filtered specific group
                // If we are filtering by one protocol, it matches the global headers.
                // If we are exporting ALL, we need to derive headers for THIS protocol's projects.
                // Strategy: Use the union of all item originProtocolItemId and Titles from projects in this group.

                const groupHeadersMap = new Map<string, string>(); // ID -> Title
                const groupHeadersOrder: string[] = []; // IDs in order

                // 1. If we have global headers matching this protocol (how do we know?)
                // Actually, relying on project items is safer for mixed exports.

                // Collect unique "Columns" based on originProtocolItemId (preferred) or Title
                projectsGroup.forEach(p => {
                    p.items.forEach(i => {
                        const key = i.originProtocolItemId || i.title;
                        if (!groupHeadersMap.has(key)) {
                            groupHeadersMap.set(key, i.title);
                            groupHeadersOrder.push(key);
                        }
                    });
                });

                // Sort headers? Maybe by appearance order in the first few projects is good enough heuristic 
                // or just keep insertion order. Better: Sort by simple heuristic if needed, but insertion order from multiple projects usually converges to the SOP order if projects are created from SOP.

                // Prepare Data
                const exportData = projectsGroup.map(project => {
                    const total = project.items.length;
                    const done = project.items.filter(i => i.status === 'DONE' || i.status === 'SKIPPED').length;
                    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const row: any = {
                        'Project Title': project.title,
                        'Status': dict.project.status[project.status as keyof typeof dict.project.status] || project.status,
                        'Progress': `${percent}%`,
                    };

                    // Fill Columns
                    groupHeadersOrder.forEach(key => {
                        const colTitle = groupHeadersMap.get(key) || key;

                        // Find item matching key
                        // Key is either ID or Title
                        const item = project.items.find(i =>
                            i.originProtocolItemId === key ||
                            (!i.originProtocolItemId && i.title === key)
                        );

                        if (item) {
                            const statusLabel = dict.project.status[item.status as keyof typeof dict.project.status]?.replace('_', ' ') || item.status;
                            const dateStr = (item.status === 'DONE' || item.status === 'SKIPPED') ? format(new Date(item.updatedAt), 'dd/MM/yyyy HH:mm') : '';

                            if (item.status === 'DONE') {
                                const doneBy = item.completedBy?.name ? ` by ${item.completedBy.name.split(' ')[0]}` : '';
                                row[colTitle] = `DONE${doneBy} (${dateStr})`;
                            } else if (item.status === 'SKIPPED') {
                                const skippedBy = item.completedBy?.name ? ` by ${item.completedBy.name.split(' ')[0]}` : '';
                                row[colTitle] = `SKIPPED${skippedBy} (${dateStr})`;
                            } else {
                                row[colTitle] = statusLabel;
                            }
                        } else {
                            row[colTitle] = '-';
                        }
                    });

                    return row;
                });

                // Sheet Name
                let sheetName = protocolNames.get(protocolId) || (protocolId === 'OTHER' ? 'Custom Projects' : `SOP ${sheetCount + 1}`);
                // Excel Sheet Name limit 31 chars
                if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);
                // Ensure unique sheet names
                if (wb.SheetNames.includes(sheetName)) {
                    sheetName = `${sheetName.substring(0, 28)} ${sheetCount}`;
                }

                const ws = XLSX.utils.json_to_sheet(exportData);

                // Auto-width
                const colWidths = Object.keys(exportData[0] || {}).map(key => ({
                    wch: Math.max(key.length, 20)
                }));
                ws['!cols'] = colWidths;

                XLSX.utils.book_append_sheet(wb, ws, sheetName);
                sheetCount++;
            });

            if (sheetCount === 0) {
                toast.error("No data to export");
                return;
            }

            // Generate filename with date
            const fileName = `KBM_Timework_Projects_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;

            // Download
            XLSX.writeFile(wb, fileName);
            toast.success("Export successful!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Export failed");
        }
    };

    const handleDelete = (id: string) => {
        if (confirm(dict.project.deleteConfirm)) {
            startTransition(async () => {
                try {
                    await deleteProject(id);
                    toast.success(dict.project.deleteSuccess);
                    setProjects(prev => prev.filter(p => p.id !== id));
                } catch {
                    toast.error(dict.project.deleteError);
                }
            });
        }
    };

    const handleLoadMore = async () => {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const { projects: newProjects, nextCursor: newCursor } = await getProjectsMatrix(12, nextCursor);
            setProjects(prev => [...prev, ...newProjects as unknown as ProjectTableProps['projects']]);
            setNextCursor(newCursor);
        } catch {
            toast.error(dict.common.error);
        } finally {
            setIsLoadingMore(false);
        }
    };



    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());

        // Dynamic Status Logic for Filter
        const total = project.items.length;
        const done = project.items.filter(i => i.status === 'DONE' || i.status === 'SKIPPED').length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        const effectiveStatus = percent === 100 ? 'COMPLETED' : project.status;

        const matchesStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;

        // Protocol Filter (Check protocolId if available, or try to infer? Assuming protocolId exists on project or strict typing will fail)
        // We need to cast project to any or update type definition to include protocolId
        // The projects prop type definition below needs update.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchesProtocol = protocolFilter === 'ALL' || (project as any).protocolId === protocolFilter;

        return matchesSearch && matchesStatus && matchesProtocol;
    }).sort((a, b) => {
        if (!colorFilter) return 0;

        const infoA = getProjectColor(a);
        const infoB = getProjectColor(b);

        const aMatches = infoA?.color === colorFilter;
        const bMatches = infoB?.color === colorFilter;

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
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
                                            onClick={() => setColorFilter(prev => prev === color ? null : color)}
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

            {/* Table Container with Horizontal Scroll on Wheel */}
            <div
                ref={tableContainerRef}
                className="overflow-x-auto scrollbar-hover rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative min-h-[calc(100vh-250px)]"
            >
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
                            <th
                                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-black whitespace-nowrap sticky left-0 bg-slate-50 z-20 dark:bg-slate-900 dark:text-slate-100 group/th relative"
                                style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                            >
                                {dict.project.title}
                                {/* Resizer Handle */}
                                <div
                                    onMouseDown={startResizing}
                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#cd1717] active:bg-[#a50f0f] transition-colors z-30"
                                ></div>
                            </th>
                            <th className="px-4 py-2 text-xs font-black uppercase tracking-wider text-black whitespace-nowrap border-l border-slate-100 dark:border-slate-800 dark:text-slate-100">
                                {dict.project.detail.progress}
                            </th>
                            {headers.map(header => (
                                <th key={header.id} className="px-4 py-2 text-xs font-black uppercase tracking-wider text-black whitespace-nowrap border-l border-slate-100 dark:border-slate-800 dark:text-slate-100">
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
                                const done = project.items.filter(i => i.status === 'DONE' || i.status === 'SKIPPED').length;
                                const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                                const effectiveStatus = percent === 100 ? 'COMPLETED' : project.status;

                                return (
                                    <tr
                                        key={project.id}
                                        className="hover:shadow-sm transition-all border-b border-slate-100 dark:border-slate-800"
                                        style={(() => {
                                            const info = getProjectColor(project);
                                            if (info?.color) return { backgroundColor: info.color + '40' }; // 25% opacity for row
                                            return {};
                                        })()}
                                    >
                                        {/* Project Title Column */}
                                        <td
                                            className="px-4 py-2 sticky left-0 bg-white z-10 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800"
                                            style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                        >
                                            <Link href={`/projects/${project.id}`} className="group block" title={project.title}>
                                                <div className="flex items-center gap-2 w-full">
                                                    <span className="font-bold text-sm text-slate-900 group-hover:text-[#cd1717] transition-colors dark:text-white dark:group-hover:text-[#cd1717] truncate">
                                                        {project.title}
                                                    </span>
                                                    <span className={`text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${effectiveStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-800' :
                                                        effectiveStatus === 'COMPLETED' ? 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800' :
                                                            'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
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
                                                        className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-700' : 'bg-[#890000]'
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
                                                return <td key={header.id} className="px-4 py-2 text-center border-l border-slate-100 dark:border-slate-800 bg-slate-200 dark:bg-black/40">
                                                    <span className="text-slate-400 text-xs dark:text-slate-600">-</span>
                                                </td>;
                                            }

                                            const isDone = item.status === 'DONE';
                                            const isSkipped = item.status === 'SKIPPED';

                                            // Render Cell
                                            return (
                                                <td key={header.id} className={`px-4 py-2 border-l border-slate-100 dark:border-slate-800 whitespace-nowrap ${isDone ? 'bg-emerald-50/10' : isSkipped ? 'bg-slate-50/50' : ''}`}>
                                                    {isDone || isSkipped ? (
                                                        <div className="flex flex-col relative group/info">
                                                            <span className={`text-xs font-bold ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                {isSkipped ? '⏭ SKIPPED' : format(new Date(item.updatedAt), 'dd/MM/yyyy')}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] ${isDone ? 'text-emerald-600/70 dark:text-emerald-500/70' : 'text-slate-400/70 dark:text-slate-500/70'}`}>
                                                                    {format(new Date(item.updatedAt), 'HH:mm')}
                                                                </span>
                                                                {item.files?.length > 0 && (
                                                                    <div className="flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500" title="Attachments">
                                                                        <Paperclip size={10} />
                                                                        <span>{item.files.length}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Done/Skipped By Tooltip */}
                                                            {item.completedBy?.name && (
                                                                <div className="absolute bottom-full left-0 mb-1 w-max hidden group-hover/info:block z-50">
                                                                    <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                                                        by {item.completedBy.name}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 opacity-50 relative group/status">
                                                            {item.status === 'LOCKED' ? (
                                                                <Lock size={12} className="text-slate-400" />
                                                            ) : (
                                                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'IN_PROGRESS' ? 'bg-amber-600' :
                                                                    item.status === 'OPEN' ? 'bg-[#890000]' : 'bg-slate-400'
                                                                    }`}></span>
                                                            )}
                                                            <span className="text-[10px] text-slate-700 uppercase font-bold dark:text-slate-400">
                                                                {item.status === 'LOCKED' ? 'LOCKED' : dict.project.status[item.status as keyof typeof dict.project.status].replace('_', ' ')}
                                                            </span>

                                                            {/* Contextual Lock Tooltip */}
                                                            {item.status === 'LOCKED' && item.dependsOn && item.dependsOn.length > 0 && (
                                                                <div className="absolute bottom-full left-0 mb-1 w-max max-w-[200px] hidden group-hover/status:block z-50">
                                                                    <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                                                                        <div className="font-bold mb-0.5">Wait For:</div>
                                                                        {item.dependsOn.map(dep => (
                                                                            <div key={dep.prerequisite.id} className="flex items-center gap-1">
                                                                                {dep.prerequisite.status === 'DONE' ? '✅' : '🔒'} {dep.prerequisite.title}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
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

            {
                nextCursor && (
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

'use client';

import { useState, useTransition } from 'react';
import { updateItemStatus } from '@/actions/project';
import { useRouter } from 'next/navigation';
import { AssigneeSelector } from './AssigneeSelector';
import { FolderOpen, StickyNote, CheckSquare } from 'lucide-react';
import { type ProjectItem, type ItemDependency } from '@repo/database';
import { type Dictionary } from '@/i18n/dictionaries';
import { toast } from 'sonner';
import { FileUploader } from '@/components/file/FileUploader';
import { Paperclip } from 'lucide-react';

type ProjectItemWithRelations = ProjectItem & {
    dependsOn: (ItemDependency & { prerequisite: ProjectItem })[];
    requiredBy: ItemDependency[];
    requireAttachment?: boolean; // Temporary fix for Prisma type sync issue
    attachmentUrl?: string | null;  // Temporary fix for Prisma type sync issue
    assignees: { id: string; name: string | null }[];
    files?: { id: string; name: string; url: string; size: number; createdAt: Date; type: string; uploadedBy: { name: string | null; email: string } }[];
};

import type { User } from '@repo/database';

interface ProjectItemCardProps {
    item: ProjectItemWithRelations;
    users: { id: string, name: string | null }[];

    currentUser: User | null;
    dict: Dictionary;
    projectOwnerId: string;
}

export function ProjectItemCard({ item, users, currentUser, dict, projectOwnerId }: ProjectItemCardProps) {
    const router = useRouter();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = (itemId: string, newStatus: string) => {
        startTransition(async () => {
            await updateItemStatus(itemId, newStatus);
            router.refresh();
        });
    };

    // handleFileUpload removed (replaced by FileUploader component)

    // Check for Group / Subtask
    const itemType = item.type || 'TASK';
    const parentId = item.parentId;
    const isGroup = itemType === 'GROUP';
    const isSubtask = !!parentId;

    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
    const isProjectOwner = currentUser?.id === projectOwnerId;
    const isAssignedToMe = currentUser?.id === item.assignedToId || item.assignees?.some(u => u.id === currentUser?.id);
    const isUnassigned = !item.assignedToId && (!item.assignees || item.assignees.length === 0);

    // Permissions:
    const isAdHoc = !item.originProtocolItemId;

    // Permissions Strategy:
    // 1. Ad-Hoc Items: Creator/Admin has full control (Title, Assignee, Desc, Delete)
    // 2. Standard Items: Title & Assignee are LOCKED. Description/Notes are Editable.

    // Who is "Creator" for AdHoc? 
    // We don't have item.createdById explicitly in this view, but we have `isAssignedToMe` (since we auto-assign creators).
    // Let's assume Admin or Assignee can edit AdHoc.
    const hasAdHocRights = isAdHoc && (isAdmin || isProjectOwner || isAssignedToMe);
    const hasStandardEditRights = isAdmin || isProjectOwner || isAssignedToMe || isUnassigned;

    const canEditTitle = hasAdHocRights;
    const canEditAssignee = hasAdHocRights;

    const canDelete = hasAdHocRights;

    // Legacy alias for "Can edit at least details" - used for Action Buttons
    const canEdit = hasAdHocRights || hasStandardEditRights;



    // Helper: Master switch for showing the "Lock/Unlock" button?
    // If user can't edit ANYTHING, hide lock button.
    // Actually, canEditDescription is almost always true for participants.
    const showEditToggle = canEdit;

    // Attachment check
    const requireAttachment = item.requireAttachment;
    const attachmentUrl = item.attachmentUrl;
    const isUploadMissing = requireAttachment && !attachmentUrl;

    // Visibility Logic: 
    // STRICT: Only show if Required OR has existing file OR is currently uploading.
    // Optional uploads are hidden to keep UI clean as requested.
    // Visibility Logic: 
    // STRICT: Only show if Required OR has existing file OR is currently uploading.
    // Optional uploads are hidden to keep UI clean as requested.
    const shouldShowAttachment = requireAttachment || attachmentUrl;

    // Fallback for Legacy Data: If assignees is empty but assignedToId exists, use it.
    const effectiveAssignees = (item.assignees && item.assignees.length > 0)
        ? item.assignees
        : (item.assignedToId ? [users.find(u => u.id === item.assignedToId)].filter(Boolean) as { id: string; name: string | null }[] : []);

    if (isGroup) {
        return (
            <div key={item.id} className="relative group md:pl-14 py-4 mt-2">
                <div className="absolute left-[39px] top-1/2 w-3 h-0.5 bg-slate-300 hidden md:block -translate-x-1.5 dark:bg-slate-700"></div>
                <div className="w-full bg-slate-100 border-y border-slate-200 py-2 px-4 flex items-center gap-2 dark:bg-slate-800 dark:border-slate-700">
                    <FolderOpen size={14} className="text-slate-500 dark:text-slate-400" />
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {item.title}
                    </h3>
                </div>
            </div>
        )
    }

    return (
        <div key={item.id} className={`relative group md:pl-14 py-0.5 ${isSubtask ? 'ml-8 pl-4' : ''}`}>
            {/* Timeline Dot / Date / Delete Action */}
            <div className={`absolute top-6 z-10 hidden md:flex items-center justify-center group/dot
                ${isSubtask ? 'left-[2px]' : 'left-[34px]'}
            `}>
                {/* The Dot Itself */}
                <div className={`rounded-full border-2 border-white shadow-sm shrink-0 w-3 h-3
                    ${item.status === 'DONE' ? 'bg-emerald-500 ring-2 ring-emerald-50' :
                        item.status === 'OPEN' ? 'bg-indigo-500 ring-2 ring-indigo-50' : 'bg-slate-300'}
                `}></div>

                {/* Left Side: Date & Delete (Swap on Hover) */}
                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-end w-32 pr-2
                    ${isSubtask ? 'right-[20px]' : 'right-5'}
                `}>
                    {/* Date Display (Reverted to standard right-5ish, using right-5 and right-[20px] just for minor adjustment if dot size differs) */}
                    {/* Actually dot size diff (w-2 vs w-3) is 4px diff (half). 
                        Standard dot (w-3) -> right-5 (20px). 
                        Subtask dot (w-2) -> right-[20px] seems fine. 
                        Wait, previously I used right-[54px]. I will strict reset to right-5. */}

                    <div className={`flex flex-col items-end transition-opacity duration-200 ${canDelete ? 'group-hover/dot:opacity-0' : ''}`}>
                        <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap leading-3">
                            {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[9px] text-slate-400 leading-3">
                            {new Date(item.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}
                        </span>
                    </div>

                    {/* Delete Button (Swaps in) */}
                    {canDelete && (
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Delete this task?')) {
                                    const { deleteProjectItem } = await import('@/actions/project');
                                    await deleteProjectItem(item.id);
                                }
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 opacity-0 group-hover/dot:opacity-100 transition-all scale-90 group-hover/dot:scale-100"
                            title="Delete Task"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Connection to Card */}
            <div className={`absolute top-[29px] h-px bg-slate-200 hidden md:block group-hover:bg-indigo-300 transition-colors 
                ${isSubtask ? 'left-[6px] w-[41px]' : 'left-[38px] w-5'}
            `}></div>

            {/* Subtask Vertical Marker (Gray Line) */}
            {isSubtask && (
                <div className="absolute left-[47px] top-3 bottom-3 w-1 bg-slate-200 rounded-full hidden md:block dark:bg-slate-700"></div>
            )}

            {/* Compact Card */}
            <div
                className={`
                w-full px-4 py-3 rounded-lg border transition-all duration-200 relative
                ${item.status === 'LOCKED'
                        ? 'bg-slate-50 border-slate-200/60 grayscale opacity-70 dark:bg-slate-900/50 dark:border-slate-800'
                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-500'
                    }
            `}
                style={item.color ? { borderLeftColor: item.color, borderLeftWidth: '4px' } : {}}
            >
                {/* Per-Card Edit Toggle: Top Right Corner */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
                    {item.status !== 'LOCKED' && showEditToggle && (
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`p-0.5 rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-all dark:hover:bg-slate-800 ${isEditMode ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/40' : ''}`}
                            title={isEditMode ? dict.project.detail.lockAssignments : dict.project.detail.unlockAssignments}
                        >
                            <span className="text-[10px] block w-3 h-3 text-center leading-3">{isEditMode ? '🔓' : '🔒'}</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-center">
                    {/* LEFT: Status & Title */}
                    <div className="flex items-center gap-3 w-full md:flex-1 min-w-0">
                        {/* Status Pill */}
                        <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${item.status === 'OPEN' ? 'bg-indigo-500' :
                            item.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                                item.status === 'DONE' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}></div>

                        <div className="min-w-0 flex-1 relative">
                            {isEditMode && canEditTitle ? (
                                <input
                                    type="text"
                                    defaultValue={item.title}
                                    onBlur={(e) => {
                                        if (e.target.value !== item.title) {
                                            import('@/actions/project').then(mod => mod.updateProjectItemDetails(item.id, { title: e.target.value }));
                                        }
                                    }}
                                    className="text-sm font-semibold w-full bg-slate-50 border border-indigo-200 rounded px-2 py-0.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none dark:bg-slate-800 dark:border-indigo-900 dark:text-slate-100"
                                />
                            ) : (
                                <div className="flex items-baseline gap-2">
                                    <h3 className={`text-sm font-semibold truncate flex items-center gap-1.5 ${item.status === 'LOCKED' ? 'text-slate-500 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {itemType === 'NOTE' ? (
                                            <StickyNote size={14} className="text-amber-500 shrink-0" />
                                        ) : (
                                            <CheckSquare size={14} className="text-indigo-500 shrink-0" />
                                        )}
                                        {item.title}
                                    </h3>
                                </div>
                            )}


                            {/* Description / Dependencies */}
                            <div
                                onClick={() => !isEditMode && setIsDetailsExpanded(!isDetailsExpanded)}
                                className={`
                                    text-[11px] text-slate-500 transition-all cursor-pointer hover:bg-slate-50 rounded px-1 -ml-1 mt-0.5 dark:text-slate-400 dark:hover:bg-slate-800
                                    ${isDetailsExpanded || isEditMode ? 'h-auto whitespace-normal' : 'h-5 flex items-center gap-2'}
                                `}
                                title={!isDetailsExpanded ? dict.project.detail.clickToExpand : dict.project.detail.clickToCollapse}
                            >
                                {isEditMode ? (
                                    <textarea
                                        defaultValue={item.description || ''}
                                        placeholder={dict.project.detail.descriptionPlaceholder}
                                        onBlur={(e) => {
                                            if (e.target.value !== item.description) {
                                                import('@/actions/project').then(mod => mod.updateProjectItemDetails(item.id, { description: e.target.value }));
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        rows={1}
                                        className="w-full bg-slate-50 border border-indigo-200 rounded px-1 py-1 cursor-text min-h-[1.5rem] resize-y leading-tight focus:ring-1 focus:ring-indigo-500 outline-none dark:bg-slate-800 dark:border-indigo-900 dark:text-slate-100"
                                    />
                                ) : (
                                    <>
                                        <div className={`${isDetailsExpanded ? 'mb-1 whitespace-pre-wrap' : 'truncate'}`}>
                                            {item.description || <span className="italic opacity-50">{dict.project.detail.noDetails}</span>}
                                        </div>
                                        {item.dependsOn && item.dependsOn.length > 0 && (
                                            <div className={`
                                                ${isDetailsExpanded ? 'flex flex-col gap-1 border-t border-slate-100 pt-1 mt-1 dark:border-slate-800' : 'flex items-center gap-1 pl-2 border-l border-slate-200 min-w-0 dark:border-slate-700'}
                                            `}>
                                                {isDetailsExpanded ? (
                                                    item.dependsOn.map(dep => (
                                                        <div key={dep.id} className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit dark:bg-amber-900/30 dark:text-amber-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                            <span className="font-medium">{dict.project.detail.waitsFor} {dep.prerequisite.title}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0"></span>
                                                        <span className="truncate">
                                                            {dict.project.detail.waitsFor} {item.dependsOn[0].prerequisite.title}
                                                            {item.dependsOn.length > 1 && ` (+${item.dependsOn.length - 1})`}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Attachments Section - File Manager */}
                            {shouldShowAttachment && (isAdmin || isProjectOwner || isAssignedToMe) && (
                                <div className={`mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 ${!isDetailsExpanded ? 'hidden' : 'block'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attachments</span>
                                            {requireAttachment && (!item.files || item.files.length === 0) && (
                                                <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200">REQUIRED</span>
                                            )}
                                        </div>
                                        {(canEdit && (users.find(u => u.id === currentUser?.id) || isAdmin) && !isUploadMissing) && (
                                            <FileUploader
                                                projectId={item.projectId}
                                                taskId={item.id}
                                                onUploadComplete={() => router.refresh()}
                                                variant="compact"
                                            />
                                        )}
                                    </div>

                                    {/* Mini File List */}
                                    <div className="space-y-1">
                                        {item.files?.map(file => (
                                            <div key={file.id} className="group/file flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-700">
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 flex-1 hover:underline">
                                                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">{file.name}</span>
                                                </a>
                                                <div className="flex items-center gap-2 opacity-0 group-hover/file:opacity-100 transition-opacity">
                                                    <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)}KB</span>
                                                    {(canEdit && (file.uploadedBy.name === currentUser?.name || isAdmin)) && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!confirm('Delete file?')) return;
                                                                try {
                                                                    const { deleteFile } = await import('@/actions/file');
                                                                    await deleteFile(file.id);
                                                                    toast.success('Deleted');
                                                                    router.refresh();
                                                                } catch { toast.error('Failed'); }
                                                            }}
                                                            className="text-slate-400 hover:text-red-600"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {(!item.files || item.files.length === 0) && (
                                            <div className="text-xs text-slate-400 italic py-1">No files attached.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Assignee & Actions */}
                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-50 dark:border-slate-800">
                        <div>
                            <AssigneeSelector
                                itemId={item.id}
                                assignees={effectiveAssignees}
                                users={users}
                                isEditMode={isEditMode && canEditAssignee}
                            />
                        </div>

                        {item.status !== 'LOCKED' && !isGroup && (
                            (() => {
                                if (!canEdit) return null;

                                if (isUploadMissing) {
                                    return (
                                        <div className="relative z-20">
                                            <FileUploader
                                                projectId={item.projectId}
                                                taskId={item.id}
                                                onUploadComplete={() => router.refresh()}
                                                variant="compact"
                                                label="Upload Required"
                                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 hover:text-red-700"
                                            />
                                        </div>
                                    );
                                }

                                return (
                                    <button
                                        onClick={() => handleStatusChange(item.id, item.status === 'DONE' ? 'OPEN' : 'DONE')}
                                        disabled={isPending}
                                        className={`
                                            h-7 px-3 rounded-md text-xs font-semibold transition-all border shadow-sm flex items-center gap-1.5 cursor-pointer
                                            ${isPending ? 'opacity-70 cursor-wait' : ''}
                                            ${item.status === 'DONE'
                                                ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                                                : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500'}
                                        `}
                                    >
                                        {isPending ? (
                                            '...'
                                        ) : item.status === 'DONE' ? (
                                            dict.project.detail.reopen
                                        ) : isUnassigned ? (
                                            dict.project.detail.take
                                        ) : (
                                            <><span>✓</span> {dict.project.detail.done}</>
                                        )}
                                    </button>
                                );
                            })()
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

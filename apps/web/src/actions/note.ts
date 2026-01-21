'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/actions/auth';
import type { ProtocolItemType } from '@repo/database';

export type NoteItem = {
    id: string;
    title: string;
    description: string | null;
    type: ProtocolItemType;
    updatedAt: Date;
    project: {
        id: string;
        title: string;
        status: string;
    };
    assignedTo: {
        name: string | null;
    } | null;
};

export async function getAllNotes(): Promise<NoteItem[]> {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
        return [];
    }

    const items = await prisma.projectItem.findMany({
        where: {
            project: {
                organizationId: user.organizationId,
                deletedAt: null // Only active projects
            },
            OR: [
                { type: 'NOTE' },
                {
                    type: 'TASK',
                    description: { not: null }
                }
            ],
        },
        select: {
            id: true,
            title: true,
            description: true,
            type: true,
            updatedAt: true,
            project: {
                select: {
                    id: true,
                    title: true,
                    status: true
                }
            },
            assignedTo: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    // Filter out tasks with empty descriptions if any slipped through (e.g. empty string)
    // Filter out items with empty descriptions
    return items.filter(item => {
        const hasDescription = item.description && item.description.trim().length > 0;
        return hasDescription;
    });
}

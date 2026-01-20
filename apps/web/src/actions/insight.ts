'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from './auth';

export type InsightData = {
    projectsByStatus: { status: string; count: number }[];
    protocolStats: { name: string; count: number }[];
    taskStats: { status: string; count: number }[];
    assigneeStats: {
        id: string;
        name: string;
        email: string;
        avgDurationHours: number;
        completedTasks: number;
    }[];
    totalProjects: number;
    totalTasks: number;
};

export async function getInsightStats(): Promise<InsightData> {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
        throw new Error('Unauthorized');
    }

    const orgId = user.organizationId;

    // 1. Projects by Status
    const projectsByStatusRaw = await prisma.project.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true }
    });

    const projectsByStatus = projectsByStatusRaw.map(p => ({
        status: p.status,
        count: p._count.id
    }));

    const totalProjects = projectsByStatus.reduce((acc, curr) => acc + curr.count, 0);

    // 2. Protocols Usage
    const protocolsUsage = await prisma.project.groupBy({
        by: ['protocolId'],
        where: { organizationId: orgId },
        _count: { id: true }
    });

    const protocolIds = protocolsUsage.map(p => p.protocolId).filter(Boolean) as string[];
    const protocols = await prisma.protocol.findMany({
        where: { id: { in: protocolIds } },
        select: { id: true, name: true }
    });

    const protocolStats = protocolsUsage.map(usage => {
        const p = protocols.find(proto => proto.id === usage.protocolId);
        return {
            name: p?.name || 'Unknown',
            count: usage._count.id
        };
    }).sort((a, b) => b.count - a.count); // Most popular first

    // 3. Task Statistics
    const taskStatsRaw = await prisma.projectItem.groupBy({
        by: ['status'],
        where: {
            project: { organizationId: orgId }
        },
        _count: { id: true }
    });

    const taskStats = taskStatsRaw.map(t => ({
        status: t.status,
        count: t._count.id
    }));

    const totalTasks = taskStats.reduce((acc, curr) => acc + curr.count, 0);

    // 4. Assignee Duration Stats
    const completedItems = await prisma.projectItem.findMany({
        where: {
            project: { organizationId: orgId },
            status: 'DONE',
            startDate: { not: null },
            endDate: { not: null }
        },
        select: {
            startDate: true,
            endDate: true,
            assignees: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true } }
        }
    });

    const assigneeMap = new Map<string, { name: string; email: string; totalDuration: number; count: number }>();

    for (const item of completedItems) {
        if (!item.startDate || !item.endDate) continue;

        const durationMs = item.endDate.getTime() - item.startDate.getTime();
        // Skip negative durations (invalid data)
        if (durationMs < 0) continue;

        // Determine assignee (Handle Multiple & Legacy)
        let assignee = item.assignees[0] || item.assignedTo;

        if (assignee) {
            const stats = assigneeMap.get(assignee.id) || {
                name: assignee.name || 'Unknown',
                email: assignee.email,
                totalDuration: 0,
                count: 0
            };
            stats.totalDuration += durationMs;
            stats.count += 1;
            assigneeMap.set(assignee.id, stats);
        }
    }

    const assigneeStats = Array.from(assigneeMap.entries()).map(([id, stats]) => ({
        id,
        name: stats.name,
        email: stats.email,
        avgDurationHours: (stats.totalDuration / stats.count) / (1000 * 60 * 60), // Convert ms to hours
        completedTasks: stats.count
    })).sort((a, b) => b.completedTasks - a.completedTasks); // Sort by productivity (count) first

    return {
        projectsByStatus,
        protocolStats,
        taskStats,
        assigneeStats,
        totalProjects,
        totalTasks
    };
}

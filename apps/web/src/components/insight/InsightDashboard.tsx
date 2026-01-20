'use client';

import { InsightData } from '@/actions/insight';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const STATUS_COLORS: Record<string, string> = {
    'ACTIVE': '#10b981', // Emerald
    'COMPLETED': '#3b82f6', // Blue
    'LOCKED': '#64748b',
    'IN_PROGRESS': '#f59e0b', // Amber
};

interface InsightDashboardProps {
    data: InsightData;
}

export function InsightDashboard({ data }: InsightDashboardProps) {

    // Prepare data for PieChart
    const statusData = data.projectsByStatus.map(s => ({
        name: s.status,
        value: s.count
    }));

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card
                    title="Total Projects"
                    value={data.totalProjects}
                    icon="📂"
                />
                <Card
                    title="Total Tasks"
                    value={data.totalTasks}
                    icon="✅"
                />
                <Card
                    title="Active Projects"
                    value={data.projectsByStatus.find(s => s.status === 'ACTIVE')?.count || 0}
                    icon="🚀"
                    highlightColor="text-emerald-600"
                />
                <Card
                    title="Protocols Used"
                    value={data.protocolStats.length}
                    icon="📜"
                    highlightColor="text-indigo-600"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Protocol Usage Bar Chart */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm min-h-[300px]">
                    <h3 className="text-sm font-bold mb-4 text-slate-800 dark:text-slate-200">Projects by Protocol</h3>
                    <div className="h-[200px] w-full">
                        {data.protocolStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.protocolStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={false} height={10} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px' }}
                                        cursor={{ fill: '#f1f5f9' }}
                                    />
                                    <Bar dataKey="count" name="Projects" fill="#cd1717" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data available</div>
                        )}
                    </div>
                </div>

                {/* Project Status Pie Chart */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm min-h-[300px]">
                    <h3 className="text-sm font-bold mb-4 text-slate-800 dark:text-slate-200">Project Status Distribution</h3>
                    <div className="h-[200px] w-full">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={75}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || 'Unknown'} ${((percent || 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                        style={{ fontSize: '10px' }}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px' }} />
                                    <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data available</div>
                        )}
                    </div>
                </div>

            </div>

            {/* Team Performance Table */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold mb-4 text-slate-800 dark:text-slate-200">Team Performance (Task Duration)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="pb-2 font-medium text-slate-500">Assignee</th>
                                <th className="pb-2 font-medium text-slate-500">Completed Tasks</th>
                                <th className="pb-2 font-medium text-slate-500">Avg. Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {data.assigneeStats?.length > 0 ? (
                                data.assigneeStats.map((stat, i) => (
                                    <tr key={stat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="py-2 text-slate-700 dark:text-slate-300 font-medium">
                                            {stat.name || stat.email}
                                        </td>
                                        <td className="py-2 text-slate-600 dark:text-slate-400">
                                            {stat.completedTasks}
                                        </td>
                                        <td className="py-2 text-slate-600 dark:text-slate-400">
                                            {stat.avgDurationHours < 1
                                                ? '< 1 hour'
                                                : `${stat.avgDurationHours.toFixed(1)} hours`}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="py-4 text-center text-slate-400">
                                        No performance data available yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Card({ title, value, icon, highlightColor }: { title: string, value: number | string, icon: string, highlightColor?: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{title}</h3>
                <p className={`text-2xl font-bold mt-1 ${highlightColor || 'text-slate-900 dark:text-white'}`}>
                    {value}
                </p>
            </div>
            <span className="text-xl bg-slate-50 dark:bg-slate-800 p-2 rounded-md">{icon}</span>
        </div>
    );
}

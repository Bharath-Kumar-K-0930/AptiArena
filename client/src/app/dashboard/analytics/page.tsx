"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Timer, Target, TrendingUp, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function AnalyticsPage() {
    const [stats, setStats] = useState({
        totalQuizzes: 0,
        totalSessions: 0,
        totalParticipants: 0,
        avgAccuracy: 0,
        avgTimePerQuestion: 0,
        activity: [] as any[]
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quizzes/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error("Failed to fetch stats");
            }
        };
        fetchStats();
    }, []);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 border border-border p-4 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</p>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-teal flex items-center gap-2">
                            <Zap className="h-3 w-3 fill-teal" /> Sessions: {payload[0].value}
                        </p>
                        <p className="text-sm font-bold text-blue-400 flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" /> Quizzes Created: {payload[1].value}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-background/50">
            <Sidebar />

            <main className="flex-1 p-8 space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                        <p className="text-muted-foreground mt-1">Insights into your quiz performance and engagement</p>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/20 px-4 py-2 rounded-lg border border-border">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-400 font-medium">Last 30 Days</span>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-card border-border relative overflow-hidden group hover:border-teal/50 transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-20 w-20 text-teal" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
                            <TrendingUp className="h-4 w-4 text-teal" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.totalSessions}</div>
                            <p className="text-xs text-green-400 font-medium">+2 this week</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border relative overflow-hidden group hover:border-blue-400/50 transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                            <Users className="h-20 w-20 text-blue-400" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle>
                            <Users className="h-4 w-4 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.totalParticipants}</div>
                            <p className="text-xs text-muted-foreground">Across all games</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border relative overflow-hidden group hover:border-green-400/50 transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                            <Target className="h-20 w-20 text-green-400" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Accuracy</CardTitle>
                            <Target className="h-4 w-4 text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.avgAccuracy}%</div>
                            <p className="text-xs text-muted-foreground">Class average</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border relative overflow-hidden group hover:border-gold/50 transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                            <Timer className="h-20 w-20 text-gold" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Time</CardTitle>
                            <Timer className="h-4 w-4 text-gold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.avgTimePerQuestion}s</div>
                            <p className="text-xs text-muted-foreground">Per question</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6">
                    <Card className="bg-card border-border overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-muted/5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-xl font-bold">Activity Overview</CardTitle>
                                    <CardDescription>Visualizing your hosting and quiz creation trends</CardDescription>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-teal" />
                                        <span className="text-xs text-gray-400 font-medium">Sessions</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        <span className="text-xs text-gray-400 font-medium">Quizzes Created</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={stats.activity}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={4}
                                        />
                                        <YAxis
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="sessions"
                                            stroke="#2dd4bf"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorSessions)"
                                            animationDuration={2000}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="created"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorCreated)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

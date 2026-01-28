"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Calendar, Shield, Edit, Key, Save, X, Lock } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        bio: "",
        organization: "",
        jobTitle: ""
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setFormData({
                name: parsedUser.name || "",
                username: parsedUser.username || "",
                bio: parsedUser.bio || "",
                organization: parsedUser.organization || "",
                jobTitle: parsedUser.jobTitle || ""
            });
        }
    }, []);

    if (!user) return <div className="flex min-h-screen bg-black items-center justify-center text-white font-mono uppercase tracking-widest animate-pulse">Loading AptiArena...</div>;

    const createdAt = new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const handleProfileSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                const newUserObj = { ...user, ...updatedUser };
                setUser(newUserObj);
                localStorage.setItem("user", JSON.stringify(newUserObj));
                setIsEditing(false);
                toast.success("Profile updated successfully!");
                // Dispatch event for sidebar to update
                window.dispatchEvent(new Event('storage'));
            } else {
                toast.error("Failed to update profile.");
            }
        } catch (error) {
            toast.error("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error("Passwords do not match!");
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (res.ok) {
                toast.success("Password changed successfully!");
                setIsChangingPassword(false);
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to update password.");
            }
        } catch (error) {
            toast.error("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-background/50">
            <Sidebar />

            <main className="flex-1 p-8 space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">User Profile</h1>
                            <p className="text-muted-foreground mt-1">Manage your account information and preferences</p>
                        </div>
                        {!isEditing && (
                            <Button onClick={() => setIsEditing(true)} className="bg-teal hover:bg-teal/80 text-white">
                                <Edit className="h-4 w-4 mr-2" /> Edit Profile
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Avatar Card */}
                        <Card className="md:col-span-1 bg-card border-border h-fit">
                            <CardContent className="pt-8 flex flex-col items-center">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-4 border-4 border-white/10 group-hover:scale-105 transition-transform">
                                        {(user.name?.[0] || user.username?.[0] || "U").toUpperCase()}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Edit className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-foreground mt-2">{user.name || user.username}</h2>
                                <p className="text-sm text-teal-400 font-medium tracking-wide uppercase mt-1">Host Account</p>

                                <div className="w-full mt-8 pt-8 border-t border-border space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4 text-teal" />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4 text-teal" />
                                        <span>Joined {createdAt}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Details Section */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle className="text-lg">Personal Information</CardTitle>
                                    <CardDescription>
                                        {isEditing ? "Modify your account details below." : "View your personal account details."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="bg-muted/30 border-border focus:ring-teal"
                                                    placeholder="Enter your name"
                                                />
                                            ) : (
                                                <p className="p-3 bg-muted/20 rounded-lg border border-border text-foreground font-medium">{user.name || "Not provided"}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Username</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    className="bg-muted/30 border-border"
                                                />
                                            ) : (
                                                <p className="p-3 bg-muted/20 rounded-lg border border-border text-foreground font-medium">@{user.username}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email Address</Label>
                                        <p className="p-3 bg-muted/10 rounded-lg border border-border text-muted-foreground italic flex items-center justify-between">
                                            {user.email}
                                            <Lock className="h-3 w-3" />
                                        </p>
                                        <p className="text-[10px] text-gray-500">Contact support to change your primary email.</p>
                                    </div>
                                </CardContent>
                                {isEditing && (
                                    <CardFooter className="border-t border-border mt-4 pt-4 flex gap-3">
                                        <Button
                                            onClick={handleProfileSave}
                                            disabled={loading}
                                            className="bg-teal hover:bg-teal/80 text-white flex items-center gap-2"
                                        >
                                            <Save className="h-4 w-4" /> Save Changes
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsEditing(false)}
                                            className="text-muted-foreground hover:text-white"
                                        >
                                            Cancel
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>

                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle className="text-lg">Security Settings</CardTitle>
                                    <CardDescription>Manage your authentication and login security.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/20 rounded-xl border border-border gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-teal/10">
                                                <Shield className="h-6 w-6 text-teal" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">Password Management</p>
                                                <p className="text-xs text-muted-foreground">Last updated: Recently</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                                            variant="outline"
                                            size="sm"
                                            className="border-teal/20 text-teal hover:bg-teal/10"
                                        >
                                            {isChangingPassword ? "Close" : "Update Password"}
                                        </Button>
                                    </div>

                                    {isChangingPassword && (
                                        <div className="p-6 border border-border/50 rounded-xl bg-muted/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-tight">Current Password</Label>
                                                <Input
                                                    type="password"
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    className="bg-background border-border"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-tight">New Password</Label>
                                                    <Input
                                                        type="password"
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                        className="bg-background border-border"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-tight">Confirm Password</Label>
                                                    <Input
                                                        type="password"
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                        className="bg-background border-border"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handlePasswordUpdate}
                                                disabled={loading}
                                                className="w-full bg-teal hover:bg-teal/80 text-white"
                                            >
                                                Change Password
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-blue-500/10">
                                                <Key className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">Two-Factor Authentication</p>
                                                <p className="text-xs text-muted-foreground">Enhanced account protection</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => toast.info("Two-Factor Authentication is coming soon!")}
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-500"
                                        >
                                            Enable
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

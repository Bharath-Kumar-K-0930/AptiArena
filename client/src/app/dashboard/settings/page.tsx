"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Briefcase, Building, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>({});

    // Passwords
    const [passwords, setPasswords] = useState({ current: "", new: "" });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return router.push("/login");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setUserData(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleProfileUpdate = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: userData.username,
                    bio: userData.bio,
                    organization: userData.organization,
                    jobTitle: userData.jobTitle
                })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUserData(updatedUser);
                localStorage.setItem("user", JSON.stringify(updatedUser)); // Update local storage for sidebar sync
                toast.success("Profile updated successfully!");

                // Force sidebar update (hacky but simple)
                window.location.reload();
            } else {
                toast.error("Failed to update profile");
            }
        } catch (error) {
            toast.error("Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!passwords.current || !passwords.new) return toast.error("Please fill all fields");
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Password updated successfully!");
                setPasswords({ current: "", new: "" });
            } else {
                toast.error(data.message || "Failed to update password");
            }
        } catch (error) {
            toast.error("Error updating password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-background/50">
            <Sidebar />

            <main className="flex-1 p-8 space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your account preferences</p>
                </div>

                <Tabs defaultValue="profile" className="w-full max-w-4xl">
                    <TabsList className="grid w-full grid-cols-4 bg-muted/20">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                        <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
                        <TabsTrigger value="appearance" disabled>Appearance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-4 mt-6">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your public display information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Display Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                value={userData.username || ""}
                                                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            value={userData.email || ""}
                                            disabled
                                            className="bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Job Title</Label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="title"
                                                placeholder="e.g. Senior Teacher"
                                                value={userData.jobTitle || ""}
                                                onChange={(e) => setUserData({ ...userData, jobTitle: e.target.value })}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="org">Organization</Label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="org"
                                                placeholder="e.g. Springfield High"
                                                value={userData.organization || ""}
                                                onChange={(e) => setUserData({ ...userData, organization: e.target.value })}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Input
                                        id="bio"
                                        placeholder="Tell us a bit about yourself"
                                        value={userData.bio || ""}
                                        onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleProfileUpdate}
                                    disabled={loading}
                                    className="bg-teal hover:bg-teal/80 text-white"
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4 mt-6">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle>Password</CardTitle>
                                <CardDescription>Change your account password.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current">Current Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="current"
                                            type="password"
                                            className="pl-9"
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="new"
                                            type="password"
                                            className="pl-9"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handlePasswordUpdate}
                                    disabled={loading}
                                    className="bg-teal hover:bg-teal/80 text-white"
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Update Password
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

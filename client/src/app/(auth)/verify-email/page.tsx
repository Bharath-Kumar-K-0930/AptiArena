"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/verify-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                if (res.ok) {
                    setStatus("success");
                } else {
                    setStatus("error");
                }
            } catch (err) {
                setStatus("error");
            }
        };

        verify();
    }, [token]);

    return (
        <Card className="w-full max-w-md mx-auto bg-card/50 backdrop-blur border-border mt-20">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
                <CardDescription className="text-center">
                    {status === "loading" && "Verifying your email..."}
                    {status === "success" && "Email verified successfully!"}
                    {status === "error" && "Verification failed."}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
                {status === "loading" && <Loader2 className="h-16 w-16 text-teal-500 animate-spin" />}
                {status === "success" && <CheckCircle className="h-16 w-16 text-green-500" />}
                {status === "error" && <XCircle className="h-16 w-16 text-red-500" />}
            </CardContent>
            <CardFooter className="flex justify-center">
                {status === "success" && (
                    <Link href="/login">
                        <Button className="bg-teal hover:bg-teal/80">
                            Proceed to Login
                        </Button>
                    </Link>
                )}
                {status === "error" && (
                    <Link href="/register">
                        <Button variant="outline">
                            Back to Registration
                        </Button>
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-16 w-16 text-teal-500 animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

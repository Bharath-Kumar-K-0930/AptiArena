import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, ShieldCheck, Scale, Copyright, User } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white py-20 px-4">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                        Terms & Policy
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Transparency, automated integrity, and community standards.
                    </p>
                </div>

                {/* Content Cards */}
                <div className="grid gap-6">

                    {/* License */}
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-teal-400">
                                <Scale className="h-6 w-6" /> MIT License
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-gray-300">
                            <p>
                                AptiArena is open-source software licensed under the <strong>MIT License</strong>.
                            </p>
                            <p>
                                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
                            </p>
                            <div className="pt-4">
                                <Link
                                    href="https://github.com/Bharath-Kumar-K-0930/AptiArena/blob/main/LICENSE"
                                    target="_blank"
                                    className="inline-flex items-center text-blue-400 hover:text-blue-300 underline underline-offset-4"
                                >
                                    View Full License on GitHub <ScrollText className="ml-2 h-4 w-4" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Copyright */}
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-purple-400">
                                <Copyright className="h-6 w-6" /> Copyright & Ownership
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-gray-300">
                            <p>
                                All rights reserved. The design, code, and architecture of usage are intellectual property.
                            </p>
                            <div className="bg-gray-800/50 p-4 rounded-lg flex items-center gap-4">
                                <div className="h-12 w-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-white text-xl">
                                    B
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Copyright Holder</p>
                                    <p className="text-lg font-bold text-white">Bharath Kumar K</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Policy */}
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-yellow-500">
                                <ShieldCheck className="h-6 w-6" /> Privacy Policy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-gray-300">
                            <p>
                                We respect your privacy. AptiArena collects minimal data required for functionality (e.g., authentication tokens, quiz performance stats).
                                We do not sell your personal data to third parties.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-gray-400">
                                <li>Authentication is handled securely via JWT.</li>
                                <li>Quiz data is stored to provide analytics and history.</li>
                                <li>Uploaded files are processed temporarily for AI generation.</li>
                            </ul>
                        </CardContent>
                    </Card>

                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-gray-800 text-gray-500">
                    <p>Last Updated: January 2026</p>
                    <p className="mt-2">Developed by <span className="text-white font-medium">Bharath Kumar K</span></p>
                </div>

            </div>
        </div>
    );
}

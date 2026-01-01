"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Loader2, FileText, Upload, Type, FileType } from "lucide-react";
import { toast } from "sonner";

import Sidebar from "@/components/Sidebar";

export default function CreateQuizPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [step, setStep] = useState<"input" | "preview">("input");

    // Form States
    const [mode, setMode] = useState("topic");
    const [topic, setTopic] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [rawText, setRawText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [qCount, setQCount] = useState(5);

    const handleGenerate = async () => {
        if (mode === "topic" && !topic) return toast.error("Please enter a topic");
        if (mode === "text" && !rawText) return toast.error("Please paste some text");
        if (mode === "file" && !file) return toast.error("Please upload a file");

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("difficulty", "Medium");
            formData.append("amount", qCount.toString());

            if (mode === "topic") {
                formData.append("topic", topic);
            } else if (mode === "text") {
                formData.append("text", rawText);
                formData.append("topic", topic || "Generated Quiz");
            } else if (mode === "file" && file) {
                formData.append("file", file);
                // formData.append("topic", topic); // Optional override
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quizzes/generate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                    // Content-Type is auto-set by FormData
                },
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setQuestions(data.questions);
                const generatedTopic = data.topic || topic || "General Knowledge";
                if (!topic) setTopic(generatedTopic);

                setTitle(generatedTopic);
                setDescription(`A quiz about ${generatedTopic} generated from ${mode} input.`);

                setStep("preview");
                toast.success("Quiz generated successfully!");
            } else {
                toast.error(data.message || "Failed to generate quiz");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error generating quiz");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quizzes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: title || `Quiz: ${topic || 'Untitled'}`,
                    description: description || `Generated from ${mode} input.`,
                    topic: topic || "General",
                    questions,
                    difficulty: "Medium"
                }),
            });
            if (res.ok) {
                toast.success("Quiz saved successfully!");
                router.push("/dashboard");
            } else {
                toast.error("Failed to save quiz");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const toastId = toast.loading("Uploading image...");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload/image`, {
                method: "POST",
                body: formData, // No Authorization header needed usually for public upload, or add if protected
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            const imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${data.url}`; // Construct full URL if relative

            const updatedQuestions = [...questions];
            updatedQuestions[index].image = imageUrl;
            setQuestions(updatedQuestions);

            toast.success("Image uploaded!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload image");
        } finally {
            toast.dismiss(toastId);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-background/50">
            <Sidebar />

            <main className="flex-1 p-8 flex justify-center items-start overflow-y-auto h-[calc(100vh-4rem)]">
                <Card className="w-full max-w-3xl bg-gray-900 border-gray-800 shadow-2xl mt-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl text-white">
                            <BrainCircuit className="text-teal w-8 h-8" />
                            AI Quiz Generator
                        </CardTitle>
                        <CardDescription>Create a quiz in seconds from any source.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {step === "input" ? (
                            <Tabs defaultValue="topic" onValueChange={setMode} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 p-1 mb-6 rounded-xl border border-gray-700/50">
                                    <TabsTrigger value="topic" className="data-[state=active]:bg-teal data-[state=active]:text-white hover:bg-gray-700/50 hover:text-white transition-all duration-200 rounded-lg">Topic</TabsTrigger>
                                    <TabsTrigger value="text" className="data-[state=active]:bg-teal data-[state=active]:text-white hover:bg-gray-700/50 hover:text-white transition-all duration-200 rounded-lg">Text</TabsTrigger>
                                    <TabsTrigger value="file" className="data-[state=active]:bg-teal data-[state=active]:text-white hover:bg-gray-700/50 hover:text-white transition-all duration-200 rounded-lg">File Upload</TabsTrigger>
                                </TabsList>

                                <TabsContent value="topic" className="space-y-4">
                                    <div className="p-8 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/50 flex flex-col items-center text-center space-y-4">
                                        <div className="p-4 bg-teal/10 rounded-full">
                                            <Type className="w-8 h-8 text-teal" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-400">Enter a Topic</label>
                                                <Input
                                                    placeholder="e.g. World War II..."
                                                    value={topic}
                                                    onChange={(e) => setTopic(e.target.value)}
                                                    className="bg-gray-800 border-gray-700"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-400">Question Count</label>
                                                <select
                                                    className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={qCount}
                                                    onChange={(e) => setQCount(parseInt(e.target.value))}
                                                >
                                                    <option value="5">5 Questions</option>
                                                    <option value="10">10 Questions</option>
                                                    <option value="15">15 Questions</option>
                                                    <option value="20">20 Questions</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="text" className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Paste Content</label>
                                        <Textarea
                                            placeholder="Paste paragraphs, notes, or article text here..."
                                            rows={8}
                                            value={rawText}
                                            onChange={(e) => setRawText(e.target.value)}
                                            className="bg-gray-800 border-gray-700 font-mono text-sm"
                                        />
                                        <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                                            <p className="font-semibold text-blue-400 flex items-center gap-2">
                                                <BrainCircuit className="w-4 h-4" />
                                                Smart Extraction Format
                                            </p>
                                            <p>Use this format to bypass AI generation and extract questions exactly (100% accuracy):</p>
                                            <pre className="bg-black/30 p-2 rounded text-xs font-mono text-gray-400">
                                                {`1. Your Question Here?
A. Option 1
B. Option 2
Correct Answer: A. Option 1
Reason: Explanation here...`}
                                            </pre>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="file" className="space-y-4">
                                    <div className="p-12 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/50 flex flex-col items-center text-center space-y-4 hover:border-teal/50 transition-colors">
                                        <div className="p-4 bg-purple-500/10 rounded-full relative">
                                            <FileType className="w-10 h-10 text-purple-500" />
                                            <Upload className="w-4 h-4 text-white absolute bottom-0 right-0 bg-purple-600 rounded-full p-0.5 border-2 border-gray-900" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-lg text-white">Upload Document</h3>
                                            <p className="text-sm text-gray-400">Support for PDF, PPTX, DOCX, TXT</p>
                                        </div>
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            accept=".pdf,.pptx,.docx,.txt"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                        <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                                            {file ? file.name : "Choose File"}
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        ) : (<div className="space-y-6">
                            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-semibold text-white mb-2">Quiz Details</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setStep("input")} className="text-gray-400 hover:text-white">
                                        ← Back to Input
                                    </Button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quiz Title</label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="bg-gray-900 border-gray-600 text-white focus:ring-teal focus:border-teal"
                                            placeholder="Enter quiz title"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Topic / Category</label>
                                        <Input
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            className="bg-gray-900 border-gray-600 text-white focus:ring-teal focus:border-teal"
                                            placeholder="e.g. Science, Histoy..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Description</label>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="bg-gray-900 border-gray-600 text-white focus:ring-teal focus:border-teal resize-none h-20"
                                        placeholder="Enter a brief description..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                                {questions.map((q, i) => (
                                    <Card key={i} className="bg-gray-800 border-gray-700 relative group">
                                        <CardHeader className="pb-2 flex flex-row justify-between items-start">
                                            <CardTitle className="text-base font-medium leading-relaxed text-white w-full">
                                                <span className="text-teal mr-2">Q{i + 1}.</span>
                                                {q.text}
                                            </CardTitle>
                                            <div className="ml-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    id={`q-img-${i}`}
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(e, i)}
                                                />
                                                <label htmlFor={`q-img-${i}`} className="cursor-pointer text-gray-400 hover:text-teal transition-colors" title="Add Image">
                                                    <Upload className="w-5 h-5" />
                                                </label>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {q.image && (
                                                <div className="mb-4 relative group/img">
                                                    <img src={q.image} alt="Question Attachment" className="w-full max-h-48 object-cover rounded-lg border border-gray-700" />
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                        onClick={() => {
                                                            const updated = [...questions];
                                                            delete updated[i].image;
                                                            setQuestions(updated);
                                                        }}
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            )}
                                            <div className="grid md:grid-cols-2 gap-3">
                                                {q.options.map((opt: any, j: number) => (
                                                    <div key={j} className={`text-sm p-3 rounded-lg border transition-all ${opt.isCorrect
                                                        ? 'bg-green-500/10 border-green-500/30 text-green-400 font-medium'
                                                        : 'bg-gray-700/50 border-gray-700 text-gray-300'
                                                        }`}>
                                                        {opt.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between pt-6 border-t border-gray-800">
                        {step === "input" ? (
                            <Button
                                onClick={handleGenerate}
                                disabled={loading || (mode === 'topic' && !topic) || (mode === 'text' && !rawText) || (mode === 'file' && !file)}
                                className="w-full bg-gradient-to-r from-teal to-blue-600 hover:from-teal/90 hover:to-blue-700 h-12 text-lg shadow-lg shadow-teal/20 text-white"
                            >
                                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing & Generating...</> : "Generate Magic Quiz"}
                            </Button>
                        ) : (
                            <div className="flex gap-4 w-full">
                                <Button variant="outline" className="flex-1" onClick={() => setStep("input")}>Discard & Retry</Button>
                                <Button onClick={handleSave} disabled={loading} className="flex-[2] bg-green-600 hover:bg-green-700 text-white">
                                    {loading ? "Saving..." : "Save & Publish Quiz"}
                                </Button>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}

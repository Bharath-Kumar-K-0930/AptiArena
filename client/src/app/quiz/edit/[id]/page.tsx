"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft, Plus, Trash2, GripVertical, Check, Upload } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function EditQuizPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [quiz, setQuiz] = useState<any>({
        title: "",
        description: "",
        topic: "",
        questions: []
    });

    useEffect(() => {
        const fetchQuiz = async () => {
            const token = localStorage.getItem("token");
            if (!token) return router.push("/login");

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quizzes/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setQuiz(data);
                } else {
                    toast.error("Quiz not found");
                    router.push("/dashboard/quizzes");
                }
            } catch (error) {
                console.error(error);
                toast.error("Error fetching quiz");
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id, router]);

    const handleQuestionChange = (index: number, field: string, value: any) => {
        const newQuestions = [...quiz.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuiz({ ...quiz, questions: newQuestions });
    };

    const handleOptionChange = (qIndex: number, oIndex: number, text: string) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex].options[oIndex].text = text;
        setQuiz({ ...quiz, questions: newQuestions });
    };

    const setCorrectOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...quiz.questions];
        newQuestions[qIndex].options.forEach((opt: any, i: number) => {
            opt.isCorrect = i === oIndex;
        });
        setQuiz({ ...quiz, questions: newQuestions });
    };

    const addQuestion = () => {
        setQuiz({
            ...quiz,
            questions: [
                ...quiz.questions,
                {
                    text: "New Question",
                    options: [
                        { text: "Option A", isCorrect: true },
                        { text: "Option B", isCorrect: false },
                        { text: "Option C", isCorrect: false },
                        { text: "Option D", isCorrect: false }
                    ],
                    timeLimit: 30
                }
            ]
        });
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = quiz.questions.filter((_: any, i: number) => i !== index);
        setQuiz({ ...quiz, questions: newQuestions });
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
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            const imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${data.url}`;

            const newQuestions = [...quiz.questions];
            newQuestions[index] = { ...newQuestions[index], image: imageUrl };
            setQuiz({ ...quiz, questions: newQuestions });

            toast.success("Image uploaded!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload image");
        } finally {
            toast.dismiss(toastId);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quizzes/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(quiz)
            });

            if (res.ok) {
                toast.success("Quiz updated successfully!");
                router.push("/dashboard/quizzes");
            } else {
                toast.error("Failed to update quiz");
            }
        } catch (error) {
            toast.error("Error saving quiz");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-teal">Loading Editor...</div>;

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-background/50">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto h-[calc(100vh-4rem)]">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5 mr-2" /> Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Edit Quiz</h1>
                            <p className="text-muted-foreground text-sm">Update questions and quiz details</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={addQuestion} className="border-teal text-teal hover:bg-teal/10">
                            <Plus className="mr-2 h-4 w-4" /> Add Question
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-teal hover:bg-teal/80 text-white min-w-[140px]">
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* Quiz Info */}
                <Card className="bg-gray-900 border-gray-800 mb-8">
                    <CardHeader>
                        <CardTitle className="text-white">General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={quiz.title}
                                    onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                                    className="bg-gray-800 border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Topic</Label>
                                <Input
                                    value={quiz.topic}
                                    onChange={(e) => setQuiz({ ...quiz, topic: e.target.value })}
                                    className="bg-gray-800 border-gray-700"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={quiz.description}
                                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                                className="bg-gray-800 border-gray-700"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Questions */}
                <div className="space-y-6">
                    {quiz.questions.map((q: any, qIndex: number) => (
                        <Card key={qIndex} className="bg-gray-900 border-gray-800 relative group transition-all hover:border-gray-700">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="destructive" onClick={() => removeQuestion(qIndex)} className="h-8 w-8">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <CardContent className="pt-6 space-y-4">
                                <div className="flex gap-4 items-start">
                                    <span className="text-muted-foreground font-mono mt-3">Q{qIndex + 1}</span>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <Textarea
                                                value={q.text}
                                                onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                                className="bg-gray-800 border-gray-700 text-lg font-medium min-h-[80px] flex-1"
                                                placeholder="Question text..."
                                            />
                                            <div className="flex-shrink-0 pt-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    id={`q-img-${qIndex}`}
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(e, qIndex)}
                                                />
                                                <label htmlFor={`q-img-${qIndex}`} className="cursor-pointer text-gray-400 hover:text-teal transition-colors flex flex-col items-center gap-1" title="Add Image">
                                                    <div className="p-2 bg-gray-800 rounded-md border border-gray-700 hover:border-teal">
                                                        <Upload className="w-5 h-5" />
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {q.image && (
                                            <div className="relative group/img inline-block max-w-full">
                                                <img src={q.image} alt="Question Attachment" className="max-h-64 object-cover rounded-lg border border-gray-700" />
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                    onClick={() => handleQuestionChange(qIndex, 'image', undefined)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}

                                        <div className="grid md:grid-cols-2 gap-3">
                                            {q.options.map((opt: any, oIndex: number) => (
                                                <div key={oIndex} className="flex gap-2 items-center">
                                                    <div
                                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${opt.isCorrect ? 'border-green-500 bg-green-500/20' : 'border-gray-600 hover:border-gray-400'}`}
                                                        onClick={() => setCorrectOption(qIndex, oIndex)}
                                                    >
                                                        {opt.isCorrect && <Check className="w-3 h-3 text-green-500" />}
                                                    </div>
                                                    <Input
                                                        value={opt.text}
                                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                        className={`bg-gray-800 border-gray-700 ${opt.isCorrect ? 'text-green-400 font-medium border-green-900' : ''}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-8 flex justify-center">
                    <Button variant="outline" onClick={addQuestion} className="border-dashed border-gray-700 h-16 w-full max-w-md text-gray-400 hover:text-teal hover:border-teal hover:bg-teal/5">
                        <Plus className="mr-2 h-5 w-5" /> Add New Question
                    </Button>
                </div>
            </main>
        </div>
    );
}

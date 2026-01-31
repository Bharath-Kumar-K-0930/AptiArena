import { Request, Response } from 'express';
import Quiz from '../models/Quiz';

export const createQuiz = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const hostId = req.user.id;
        const quiz = new Quiz({ ...req.body, hostId });
        await quiz.save();
        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error creating quiz', error });
    }
};

export const getQuizzes = async (req: Request, res: Response) => {
    try {
        const quizzes = await Quiz.find({ isPublic: true }).populate('hostId', 'username');
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quizzes', error });
    }
};

export const getMyQuizzes = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const quizzes = await Quiz.find({ hostId: req.user.id }).sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your quizzes', error });
    }
};

export const getQuizById = async (req: Request, res: Response) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('hostId', 'username');
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz', error });
    }
};

import { generateQuizFromText } from '../services/aiService';
import { extractTextFromFile } from '../services/fileParser';

export const generateQuiz = async (req: Request, res: Response) => {
    try {
        let { topic, text, difficulty, amount, mode } = req.body;

        // If file is uploaded, extract text
        if (req.file) {
            const extractedText = await extractTextFromFile(req.file);
            text = extractedText;
            if (!topic) topic = req.file.originalname; // Use filename as topic if not provided
        }

        if (!topic && !text) {
            return res.status(400).json({ message: 'Please provide a topic, text, or upload a file.' });
        }

        const questions = await generateQuizFromText(topic, text, difficulty, amount || 5, mode);
        res.json({ questions, topic, textSource: mode === 'web' ? 'Web Scraped' : text ? 'Extracted/Provided' : 'Generated' });
    } catch (error) {
        console.error('Quiz Generation Error:', error);
        res.status(500).json({ message: 'Error generating quiz', error });
    }
};

export const updateQuiz = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const hostId = req.user.id;
        const quiz = await Quiz.findOneAndUpdate(
            { _id: req.params.id, hostId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!quiz) return res.status(404).json({ message: 'Quiz not found or unauthorized' });
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error updating quiz', error });
    }
};

export const deleteQuiz = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, hostId: req.user.id });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found or unauthorized' });
        res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error });
    }
};

import GameSession from '../models/GameSession';
import mongoose from 'mongoose';

export const getHostStats = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const hostId = req.user.id;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const quizzes = await Quiz.find({ hostId });
        const totalQuizzes = quizzes.length;
        const totalQuestions = quizzes.reduce((acc, quiz) => acc + quiz.questions.length, 0);

        const sessions = await GameSession.find({ hostId });
        const totalSessions = sessions.length;
        const totalParticipants = sessions.reduce((acc, session) => acc + session.participants.length, 0);

        // Aggregate quiz activity per day
        const quizActivity = await Quiz.aggregate([
            {
                $match: {
                    hostId: new mongoose.Types.ObjectId(hostId),
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Aggregate session activity per day
        const sessionActivity = await GameSession.aggregate([
            {
                $match: {
                    hostId: new mongoose.Types.ObjectId(hostId),
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Merge activity data
        const activityMap: { [key: string]: { date: string, created: number, sessions: number } } = {};

        // Initialize with last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            activityMap[dateStr] = {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                created: 0,
                sessions: 0
            };
        }

        quizActivity.forEach(item => {
            if (activityMap[item._id]) {
                activityMap[item._id].created = item.count;
            }
        });

        sessionActivity.forEach(item => {
            if (activityMap[item._id]) {
                activityMap[item._id].sessions = item.count;
            }
        });

        const activity = Object.values(activityMap);

        // Calculate Participation Stats (Where this user was a participant)
        const participatedSessions = await GameSession.find({ "participants.userId": new mongoose.Types.ObjectId(hostId as string) });
        const joinedQuizzes = participatedSessions.length;

        // Calculate Avg Score for the user across all joined quizzes
        let totalScore = 0;
        participatedSessions.forEach(session => {
            const me = session.participants.find(p => p.userId?.toString() === hostId.toString());
            if (me) totalScore += me.score;
        });
        const avgScore = joinedQuizzes > 0 ? Math.round(totalScore / joinedQuizzes) : 0;

        res.json({
            totalQuizzes,
            totalSessions,
            totalParticipants,
            totalQuestions,
            joinedQuizzes,
            avgScore,
            activity
        });
    } catch (error) {
        console.error("Stats aggregation error:", error);
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};

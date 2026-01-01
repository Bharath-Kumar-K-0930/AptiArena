import { Request, Response } from 'express';
import Quiz from '../models/Quiz';

export const createQuiz = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
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
        // @ts-ignore
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
        let { topic, text, difficulty, amount } = req.body;

        // If file is uploaded, extract text
        // @ts-ignore
        if (req.file) {
            // @ts-ignore
            const extractedText = await extractTextFromFile(req.file);
            text = extractedText;
            // @ts-ignore
            if (!topic) topic = req.file.originalname; // Use filename as topic if not provided
        }

        if (!topic && !text) {
            return res.status(400).json({ message: 'Please provide a topic, text, or upload a file.' });
        }

        const questions = await generateQuizFromText(topic, text, difficulty, amount || 5);
        res.json({ questions, topic, textSource: text ? 'Extracted/Provided' : 'Generated' });
    } catch (error) {
        console.error('Quiz Generation Error:', error);
        res.status(500).json({ message: 'Error generating quiz', error });
    }
};

export const updateQuiz = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
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
        // @ts-ignore
        const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, hostId: req.user.id });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found or unauthorized' });
        res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error });
    }
};

import GameSession from '../models/GameSession';

export const getHostStats = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const hostId = req.user.id;

        const quizzes = await Quiz.find({ hostId });
        const totalQuizzes = quizzes.length;
        const totalQuestions = quizzes.reduce((acc, quiz) => acc + quiz.questions.length, 0);

        const sessions = await GameSession.find({ hostId });

        const totalSessions = sessions.length;
        const totalParticipants = sessions.reduce((acc, session) => acc + session.participants.length, 0);

        res.json({
            totalQuizzes,
            totalSessions,
            totalParticipants,
            totalQuestions,
            joinedQuizzes: 0 // Placeholder until User model has participation history
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};

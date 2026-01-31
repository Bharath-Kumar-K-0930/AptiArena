import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app';
import User from '../src/models/User';
import Quiz from '../src/models/Quiz';
import jwt from 'jsonwebtoken';

jest.mock('office-text-extractor', () => ({
    getTextExtractor: jest.fn().mockReturnValue({
        extractText: jest.fn().mockResolvedValue('mocked text')
    })
}));

let mongoServer: MongoMemoryServer;
let hostToken: string;
let hostId: string;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);

    // Create a verified host user for testing
    const host = new User({
        username: 'hostuser',
        email: 'host@example.com',
        password: 'password123',
        role: 'host',
        isVerified: true
    });
    await host.save();
    hostId = host._id.toString();
    hostToken = jwt.sign({ id: hostId, role: 'host' }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1d' });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Quiz API', () => {
    let quizId: string;

    it('should create a new quiz', async () => {
        const quizData = {
            title: 'Test Quiz',
            description: 'Test Description',
            questions: [
                {
                    text: 'What is 2+2?',
                    options: [
                        { text: '3', isCorrect: false },
                        { text: '4', isCorrect: true },
                        { text: '5', isCorrect: false }
                    ],
                    explanation: 'Basic math'
                }
            ]
        };

        const res = await request(app)
            .post('/api/quizzes')
            .set('Authorization', `Bearer ${hostToken}`)
            .send(quizData);

        expect(res.statusCode).toEqual(201);
        expect(res.body.title).toBe(quizData.title);
        quizId = res.body._id;
    });

    it('should get all quizzes', async () => {
        const res = await request(app)
            .get('/api/quizzes')
            .set('Authorization', `Bearer ${hostToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get a single quiz by ID', async () => {
        const res = await request(app)
            .get(`/api/quizzes/${quizId}`)
            .set('Authorization', `Bearer ${hostToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toBe('Test Quiz');
    });

    it('should not allow non-host to create quiz', async () => {
        const participantToken = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: 'participant' }, process.env.JWT_SECRET || 'testsecret');
        const res = await request(app)
            .post('/api/quizzes')
            .set('Authorization', `Bearer ${participantToken}`)
            .send({ title: 'Invalid Quiz' });

        expect(res.statusCode).toEqual(403);
    });
});

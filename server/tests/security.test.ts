import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app';
import User from '../src/models/User';
import Quiz from '../src/models/Quiz';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

let mongoServer: MongoMemoryServer;
let verifiedHostToken: string;
let verifiedParticipantToken: string;
let hostId: string;
let participantId: string;
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create a verified host
    const host = new User({
        username: 'secure_host',
        email: 'host@secure.com',
        password: hashedPassword,
        role: 'host',
        isVerified: true
    });
    await host.save();
    hostId = host._id.toString();
    verifiedHostToken = jwt.sign({ id: hostId, role: 'host' }, JWT_SECRET);

    // Create a verified participant
    const participant = new User({
        username: 'secure_part',
        email: 'part@secure.com',
        password: hashedPassword,
        role: 'participant',
        isVerified: true
    });
    await participant.save();
    participantId = participant._id.toString();
    verifiedParticipantToken = jwt.sign({ id: participantId, role: 'participant' }, JWT_SECRET);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Security Tests', () => {

    describe('Access Control', () => {
        it('should prevent participants from accessing host stats', async () => {
            const res = await request(app)
                .get('/api/quizzes/stats')
                .set('Authorization', `Bearer ${verifiedParticipantToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should prevent unauthenticated users from accessing protected routes', async () => {
            const res = await request(app).get('/api/quizzes/my');
            expect(res.statusCode).toBe(401);
        });

        it('should prevent deleting quizzes unauthenticated', async () => {
            const res = await request(app).delete('/api/quizzes/123');
            expect(res.statusCode).toBe(401);
        });

        it('should prevent unauthorized file uploads', async () => {
            const res = await request(app).post('/api/upload/image');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('Basic Auth Checks', () => {
        it('should not login with unverified email', async () => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            const unverified = new User({
                username: 'unverified',
                email: 'unv@test.com',
                password: hashedPassword,
                isVerified: false
            });
            await unverified.save();

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'unv@test.com', password: 'password123' });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toContain('verify');
        });
    });

    describe('NoSQL Injection', () => {
        it('should sanitize NoSQL injection attempts in login', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: { "$gt": "" }, password: "any" });

            expect(res.statusCode).not.toBe(200);
        });
    });
});

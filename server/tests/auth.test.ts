import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/app';
import User from '../src/models/User';

jest.mock('office-text-extractor', () => ({
    getTextExtractor: jest.fn().mockReturnValue({
        extractText: jest.fn().mockResolvedValue('mocked text')
    })
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect(); // Disconnect from real DB if connected
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Auth API', () => {
    const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'participant'
    };

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toContain('Registration successful');

        const user = await User.findOne({ email: testUser.email });
        expect(user).toBeTruthy();
        expect(user?.isVerified).toBe(false);
    });

    it('should not register a user with existing email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('exists');
    });

    it('should not login if not verified', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toContain('verify');
    });

    it('should verify email with token', async () => {
        const user = await User.findOne({ email: testUser.email });
        const token = user?.verificationToken;

        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ token });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('verified');

        const updatedUser = await User.findOne({ email: testUser.email });
        expect(updatedUser?.isVerified).toBe(true);
    });

    it('should login with correct credentials after verification', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should not login with incorrect password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(400);
    });
});

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import quizRoutes from './routes/quizRoutes';
import uploadRoutes from './routes/uploadRoutes';

import { setupSocket } from './services/socketService';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

setupSocket(io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/upload', uploadRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aptiarena';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        console.log('Database:', MONGO_URI.replace(/:([^@]+)@/, ':****@'));
    })
    .catch(err => console.error('MongoDB connection error:', err));



app.get('/', (req, res) => {
    res.send('AptiArena API is running');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

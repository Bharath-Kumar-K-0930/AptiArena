import mongoose, { Document, Schema } from 'mongoose';

export interface IGameSession extends Document {
    quizId: mongoose.Types.ObjectId;
    hostId: mongoose.Types.ObjectId;
    participants: {
        socketId: string;
        name: string;
        userId?: mongoose.Types.ObjectId;
        score: number;
        streak: number;
        lastAnsweredQuestionIndex: number;
        lastAnswerIndex?: number;
        fingerprint?: string;
        tabSwitchCount: number;
        copyAttemptCount: number;
        tooFastCount: number;
        cheatScore: number;
        isFlagged: boolean;
    }[];
    status: 'waiting' | 'live' | 'finished';
    currentQuestionIndex: number;
    currentQuestionSentAt?: Date;
    pin: string;
    gameMode: 'live' | 'practice' | 'slideshow';
    isRevealed: boolean;
}

const GameSessionSchema = new Schema({
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{
        socketId: { type: String },
        name: { type: String },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastAnsweredQuestionIndex: { type: Number, default: -1 }, // Track if they answered the current question
        lastAnswerIndex: { type: Number }, // For stats tracking

        // Anti-Cheat Fields
        fingerprint: { type: String },
        tabSwitchCount: { type: Number, default: 0 },
        copyAttemptCount: { type: Number, default: 0 },
        tooFastCount: { type: Number, default: 0 },
        cheatScore: { type: Number, default: 0 },
        isFlagged: { type: Boolean, default: false }
    }],
    status: { type: String, enum: ['waiting', 'live', 'finished'], default: 'waiting' },
    gameMode: { type: String, enum: ['live', 'practice', 'slideshow'], default: 'live' },
    isRevealed: { type: Boolean, default: false },
    currentQuestionIndex: { type: Number, default: 0 },
    currentQuestionSentAt: { type: Date }, // To detect unusually fast answers
    pin: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema);

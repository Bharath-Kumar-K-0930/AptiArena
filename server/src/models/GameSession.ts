import mongoose, { Document, Schema } from 'mongoose';

export interface IGameSession extends Document {
    quizId: mongoose.Types.ObjectId;
    hostId: mongoose.Types.ObjectId;
    participants: {
        socketId: string;
        name: string;
        score: number;
        lastAnsweredQuestionIndex: number;
    }[];
    status: 'waiting' | 'live' | 'finished';
    currentQuestionIndex: number;
    pin: string;
    gameMode: 'live' | 'practice' | 'slideshow';
}

const GameSessionSchema = new Schema({
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{
        socketId: { type: String },
        name: { type: String },
        score: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastAnsweredQuestionIndex: { type: Number, default: -1 } // Track if they answered the current question
    }],
    status: { type: String, enum: ['waiting', 'live', 'finished'], default: 'waiting' },
    gameMode: { type: String, enum: ['live', 'practice', 'slideshow'], default: 'live' },
    currentQuestionIndex: { type: Number, default: 0 },
    pin: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema);

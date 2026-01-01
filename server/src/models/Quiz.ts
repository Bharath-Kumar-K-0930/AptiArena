import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
    text: string;
    type: 'MCQ' | 'TrueFalse';
    options: { text: string; isCorrect: boolean }[];
    explanation?: string;
    image?: string;
    timeLimit?: number;
}

export interface IQuiz extends Document {
    hostId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    topic?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questions: IQuestion[];
    isPublic: boolean;
    accessCode: string;
    createdAt: Date;
}

const QuestionSchema = new Schema({
    text: { type: String, required: true },
    type: { type: String, enum: ['MCQ', 'TrueFalse'], default: 'MCQ' },
    options: [{
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true }
    }],
    explanation: { type: String },
    image: { type: String },
    timeLimit: { type: Number, default: 30 }
});

const QuizSchema = new Schema({
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    topic: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    questions: [QuestionSchema],
    isPublic: { type: Boolean, default: true },
    accessCode: { type: String, unique: true }
}, { timestamps: true });

// Auto-generate access code
// Auto-generate access code
QuizSchema.pre('save', async function () {
    if (!this.accessCode) {
        this.accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
});

export default mongoose.model<IQuiz>('Quiz', QuizSchema);

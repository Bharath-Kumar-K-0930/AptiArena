import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    name?: string;
    email: string;
    password?: string;
    googleId?: string;
    isVerified: boolean;
    verificationToken?: string;
    role: 'admin' | 'host' | 'participant';
    avatar?: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true },
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    role: { type: String, enum: ['admin', 'host', 'participant'], default: 'participant' },
    avatar: { type: String },
    bio: { type: String },
    organization: { type: String },
    jobTitle: { type: String },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);

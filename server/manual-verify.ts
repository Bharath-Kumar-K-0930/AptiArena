
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

const verifyUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('MongoDB Connected');

        const email = process.argv[2];
        if (!email) {
            console.log('Please provide an email address. Usage: npm run verify-user <email>');
            process.exit(1);
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        console.log(`SUCCESS: User ${email} has been verified! You can now login.`);
        process.exit(0);
    } catch (error) {
        console.error('Error verifying user:', error);
        process.exit(1);
    }
};

verifyUser();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing MongoDB Connection...');
console.log('URI:', process.env.MONGO_URI?.replace(/:([^@]+)@/, ':****@')); // Hide password in logs

mongoose.connect(process.env.MONGO_URI as string)
    .then(() => {
        console.log('SUCCESS: Connected to MongoDB');
        process.exit(0);
    })
    .catch(err => {
        console.error('FAILURE: Connection Error:', err);
        process.exit(1);
    });

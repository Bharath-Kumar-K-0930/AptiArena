import mongoose from 'mongoose';
import { server } from './app';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aptiarena';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        console.log('Database:', MONGO_URI.replace(/:([^@]+)@/, ':****@'));

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => console.error('MongoDB connection error:', err));

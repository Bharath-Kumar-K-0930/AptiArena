require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGO_URI;

console.log('Connecting to MongoDB Atlas with 5s timeout...');
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log('SUCCESS: Connected to MongoDB.');
        process.exit(0);
    })
    .catch(e => {
        console.error('FAILURE: Could not connect to MongoDB.');
        console.error('Error:', e.message);
        process.exit(1);
    });

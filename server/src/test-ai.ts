import dotenv from 'dotenv';
import { generateQuizFromText } from './services/aiService';

dotenv.config();

async function test() {
    console.log('Testing OpenAI Integration...');
    try {
        const questions = await generateQuizFromText('Solar System', undefined, 'Easy');
        console.log('Result:', JSON.stringify(questions, null, 2));

        if (questions.length > 0 && questions[0].text && !questions[0].text.includes('(AI Unavailable)')) {
            console.log('SUCCESS: Generated valid questions.');
        } else {
            console.log('FAILURE: Falling back to mock data or error occurred.');
        }
    } catch (error) {
        console.error('CRITICAL ERROR:', error);
    }
}

test();

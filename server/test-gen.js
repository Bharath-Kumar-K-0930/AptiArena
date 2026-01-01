require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGen() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use gemini-1.5-flash as intended
        const model = genAI.getGenerativeModel({
            model: "models/gemini-1.5-flash"
        });

        const prompt = 'Generate 5 multiple choice questions about "age logical reasoning". Return pure JSON array.';

        console.log("Generating...");
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("Success! Length:", text.length);
        console.log("Sample:", text.slice(0, 100));
    } catch (e) {
        console.error("Gen Error:", e);
    }
}
testGen();

require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) { console.log('No key'); return; }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Status:', res.status);
        if (data.models) {
            console.log('Models found:', data.models.length);
            console.log(data.models.map(m => m.name).join(', '));
        } else {
            console.log('Error Data:', data);
        }
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

listModels();

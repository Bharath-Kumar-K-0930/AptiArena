require('dotenv').config();

async function tryUrl(model, version) {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
    console.log(`Trying ${version} ${model}...`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
        });
        if (res.ok) console.log("SUCCESS!");
        else console.log("Failed:", res.status, (await res.json()).error.message);
    } catch (e) {
        console.log("Error:", e.message);
    }
}

(async () => {
    await tryUrl('gemini-1.5-flash', 'v1beta');
    await tryUrl('gemini-1.5-flash', 'v1');
    await tryUrl('gemini-pro', 'v1beta');
    await tryUrl('gemini-1.0-pro', 'v1beta');
})();

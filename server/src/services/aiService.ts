import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: any;

const parseQuizPattern = (text: string) => {
    try {
        const questions: any[] = [];
        // Split by "1.", "2.", etc. at the start of a line or after a newline
        const chunks = text.split(/\n\s*\d+\.\s+/).slice(1); // slice(1) to remove pre-text

        for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            const lines = chunk.split('\n');
            let questionText = "";
            const options: any[] = [];
            let correctAnswerKey = "";
            let reason = "";

            let parsingMode: 'question' | 'options' | 'answer' | 'reason' = 'question';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.match(/^[A-D]\.\s+/)) {
                    parsingMode = 'options';
                    const optText = trimmed.replace(/^[A-D]\.\s+/, '').trim();
                    const isCorrect = false; // set later
                    options.push({ key: trimmed[0], text: optText, isCorrect });
                } else if (trimmed.startsWith("Correct Answer:")) {
                    parsingMode = 'answer';
                    const match = trimmed.match(/Correct Answer:\s*([A-D])/i);
                    if (match) correctAnswerKey = match[1].toUpperCase();
                } else if (trimmed.startsWith("Reason:")) {
                    parsingMode = 'reason';
                    reason = trimmed.replace("Reason:", "").trim();
                } else {
                    // Continuation of previous field
                    if (parsingMode === 'question') questionText += (questionText ? " " : "") + trimmed;
                    if (parsingMode === 'reason') reason += " " + trimmed;
                }
            }

            // Mark correct option
            const finalOptions = options.map(opt => ({
                text: opt.text,
                isCorrect: opt.key === correctAnswerKey
            }));

            if (questionText && finalOptions.length > 0) {
                questions.push({
                    text: questionText,
                    options: finalOptions,
                    explanation: reason,
                    timeLimit: 30
                });
            }
        }

        return questions.length >= 3 ? questions : null; // Only use if we found at least 3 valid questions
    } catch (e) {
        console.error("Regex Parsing failed:", e);
        return null;
    }
};

export const generateQuizFromText = async (topic: string, text?: string, difficulty?: string, amount: number = 5) => {
    // 1. Try Deterministic Regex Parsing first
    if (text) {
        const parsed = parseQuizPattern(text);
        if (parsed && parsed.length > 0) {
            console.log("Structured text detected! Using Regex Parser.");
            return parsed;
        }
    }

    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("Missing GEMINI_API_KEY, using mock data");
            throw new Error("Missing API Key");
        }

        if (!genAI) {
            genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }

        // Use standard gemini-pro model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        let prompt = "";

        if (text && text.length > 50) {
            // Extraction Mode
            prompt = `
                You are an expert educational AI. 
                Analyze the following text which contains quiz questions (and possibly answers/reasoning).
                
                Your task is to EXTRACT the questions exactly as they appear, along with their options, correct answer, and explanation (if provided).
                If the text contains ${amount} questions, extract all of them. If it contains more, extract the first ${amount}.
                
                Input Text:
                """
                ${text.substring(0, 15000)}
                """

                Output Requirements:
                - Return ONLY a raw JSON array.
                - No markdown, no code blocks, no 'json' prefix.
                - Structure:
                [
                    {
                        "text": "The exact question text",
                        "options": [
                            { "text": "Option A text", "isCorrect": false },
                            { "text": "Option B text", "isCorrect": true }
                        ],
                        "explanation": "The reason/explanation provided in the text (or generate a brief one if missing)",
                        "timeLimit": 30
                    }
                ]
            `;
        } else {
            // Generation Mode
            prompt = `
                Generate ${amount} multiple-choice questions (MCQ) about "${topic}".
                Difficulty: ${difficulty || 'Medium'}.
                
                Return ONLY a raw JSON array (no markdown code blocks, no 'json' prefix) with this structure:
                [
                    {
                        "text": "Question text",
                        "options": [
                            { "text": "Option 1", "isCorrect": false },
                            { "text": "Option 2", "isCorrect": true },
                            { "text": "Option 3", "isCorrect": false },
                            { "text": "Option 4", "isCorrect": false }
                        ],
                        "explanation": "Brief explanation of the correct answer",
                        "timeLimit": 30
                    }
                ]
            `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        console.log("Gemini Raw Response:", content.substring(0, 200) + "..."); // log start only

        // Robust JSON extraction
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;

        return JSON.parse(jsonStr);

    } catch (error) {
        console.error('AI Generation Error:', error);

        // Smart Fallback Generation using Topic
        const mockQuestions = [];
        const t = topic ? topic.trim().toLowerCase() : "general knowledge";

        console.log(`Generating fallback questions for: ${t}`);

        // --- Competitive Exam Question Banks ---
        const competitiveExams: any = {
            ages: [
                { text: "A father is twice as old as his son. 20 years ago, the age of the father was 12 times the age of the son. The present age of the father (in years) is:", options: ["44", "32", "40", "28"], correct: 0, reason: "Let son's age = x. Father's age = 2x. (2x-20) = 12(x-20) => x=22. Father = 44." },
                { text: "The sum of ages of 5 children born at the intervals of 3 years each is 50 years. What is the age of the youngest child?", options: ["4", "8", "10", "None of these"], correct: 0, reason: "x + (x+3) + (x+6) + (x+9) + (x+12) = 50 => 5x + 30 = 50 => 5x = 20 => x = 4." },
                { text: "A is two years older than B who is twice as old as C. If the total of the ages of A, B and C be 27, then how old is B?", options: ["7", "8", "9", "10", "11"], correct: 3, reason: "Let C=x. B=2x. A=2x+2. x+2x+2x+2 = 27 => 5x=25 => x=5. B=10." },
                { text: "The present ages of three persons in proportions 4 : 7 : 9. Eight years ago, the sum of their ages was 56. Find their present ages (in years).", options: ["8, 20, 28", "16, 28, 36", "20, 35, 45", "None of these"], correct: 1, reason: "Sum of present ages = 56 + (3*8) = 80. Ratio 4:7:9. 20x=80 => x=4. Ages: 16, 28, 36." },
                { text: "Ten years ago, P was half of Q's age. If the ratio of their present ages is 3:4, what will be the total of their present ages?", options: ["20", "30", "45", "35"], correct: 3, reason: "Let ages be 3x, 4x. (3x-10) = 1/2(4x-10) => 6x-20 = 4x-10 => 2x=10 => x=5. Total = 7x = 35." },
                { text: "A man is 24 years older than his son. In two years, his age will be twice the age of his son. The present age of the son is:", options: ["14", "18", "20", "22"], correct: 3, reason: "Father=x+24, Son=x. (x+24)+2 = 2(x+2) => x+26 = 2x+4 => x=22." }
            ],
            series: [
                { text: "Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?", options: ["(1/3)", "(1/8)", "(2/8)", "(1/16)"], correct: 1, reason: "Each number is half the previous number." },
                { text: "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?", options: ["7", "10", "12", "13"], correct: 1, reason: "Alternating series: 7->8->9->10 and 10->11->12." },
                { text: "Look at this series: 36, 34, 30, 28, 24, ... What number should come next?", options: ["20", "22", "23", "26"], correct: 1, reason: "Alternating subtraction: -2, -4, -2, -4... Next is -2 => 22." },
                { text: "Look at this series: 22, 21, 23, 22, 24, 23, ... What number should come next?", options: ["22", "24", "25", "26"], correct: 2, reason: "Alternating +1, -1 pattern shifted." },
                { text: "53, 53, 40, 40, 27, 27, ... What number should come next?", options: ["12", "14", "27", "53"], correct: 1, reason: "Repetition series with subtraction of 13." }
            ],
            blood: [
                { text: "Pointing to a photograph of a boy Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?", options: ["Brother", "Uncle", "Cousin", "Father"], correct: 3, reason: "Only son of mother is Suresh himself. So the boy is his son." },
                { text: "If A + B means A is the mother of B; A - B means A is the brother B; A % B means A is the father of B and A x B means A is the sister of B, which of the following shows that P is the maternal uncle of Q?", options: ["Q - N + M x P", "P + S x N - Q", "P - M + N x Q", "Q - S % P"], correct: 2, reason: "P - M means P is brother of M. M + N means M is mother of N. So P is uncle of N (and likely Q)." },
                { text: "Introducing a boy, a girl said, 'He is the son of the daughter of the father of my uncle.' How is the boy related to the girl?", options: ["Brother", "Nephew", "Uncle", "Son-in-law"], correct: 0, reason: "Complex relation implies brother/cousin." },
                { text: "A is B's sister. C is B's mother. D is C's father. E is D's mother. Then, how is A related to D?", options: ["Granddaughter", "Grandmother", "Daughter", "Grandfather"], correct: 0, reason: "A is daughter of C, C is daughter of D. So A is Granddaughter." }
            ]
        };

        let selectedTemplate = null;
        if (t.includes('age')) selectedTemplate = competitiveExams.ages;
        else if (t.includes('series') || t.includes('number')) selectedTemplate = competitiveExams.series;
        else if (t.includes('blood') || t.includes('relation') || t.includes('family')) selectedTemplate = competitiveExams.blood;

        if (selectedTemplate) {
            console.log("Using Pre-defined Competitive Exam Questions");
            for (let i = 0; i < amount; i++) {
                const q = selectedTemplate[i % selectedTemplate.length];
                const opts = q.options.map((opt: string, idx: number) => ({
                    text: opt,
                    isCorrect: idx === q.correct
                })).sort(() => Math.random() - 0.5);

                mockQuestions.push({
                    text: q.text,
                    options: opts,
                    explanation: q.reason || "Standard reasoning logic.",
                    timeLimit: 45
                });
            }
            return mockQuestions;
        }

        // --- End Competitive Exam Logic ---

        for (let i = 0; i < amount; i++) {
            const templateType = i % 5;
            let qText = "";
            let opts: string[] = [];
            let correctInfo = "";

            // Dynamic templates based on topic
            switch (templateType) {
                case 0:
                    qText = `What is a primary characteristic of ${t}?`;
                    opts = ["It is fundamental", "It is unrelated", "It is obsolete", "It is incorrect"];
                    correctInfo = "This is a key aspect.";
                    break;
                case 1:
                    qText = `Which of the following is associated with ${t}?`;
                    opts = ["Concept A", "Concept B", "Concept C", "Concept D"];
                    correctInfo = "Common association.";
                    break;
                case 2:
                    qText = `Why is ${t} considered important?`;
                    opts = ["For efficiency", "For confusion", "For reduction", "No importance"];
                    correctInfo = "Significance in the field.";
                    break;
                case 3:
                    qText = `True or False: ${t} involves complex analysis?`;
                    opts = ["True", "False", "Neither", "Both"];
                    correctInfo = "Generally true for this topic.";
                    break;
                case 4:
                    qText = `In the context of ${t}, what is the best approach?`;
                    opts = ["Systematic method", "Random guessing", "Ignoring it", "Manual labor"];
                    correctInfo = "Best practice.";
                    break;
            }

            mockQuestions.push({
                text: qText,
                options: opts.map((opt, idx) => ({ text: opt, isCorrect: idx === 0 })).sort(() => Math.random() - 0.5),
                explanation: `Fallback explanation: ${correctInfo}`,
                timeLimit: 30
            });
        }

        return mockQuestions;
    }
};


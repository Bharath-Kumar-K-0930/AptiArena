import fs from 'fs';
const pdf = require('pdf-parse');
const { getTextExtractor } = require('office-text-extractor');
const extractor = getTextExtractor();

export const extractTextFromFile = async (file: any): Promise<string> => {
    const filePath = file.path;
    const mimeType = file.mimetype;

    try {
        let text = '';

        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            text = data.text;
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || // PPTX
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
        ) {
            text = await extractor.extractText({ input: filePath, type: 'file' });
        } else {
            // Fallback for plain text
            text = fs.readFileSync(filePath, 'utf-8');
        }

        // Cleanup: delete the temp file
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.error('Error deleting temp file:', e);
        }

        return text.trim();
    } catch (error) {
        console.error('File extraction error:', error);
        throw new Error('Failed to extract text from file');
    }
};

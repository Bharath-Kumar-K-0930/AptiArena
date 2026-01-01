
import { Request, Response } from 'express';

export const uploadFile = (req: Request, res: Response): void => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        // Assuming the file is saved in 'uploads/' or similar by middleware
        // Return the accessible URL
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({ url: fileUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

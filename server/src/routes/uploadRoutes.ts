
import express from 'express';
import { uploadFile } from '../controllers/uploadController';
import { upload } from '../middlewares/uploadMiddleware';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/image', protect, upload.single('file'), (req: any, res: any) => {
    uploadFile(req, res);
});

export default router;

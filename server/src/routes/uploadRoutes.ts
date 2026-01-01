
import express from 'express';
import { uploadFile } from '../controllers/uploadController';
import { upload } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.post('/image', upload.single('file'), (req: any, res: any) => {
    uploadFile(req, res);
});

export default router;

import express from 'express';
import { createQuiz, getQuizzes, getMyQuizzes, getQuizById, deleteQuiz, generateQuiz, getHostStats, updateQuiz } from '../controllers/quizController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

import { upload } from '../middlewares/uploadMiddleware';

router.post('/generate', protect, upload.single('file'), generateQuiz);
router.post('/', protect, createQuiz);
router.get('/', getQuizzes);
router.get('/my', protect, getMyQuizzes);
router.get('/stats', protect, getHostStats); // Moved up
router.get('/:id', getQuizById);
router.put('/:id', protect, updateQuiz);
router.delete('/:id', protect, deleteQuiz);

export default router;

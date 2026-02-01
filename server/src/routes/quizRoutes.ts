
import express from 'express';
import { createQuiz, getQuizzes, getMyQuizzes, getQuizById, deleteQuiz, generateQuiz, getHostStats, updateQuiz } from '../controllers/quizController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = express.Router();

import { upload } from '../middlewares/uploadMiddleware';

// Restricted to hosts
router.post('/generate', protect, restrictTo('host'), upload.single('file'), generateQuiz);
router.post('/', protect, restrictTo('host'), createQuiz);
router.put('/:id', protect, restrictTo('host'), updateQuiz);
router.delete('/:id', protect, restrictTo('host'), deleteQuiz);
router.get('/stats', protect, restrictTo('host'), getHostStats);

// Protected (any authenticated user)
router.get('/my', protect, getMyQuizzes);

// Public
router.get('/', getQuizzes);
router.get('/:id', getQuizById);

export default router;

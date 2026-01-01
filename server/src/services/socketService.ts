import { Server, Socket } from 'socket.io';
import GameSession from '../models/GameSession';
import Quiz from '../models/Quiz';

export const setupSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('Socket connected:', socket.id);

        socket.on('create_game', async ({ quizId, hostId, gameMode }) => {
            try {
                // Generate a random 6-digit PIN
                let pin = Math.floor(100000 + Math.random() * 900000).toString();

                const session = new GameSession({
                    quizId,
                    hostId,
                    pin,
                    status: 'waiting',
                    participants: [],
                    gameMode: gameMode || 'live' // Default to live
                });
                await session.save();

                socket.join(pin);
                socket.emit('game_created', { pin, session });
                console.log(`Game created: ${pin}`);
            } catch (error) {
                console.error(error);
                socket.emit('error', 'Failed to create game');
            }
        });

        socket.on('join_game', async ({ pin, name }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) {
                    socket.emit('error', 'Game not found');
                    return;
                }

                const existingParticipant = session.participants.find(p => p.name === name);

                if (existingParticipant) {
                    // Reconnection logic
                    existingParticipant.socketId = socket.id;
                    await session.save();

                    socket.join(pin);
                    socket.emit('joined_game', { pin, mode: session.gameMode });

                    // Recover game state for reconnected user
                    if (session.status === 'live') {
                        const quiz = await Quiz.findById(session.quizId);
                        if (quiz && quiz.questions[session.currentQuestionIndex]) {
                            socket.emit('new_question', {
                                question: quiz.questions[session.currentQuestionIndex],
                                index: session.currentQuestionIndex,
                                total: quiz.questions.length
                            });
                        }
                    }
                    console.log(`Player ${name} reconnected to game ${pin}`);
                } else {
                    // New join logic
                    if (session.status !== 'waiting') {
                        socket.emit('error', 'Game already started');
                        return;
                    }

                    session.participants.push({ socketId: socket.id, name, score: 0, lastAnsweredQuestionIndex: -1 });
                    await session.save();

                    socket.join(pin);
                    io.to(pin).emit('player_joined', { name, total: session.participants.length });
                    socket.emit('joined_game', { pin, mode: session.gameMode });
                    console.log(`Player ${name} joined game ${pin}`);
                }
            } catch (error) {
                console.error(error);
                socket.emit('error', 'Failed to join game');
            }
        });

        socket.on('start_game', async ({ pin }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) return;

                session.status = 'live';
                session.currentQuestionIndex = 0;
                await session.save();

                const quiz = await Quiz.findById(session.quizId);
                if (!quiz) return;

                // Send first question
                const question = quiz.questions[0];
                io.to(pin).emit('new_question', { question, index: 0, total: quiz.questions.length });

                console.log(`Game started: ${pin}`);
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('request_question', async ({ pin, index }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) return;

                const quiz = await Quiz.findById(session.quizId);
                if (!quiz) return;

                if (index < quiz.questions.length) {
                    const question = quiz.questions[index];
                    socket.emit('new_question', { question, index, total: quiz.questions.length });
                } else {
                    const participant = session.participants.find(p => p.socketId === socket.id);
                    const leaderboard = session.participants.sort((a, b) => b.score - a.score).slice(0, 5);
                    socket.emit('game_over', { leaderboard, playerScore: participant?.score });
                }
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('submit_answer', async ({ pin, answerIndex, questionIndex }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) return;

                const quiz = await Quiz.findById(session.quizId);
                if (!quiz) return;

                // Use provided questionIndex for practice mode, otherwise global session index
                const qIndex = (typeof questionIndex === 'number') ? questionIndex : session.currentQuestionIndex;
                const currentQ = quiz.questions[qIndex];

                if (!currentQ) {
                    console.error('Question not found for index:', qIndex);
                    return;
                }

                const isCorrect = currentQ.options[answerIndex].isCorrect;
                const score = isCorrect ? 100 : 0;

                const pIndex = session.participants.findIndex(p => p.socketId === socket.id);
                if (pIndex !== -1) {
                    session.participants[pIndex].score += score;
                    session.participants[pIndex].lastAnsweredQuestionIndex = qIndex;
                    await session.save();

                    socket.emit('answer_result', { isCorrect, score });

                    // Notify host about progress
                    const answeredCount = session.participants.filter(p => p.lastAnsweredQuestionIndex === qIndex).length;
                    io.to(pin).emit('player_answered', {
                        name: session.participants[pIndex].name,
                        count: answeredCount,
                        total: session.participants.length
                    });
                }
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('next_question', async ({ pin }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) return;

                const quiz = await Quiz.findById(session.quizId);
                if (!quiz) return;

                const nextIndex = session.currentQuestionIndex + 1;

                if (nextIndex < quiz.questions.length) {
                    session.currentQuestionIndex = nextIndex;
                    await session.save();

                    const question = quiz.questions[nextIndex];
                    io.to(pin).emit('new_question', { question, index: nextIndex, total: quiz.questions.length });
                } else {
                    session.status = 'finished';
                    await session.save();

                    // Send final leaderboard
                    const leaderboard = session.participants.sort((a, b) => b.score - a.score).slice(0, 5);
                    io.to(pin).emit('game_over', { leaderboard });
                }
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });
};

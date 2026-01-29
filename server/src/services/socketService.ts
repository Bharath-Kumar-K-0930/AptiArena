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

        socket.on('join_game', async ({ pin, name, userId, fingerprint }) => {
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
                            const question = quiz.questions[session.currentQuestionIndex];
                            // Sanitize question (remove isCorrect)
                            const sanitizedQuestion = {
                                text: question.text,
                                options: question.options.map((o: any) => ({ text: o.text })),
                                timeLimit: question.timeLimit,
                                image: question.image
                            };
                            socket.emit('new_question', { question: sanitizedQuestion, index: session.currentQuestionIndex, total: quiz.questions.length });
                        }
                    }
                    console.log(`Player ${name} reconnected to game ${pin}`);
                } else {
                    // New join logic
                    if (session.status !== 'waiting') {
                        socket.emit('error', 'Game already started');
                        return;
                    }

                    // Check for multiple devices (same userId or name but different fingerprint)
                    const otherSessionWithSameIdentity = session.participants.find(p =>
                        (userId && p.userId?.toString() === userId.toString()) || p.name === name
                    );

                    let isFlagged = false;
                    if (otherSessionWithSameIdentity && otherSessionWithSameIdentity.fingerprint !== fingerprint) {
                        isFlagged = true;
                    }

                    session.participants.push({
                        socketId: socket.id,
                        name,
                        userId: userId || undefined,
                        score: 0,
                        streak: 0,
                        lastAnsweredQuestionIndex: -1,
                        fingerprint,
                        tabSwitchCount: 0,
                        copyAttemptCount: 0,
                        tooFastCount: 0,
                        cheatScore: isFlagged ? 5 : 0, // Initial flag penalty
                        isFlagged: isFlagged
                    });
                    await session.save();

                    socket.join(pin);
                    io.to(pin).emit('player_joined', { name, total: session.participants.length, isFlagged });
                    socket.emit('joined_game', { pin, mode: session.gameMode });

                    if (isFlagged) {
                        io.to(pin).emit('cheat_alert', {
                            participantId: socket.id,
                            name,
                            type: 'MULTIPLE_DEVICES',
                            cheatScore: 5
                        });
                    }
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
                session.currentQuestionSentAt = new Date();
                await session.save();

                const quiz = await Quiz.findById(session.quizId);
                if (!quiz) return;

                // Send first question
                const question = quiz.questions[0];

                const startTime = Date.now();
                // 1. Send full question to Host (Sender)
                socket.emit('new_question', { question, index: 0, total: quiz.questions.length, startTime });

                // 2. Send sanitized question to Players (Everyone else in room)
                const sanitizedQuestion = {
                    text: question.text,
                    options: question.options.map((o: any) => ({ text: o.text })),
                    timeLimit: question.timeLimit,
                    image: question.image
                };
                socket.to(pin).emit('new_question', { question: sanitizedQuestion, index: 0, total: quiz.questions.length, startTime });

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
                    const sanitizedQuestion = {
                        text: question.text,
                        options: question.options.map((o: any) => ({ text: o.text })),
                        timeLimit: question.timeLimit,
                        image: question.image
                    };
                    socket.emit('new_question', { question: sanitizedQuestion, index, total: quiz.questions.length });
                } else {
                    const participant = session.participants.find(p => p.socketId === socket.id);
                    const leaderboard = session.participants
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 5)
                        .map(p => ({
                            name: p.name,
                            score: p.score,
                            streak: p.streak,
                            socketId: p.socketId,
                            cheatScore: p.cheatScore,
                            isFlagged: p.isFlagged
                        }));
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

                // Check for unusually fast answers
                const responseTime = Date.now() - (session.currentQuestionSentAt?.getTime() || Date.now());
                let isTooFast = false;
                if (responseTime < 1000 && session.gameMode === 'live') {
                    isTooFast = true;
                }

                const pIndex = session.participants.findIndex(p => p.socketId === socket.id);
                if (pIndex !== -1) {
                    session.participants[pIndex].score += score;

                    if (isTooFast) {
                        session.participants[pIndex].tooFastCount += 1;
                        session.participants[pIndex].cheatScore += 1;
                        io.to(pin).emit('cheat_alert', {
                            participantId: socket.id,
                            name: session.participants[pIndex].name,
                            type: 'TOO_FAST',
                            cheatScore: session.participants[pIndex].cheatScore
                        });
                    }

                    if (isCorrect) {
                        session.participants[pIndex].streak = (session.participants[pIndex].streak || 0) + 1;
                    } else {
                        session.participants[pIndex].streak = 0;
                    }

                    session.participants[pIndex].lastAnsweredQuestionIndex = qIndex;
                    session.participants[pIndex].lastAnswerIndex = answerIndex; // Store answer for stats
                    await session.save();

                    const resultData: any = { isCorrect, score };
                    if (session.gameMode === 'practice') {
                        const correctIndex = currentQ.options.findIndex((o: any) => o.isCorrect);
                        resultData.correctIndex = correctIndex;
                        resultData.explanation = currentQ.explanation;
                        resultData.answerText = currentQ.options[correctIndex]?.text;
                    }
                    socket.emit('answer_result', resultData);

                    // Notify host about progress & stats
                    const participantsOnThisQ = session.participants.filter(p => p.lastAnsweredQuestionIndex === qIndex);

                    // Calculate option distribution for host
                    const distribution = [0, 0, 0, 0];
                    participantsOnThisQ.forEach(p => {
                        if (typeof p.lastAnswerIndex === 'number') {
                            distribution[p.lastAnswerIndex]++;
                        }
                    });

                    io.to(pin).emit('player_answered', {
                        name: session.participants[pIndex].name,
                        count: participantsOnThisQ.length,
                        total: session.participants.length,
                        distribution // A, B, C, D counts
                    });
                }
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('reveal_answer', async ({ pin }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) return;

                const quiz = await Quiz.findById(session.quizId);
                if (!quiz) return;

                const currentQ = quiz.questions[session.currentQuestionIndex];

                const correctIndex = currentQ.options.findIndex(o => o.isCorrect);
                const answerText = currentQ.options[correctIndex]?.text;

                // Calculate leaderboard
                const leaderboard = session.participants
                    .sort((a, b) => b.score - a.score)
                    .map(p => ({
                        name: p.name,
                        score: p.score,
                        streak: p.streak,
                        socketId: p.socketId,
                        cheatScore: p.cheatScore,
                        isFlagged: p.isFlagged
                    }));

                io.to(pin).emit('answer_revealed', {
                    correctIndex,
                    answerText,
                    explanation: currentQ.explanation,
                    leaderboard
                });

            } catch (error) {
                console.error(error);
            }
        });

        socket.on('show_leaderboard', async ({ pin }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) return;

                // Send top 5
                const leaderboard = session.participants
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map(p => ({
                        name: p.name,
                        score: p.score,
                        streak: p.streak,
                        socketId: p.socketId,
                        cheatScore: p.cheatScore,
                        isFlagged: p.isFlagged
                    }));
                io.to(pin).emit('leaderboard_update', { leaderboard });

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
                    session.currentQuestionSentAt = new Date();
                    await session.save();

                    const question = quiz.questions[nextIndex];

                    const startTime = Date.now();
                    // 1. Send full question to Host
                    socket.emit('new_question', { question, index: nextIndex, total: quiz.questions.length, startTime });

                    // 2. Send sanitized question to Players
                    const sanitizedQuestion = {
                        text: question.text,
                        options: question.options.map((o: any) => ({ text: o.text })),
                        timeLimit: question.timeLimit,
                        image: question.image
                    };
                    socket.to(pin).emit('new_question', { question: sanitizedQuestion, index: nextIndex, total: quiz.questions.length, startTime });
                } else {
                    session.status = 'finished';
                    await session.save();

                    // Send final leaderboard
                    const leaderboard = session.participants
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 5)
                        .map(p => ({
                            name: p.name,
                            score: p.score,
                            streak: p.streak,
                            socketId: p.socketId,
                            cheatScore: p.cheatScore,
                            isFlagged: p.isFlagged
                        }));
                    io.to(pin).emit('game_over', { leaderboard });
                }
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('end_game', async ({ pin }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) return;

                session.status = 'finished';
                await session.save();

                // Send final leaderboard
                const leaderboard = session.participants
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map(p => ({
                        name: p.name,
                        score: p.score,
                        streak: p.streak,
                        socketId: p.socketId,
                        cheatScore: p.cheatScore,
                        isFlagged: p.isFlagged
                    }));
                io.to(pin).emit('game_over', { leaderboard });
                console.log(`Game ended early by host: ${pin}`);
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('TAB_SWITCH', async ({ pin }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) return;

                const pIndex = session.participants.findIndex(p => p.socketId === socket.id);
                if (pIndex !== -1) {
                    const participantName = session.participants[pIndex].name;
                    const participantId = socket.id;

                    session.participants[pIndex].tabSwitchCount += 1;
                    session.participants[pIndex].cheatScore += 1;

                    // Auto-kick on first tab switch
                    if (session.participants[pIndex].tabSwitchCount >= 1) {
                        session.participants.splice(pIndex, 1);
                        await session.save();

                        // Notify host
                        io.to(pin).emit('cheat_alert', {
                            participantId: participantId,
                            name: participantName,
                            type: 'AUTO_KICK_TAB_SWITCH',
                            count: 1,
                            cheatScore: 1
                        });

                        // Notify participant
                        io.to(participantId).emit('KICKED', {
                            message: 'You have been automatically removed for switching tabs/minimizing the browser.'
                        });

                        // Update room
                        io.to(pin).emit('player_left', {
                            name: participantName,
                            total: session.participants.length,
                            participantId: participantId,
                            reason: 'Auto-kicked for tab switching'
                        });

                        console.log(`Player ${participantName} auto-kicked for tab switch from ${pin}`);
                    } else {
                        await session.save();
                        io.to(pin).emit('cheat_alert', {
                            participantId: socket.id,
                            name: session.participants[pIndex].name,
                            type: 'TAB_SWITCH',
                            count: session.participants[pIndex].tabSwitchCount,
                            cheatScore: session.participants[pIndex].cheatScore
                        });
                    }
                }
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('COPY_ATTEMPT', async ({ pin }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) return;

                const pIndex = session.participants.findIndex(p => p.socketId === socket.id);
                if (pIndex !== -1) {
                    session.participants[pIndex].copyAttemptCount += 1;
                    session.participants[pIndex].cheatScore += 2;
                    await session.save();

                    io.to(pin).emit('cheat_alert', {
                        participantId: socket.id,
                        name: session.participants[pIndex].name,
                        type: 'COPY_ATTEMPT',
                        count: session.participants[pIndex].copyAttemptCount,
                        cheatScore: session.participants[pIndex].cheatScore
                    });
                }
            } catch (error) {
                console.error(error);
            }
        });

        socket.on('KICK_PARTICIPANT', async ({ pin, participantId }) => {
            try {
                const session = await GameSession.findOne({ pin });
                if (!session) return;

                const pIndex = session.participants.findIndex(p => p.socketId === participantId);
                if (pIndex !== -1) {
                    const participantName = session.participants[pIndex].name;
                    session.participants.splice(pIndex, 1);
                    await session.save();

                    // Notify the specific participant they've been kicked
                    io.to(participantId).emit('KICKED', { message: 'You have been removed from the session by the host.' });

                    // Update room about player leaving
                    io.to(pin).emit('player_left', {
                        name: participantName,
                        total: session.participants.length,
                        participantId: participantId,
                        reason: 'Removed by host'
                    });

                    console.log(`Player ${participantName} kicked from game ${pin}`);
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

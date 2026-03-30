const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const logger = require('./config/logger');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const pingRoutes = require('./routes/pingRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const readingListRoutes = require('./routes/readingListRoutes');
const followRoutes = require('./routes/followRoutes');
const commentRoutes = require('./routes/commentRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ping', pingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reading-list', readingListRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);


module.exports = app;

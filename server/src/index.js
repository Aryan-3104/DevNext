import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { connectDB } from './config/db.js';
import './config/passport.js'; // registers the GitHub strategy as a side-effect
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import communitiesRouter from './routes/communities.js';
import postsRouter from './routes/posts.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

connectDB();

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(passport.initialize()); // session: false — no session middleware needed

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/communities', communitiesRouter);
app.use('/api/posts', postsRouter);

app.use(errorHandler); // global error handler must remain last

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
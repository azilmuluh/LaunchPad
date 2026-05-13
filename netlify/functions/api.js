import express from 'express';
import serverless from 'serverless-http';

// Import all Vercel handlers
import aiAgent from '../../api/ai-agent.js';
import aiChat from '../../api/ai-chat.js';
import aiFeedback from '../../api/ai-feedback.js';
import aiRoadmap from '../../api/ai-roadmap.js';
import auth from '../../api/auth.js';
import badges from '../../api/badges.js';
import blips from '../../api/blips.js';
import bookmarks from '../../api/bookmarks.js';
import circles from '../../api/circles.js';
import comments from '../../api/comments.js';
import connections from '../../api/connections.js';
import engage from '../../api/engage.js';
import flyerParse from '../../api/flyer-parse.js';
import goals from '../../api/goals.js';
import insights from '../../api/insights.js';
import leaderboard from '../../api/leaderboard.js';
import likes from '../../api/likes.js';
import messages from '../../api/messages.js';
import notify from '../../api/notify.js';
import opportunities from '../../api/opportunities.js';
import posts from '../../api/posts.js';
import quests from '../../api/quests.js';
import seedOpps from '../../api/seed-opps.js';
import socialProof from '../../api/social-proof.js';
import verifiedOpps from '../../api/verified-opps.js';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Express route wrapper to handle async errors and Vercel-like signatures
const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (err) {
    next(err);
  }
};

// Mount all handlers to their respective endpoints
const router = express.Router();

router.all('/ai-agent', wrap(aiAgent));
router.all('/ai-chat', wrap(aiChat));
router.all('/ai-feedback', wrap(aiFeedback));
router.all('/ai-roadmap', wrap(aiRoadmap));
router.all('/auth', wrap(auth));
router.all('/badges', wrap(badges));
router.all('/blips', wrap(blips));
router.all('/bookmarks', wrap(bookmarks));
router.all('/circles', wrap(circles));
router.all('/comments', wrap(comments));
router.all('/connections', wrap(connections));
router.all('/engage', wrap(engage));
router.all('/flyer-parse', wrap(flyerParse));
router.all('/goals', wrap(goals));
router.all('/insights', wrap(insights));
router.all('/leaderboard', wrap(leaderboard));
router.all('/likes', wrap(likes));
router.all('/messages', wrap(messages));
router.all('/notify', wrap(notify));
router.all('/opportunities', wrap(opportunities));
router.all('/posts', wrap(posts));
router.all('/quests', wrap(quests));
router.all('/seed-opps', wrap(seedOpps));
router.all('/social-proof', wrap(socialProof));
router.all('/verified-opps', wrap(verifiedOpps));

// Use the router for both /api and /
app.use('/api', router);
app.use('/', router);

// Final 404 handler in JSON
app.use((req, res) => {
  console.warn(`[API 404] ${req.method} ${req.path}`);
  res.status(404).json({ error: `Path ${req.path} not found in API` });
});

// Error handler in JSON
app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export const handler = serverless(app);

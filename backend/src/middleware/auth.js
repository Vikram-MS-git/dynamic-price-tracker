import { verifyToken } from '../services/authService.js';
import * as userModel from '../models/userModel.js';

/** Requires `Authorization: Bearer <jwt>`; sets req.user = { id, name, email }. */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = verifyToken(token);
    if (!userId) return res.status(401).json({ error: 'Session expired. Please log in again.' });

    const user = await userModel.findById(userId);
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

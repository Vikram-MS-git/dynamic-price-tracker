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
    const claims = verifyToken(token);
    if (!claims) return res.status(401).json({ error: 'Session expired. Please log in again.' });

    const user = await userModel.findAuthById(claims.id);
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    if (user.token_version !== claims.tv) {
      return res.status(401).json({ error: 'Your password was changed. Please log in again.' });
    }

    req.user = { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
    next();
  } catch (err) {
    next(err);
  }
}

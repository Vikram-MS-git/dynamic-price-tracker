import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/db.js';
import * as userModel from '../models/userModel.js';

const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function resolveSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn(
    '[auth] JWT_SECRET is not set. Using a temporary secret: everyone is logged out whenever the server restarts. Set JWT_SECRET in backend/.env.'
  );
  return crypto.randomBytes(32).toString('hex');
}

let secret;
function getSecret() {
  if (!secret) secret = resolveSecret();
  return secret;
}

// Used so a login for an unknown email takes as long as one for a known email.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function validateName(name) {
  const n = String(name ?? '').trim();
  if (n.length < 2) return 'Name must be at least 2 characters';
  if (n.length > 100) return 'Name must be 100 characters or fewer';
  return null;
}

function validateEmail(email) {
  if (!EMAIL_RE.test(email) || email.length > 255) return 'Enter a valid email address';
  return null;
}

function validatePassword(password) {
  const p = String(password ?? '');
  if (p.length < 8) return 'Password must be at least 8 characters';
  if (p.length > 72) return 'Password must be 72 characters or fewer';
  return null;
}

function failIfInvalid(errors) {
  const list = errors.filter(Boolean);
  if (list.length) throw new HttpError(400, list[0], list);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, getSecret(), { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, getSecret());
    return Number(payload.sub);
  } catch {
    return null;
  }
}

export async function register({ name, email, password }) {
  const cleanEmail = normalizeEmail(email);
  failIfInvalid([validateName(name), validateEmail(cleanEmail), validatePassword(password)]);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize registrations so "first user" is decided safely.
    await client.query('LOCK TABLE users IN EXCLUSIVE MODE');

    const dup = await client.query('SELECT 1 FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (dup.rowCount) throw new HttpError(409, 'An account with this email already exists');

    const { rows: countRows } = await client.query('SELECT COUNT(*)::int AS n FROM users');
    const isFirstUser = countRows[0].n === 0;

    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [String(name).trim(), cleanEmail, passwordHash]
    );
    const user = rows[0];

    // Products tracked before accounts existed go to the first account.
    if (isFirstUser) {
      await client.query('UPDATE product_groups SET user_id = $1 WHERE user_id IS NULL', [user.id]);
      await client.query('UPDATE products SET user_id = $1 WHERE user_id IS NULL', [user.id]);
    }

    await client.query('COMMIT');
    return { user, token: signToken(user) };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function login({ email, password }) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !password) throw new HttpError(400, 'Email and password are required');

  const row = await userModel.findByEmail(cleanEmail);
  const ok = await bcrypt.compare(String(password), row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) throw new HttpError(401, 'Invalid email or password');

  const user = { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
  return { user, token: signToken(user) };
}

export async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) return null;
  const stats = await userModel.getStats(userId);
  return { ...user, stats };
}

export async function updateProfile(userId, { name, email }) {
  const cleanEmail = normalizeEmail(email);
  failIfInvalid([validateName(name), validateEmail(cleanEmail)]);

  const taken = await userModel.findByEmail(cleanEmail);
  if (taken && taken.id !== userId) throw new HttpError(409, 'That email is already in use');

  return userModel.updateProfile(userId, { name: String(name).trim(), email: cleanEmail });
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  failIfInvalid([validatePassword(newPassword)]);
  const row = await userModel.findByIdWithHash(userId);
  if (!row) throw new HttpError(404, 'User not found');

  const ok = await bcrypt.compare(String(currentPassword ?? ''), row.password_hash);
  if (!ok) throw new HttpError(400, 'Current password is incorrect');

  await userModel.setPasswordHash(userId, await bcrypt.hash(newPassword, BCRYPT_ROUNDS));
}

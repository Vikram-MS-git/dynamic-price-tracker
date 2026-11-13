import * as authService from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const { user, token } = await authService.register(req.body ?? {});
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body ?? {});
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    if (!profile) return res.status(404).json({ error: 'User not found' });
    res.json({ user: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body ?? {});
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const token = await authService.changePassword(req.user.id, req.body ?? {});
    res.json({ message: 'Password updated', token });
  } catch (err) {
    next(err);
  }
}

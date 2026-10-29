import * as groupService from '../services/groupService.js';

export async function listGroups(req, res, next) {
  try {
    const groups = await groupService.listGroups();
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

export async function compareGroup(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid group id' });
    }
    const result = await groupService.compareGroup(id, {
      from: req.query.from,
      to: req.query.to,
    });
    if (!result) return res.status(404).json({ error: 'Group not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

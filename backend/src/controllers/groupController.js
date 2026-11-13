import * as groupService from '../services/groupService.js';

export async function listGroups(req, res, next) {
  try {
    const groups = await groupService.listGroups(req.user.id);
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
    const result = await groupService.compareGroup(req.user.id, id, {
      from: req.query.from,
      to: req.query.to,
    });
    if (!result) return res.status(404).json({ error: 'Group not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateGroup(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid group id' });
    }
    const { name, category } = req.body ?? {};
    const updated = await groupService.updateGroup(req.user.id, id, {
      name: name?.trim(),
      category: category?.trim(),
    });
    if (!updated) return res.status(404).json({ error: 'Group not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteGroup(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid group id' });
    }
    const deleted = await groupService.removeGroup(req.user.id, id);
    if (!deleted) return res.status(404).json({ error: 'Group not found' });
    res.json({ message: 'Group deleted', id });
  } catch (err) {
    next(err);
  }
}

export async function assignProduct(req, res, next) {
  try {
    const groupId = req.params.id === 'none' ? null : Number(req.params.id);
    const productId = Number(req.body?.productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ error: 'Valid productId is required' });
    }
    const updated = await groupService.assignProductToGroup(req.user.id, productId, groupId);
    if (!updated) return res.status(404).json({ error: 'Product or group not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

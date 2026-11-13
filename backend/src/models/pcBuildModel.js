import { query } from '../config/db.js';

export async function getUserBuilds(userId) {
  const result = await query(
    `SELECT * FROM pc_builds WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getBuildById(id, userId) {
  const result = await query(
    `SELECT * FROM pc_builds WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] ?? null;
}

export async function createBuild(userId, { name, description, useCase, components, totalPrice, estimatedWattage }) {
  const result = await query(
    `INSERT INTO pc_builds (user_id, name, description, use_case, components, total_price, estimated_wattage)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      userId,
      name || 'Custom PC Build',
      description || '',
      useCase || 'custom',
      JSON.stringify(components || {}),
      Number(totalPrice) || 0,
      Number(estimatedWattage) || 0,
    ]
  );
  return result.rows[0];
}

export async function updateBuild(id, userId, { name, description, useCase, components, totalPrice, estimatedWattage }) {
  const result = await query(
    `UPDATE pc_builds
     SET name = COALESCE($3, name),
         description = COALESCE($4, description),
         use_case = COALESCE($5, use_case),
         components = COALESCE($6::jsonb, components),
         total_price = COALESCE($7, total_price),
         estimated_wattage = COALESCE($8, estimated_wattage),
         updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [
      id,
      userId,
      name,
      description,
      useCase,
      components ? JSON.stringify(components) : null,
      totalPrice != null ? Number(totalPrice) : null,
      estimatedWattage != null ? Number(estimatedWattage) : null,
    ]
  );
  return result.rows[0] ?? null;
}

export async function deleteBuild(id, userId) {
  const result = await query(
    `DELETE FROM pc_builds WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return result.rows[0] ?? null;
}

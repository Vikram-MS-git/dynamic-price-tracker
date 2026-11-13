import {
  COMPONENT_CATALOG,
  checkCompatibility,
  calculateBuildTotals,
  recommendBuilds,
  convertBuildToTrackedProducts,
} from '../services/pcBuilderService.js';
import * as pcBuildModel from '../models/pcBuildModel.js';

export async function getCatalog(_req, res) {
  res.json({
    catalog: COMPONENT_CATALOG,
    categories: Object.keys(COMPONENT_CATALOG),
  });
}

export async function checkBuildCompatibility(req, res) {
  const { components = {} } = req.body;
  const compatibility = checkCompatibility(components);
  const totals = calculateBuildTotals(components);
  res.json({
    compatibility,
    totals,
  });
}

export async function getRecommendations(req, res) {
  const { useCase, budget, brandPreference } = req.body;
  const recommendations = recommendBuilds({ useCase, budget, brandPreference });
  res.json({ recommendations });
}

export async function listBuilds(req, res) {
  const builds = await pcBuildModel.getUserBuilds(req.user.id);
  res.json(builds);
}

export async function getBuild(req, res) {
  const build = await pcBuildModel.getBuildById(req.params.id, req.user.id);
  if (!build) return res.status(404).json({ error: 'Build not found' });
  res.json(build);
}

export async function createBuild(req, res) {
  const { name, description, useCase, components, totalPrice, estimatedWattage } = req.body;
  const build = await pcBuildModel.createBuild(req.user.id, {
    name,
    description,
    useCase,
    components,
    totalPrice,
    estimatedWattage,
  });
  res.status(201).json(build);
}

export async function updateBuild(req, res) {
  const { name, description, useCase, components, totalPrice, estimatedWattage } = req.body;
  const build = await pcBuildModel.updateBuild(req.params.id, req.user.id, {
    name,
    description,
    useCase,
    components,
    totalPrice,
    estimatedWattage,
  });
  if (!build) return res.status(404).json({ error: 'Build not found' });
  res.json(build);
}

export async function deleteBuild(req, res) {
  const deleted = await pcBuildModel.deleteBuild(req.params.id, req.user.id);
  if (!deleted) return res.status(404).json({ error: 'Build not found' });
  res.json({ success: true, id: deleted.id });
}

export async function trackBuildComponents(req, res) {
  const { name, components } = req.body;
  if (!components || typeof components !== 'object') {
    return res.status(400).json({ error: 'Components object is required' });
  }

  const result = await convertBuildToTrackedProducts(req.user.id, {
    name: name || 'Custom Rig',
    components,
  });

  res.json({
    success: true,
    message: `Added ${result.trackedCount} components to tracking group "${result.group.name}"`,
    group: result.group,
    trackedCount: result.trackedCount,
  });
}

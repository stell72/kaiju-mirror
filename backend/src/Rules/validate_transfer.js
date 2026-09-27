const { findRoute } = require('./adjacency');
const { wouldViolateRetention } = require('./retention');
const { canPerform } = require('./permission');

async function validateTransfer({ role, level, fromQuarterId, toQuarterId, currentQuantity, retentionMin, quantity }) {
  const route = await findRoute(fromQuarterId, toQuarterId);
  if (!route) {
    return { ok: false, status: 409, code: 'ADJACENCY_VIOLATION', message: 'No valid route between quarters.' };
  }

  const requiresTransit = route.path.length > 2 || route.routeType === 'MARITIME';
  const action = requiresTransit ? 'ORGANIZE_TRANSIT' : 'REQUEST_ADJACENT';

  if (!canPerform(role, action, level)) {
    return {
      ok: false,
      status: 403,
      code: 'PERMISSION_DENIED',
      message: requiresTransit
        ? 'This route requires transit or maritime approval — only LC (or CD at Level 5) may organize it.'
        : 'Role not permitted to request adjacent transfers at this level.',
    };
  }

  if (wouldViolateRetention(currentQuantity, retentionMin, quantity)) {
    return { ok: false, status: 409, code: 'RETENTION_VIOLATION', message: 'Transfer would breach retention minimum.' };
  }

  return { ok: true, needsApproval: requiresTransit, route };
}

module.exports = { validateTransfer };

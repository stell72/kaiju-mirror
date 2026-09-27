const { describe, it, expect, vi, beforeEach } = require('vitest');

vi.mock('./adjacency', () => ({
  findRoute: vi.fn(),
}));
vi.mock('./retention', () => ({
  wouldViolateRetention: vi.fn(),
}));
vi.mock('./permission', () => ({
  canPerform: vi.fn(),
}));

const { findRoute } = require('./adjacency');
const { wouldViolateRetention } = require('./retention');
const { canPerform } = require('./permission');
const { validateTransfer } = require('./validate_transfer');

const baseArgs = {
  role: 'QC',
  level: 3,
  fromQuarterId: 1,
  toQuarterId: 2,
  currentQuantity: 10,
  retentionMin: 3,
  quantity: 4,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateTransfer', () => {
  it('returns ADJACENCY_VIOLATION when no route exists between the quarters', async () => {
    findRoute.mockResolvedValue(null);

    const result = await validateTransfer(baseArgs);

    expect(result).toEqual({
      ok: false,
      status: 409,
      code: 'ADJACENCY_VIOLATION',
      message: 'No valid route between quarters.',
    });
    expect(canPerform).not.toHaveBeenCalled();
    expect(wouldViolateRetention).not.toHaveBeenCalled();
  });

  describe('direct (non-transit) routes', () => {
    beforeEach(() => {
      findRoute.mockResolvedValue({ path: [1, 2], routeType: 'DIRECT' });
    });

    it('checks REQUEST_ADJACENT permission (not ORGANIZE_TRANSIT) for a 2-hop DIRECT path', async () => {
      canPerform.mockReturnValue(true);
      wouldViolateRetention.mockReturnValue(false);

      await validateTransfer(baseArgs);

      expect(canPerform).toHaveBeenCalledWith('QC', 'REQUEST_ADJACENT', 3);
    });

    it('returns PERMISSION_DENIED with the adjacent-specific message when canPerform is false', async () => {
      canPerform.mockReturnValue(false);

      const result = await validateTransfer(baseArgs);

      expect(result).toEqual({
        ok: false,
        status: 403,
        code: 'PERMISSION_DENIED',
        message: 'Role not permitted to request adjacent transfers at this level.',
      });
      expect(wouldViolateRetention).not.toHaveBeenCalled();
    });

    it('returns RETENTION_VIOLATION when permission passes but retention would be breached', async () => {
      canPerform.mockReturnValue(true);
      wouldViolateRetention.mockReturnValue(true);

      const result = await validateTransfer(baseArgs);

      expect(wouldViolateRetention).toHaveBeenCalledWith(10, 3, 4);
      expect(result).toEqual({
        ok: false,
        status: 409,
        code: 'RETENTION_VIOLATION',
        message: 'Transfer would breach retention minimum.',
      });
    });

    it('returns ok:true with needsApproval:false and the resolved route on success', async () => {
      canPerform.mockReturnValue(true);
      wouldViolateRetention.mockReturnValue(false);

      const result = await validateTransfer(baseArgs);

      expect(result).toEqual({
        ok: true,
        needsApproval: false,
        route: { path: [1, 2], routeType: 'DIRECT' },
      });
    });
  });

  describe('multi-hop routes (path length > 2)', () => {
    beforeEach(() => {
      findRoute.mockResolvedValue({ path: [1, 3, 2], routeType: 'TRANSIT', transitQuarterId: 3 });
    });

    it('checks ORGANIZE_TRANSIT permission (not REQUEST_ADJACENT) when the path has an intermediate hop', async () => {
      canPerform.mockReturnValue(true);
      wouldViolateRetention.mockReturnValue(false);

      await validateTransfer(baseArgs);

      expect(canPerform).toHaveBeenCalledWith('QC', 'ORGANIZE_TRANSIT', 3);
    });

    it('returns PERMISSION_DENIED with the transit-specific message when canPerform is false', async () => {
      canPerform.mockReturnValue(false);

      const result = await validateTransfer(baseArgs);

      expect(result.code).toBe('PERMISSION_DENIED');
      expect(result.message).toMatch(/transit or maritime approval/i);
    });

    it('returns ok:true with needsApproval:true for a multi-hop route on success', async () => {
      canPerform.mockReturnValue(true);
      wouldViolateRetention.mockReturnValue(false);

      const result = await validateTransfer(baseArgs);

      expect(result.ok).toBe(true);
      expect(result.needsApproval).toBe(true);
    });
  });

  describe('MARITIME routes (2-hop path but sea crossing)', () => {
    beforeEach(() => {
      findRoute.mockResolvedValue({ path: [1, 2], routeType: 'MARITIME', deliveryMultiplier: 2 });
    });

    it('checks ORGANIZE_TRANSIT permission even though the path has only 2 entries', async () => {
      canPerform.mockReturnValue(true);
      wouldViolateRetention.mockReturnValue(false);

      await validateTransfer(baseArgs);

      expect(canPerform).toHaveBeenCalledWith('QC', 'ORGANIZE_TRANSIT', 3);
    });

    it('returns ok:true with needsApproval:true for a MARITIME route', async () => {
      canPerform.mockReturnValue(true);
      wouldViolateRetention.mockReturnValue(false);

      const result = await validateTransfer(baseArgs);

      expect(result.ok).toBe(true);
      expect(result.needsApproval).toBe(true);
      expect(result.route.routeType).toBe('MARITIME');
    });
  });

  it('passes the exact currentQuantity/retentionMin/quantity through to wouldViolateRetention', async () => {
    findRoute.mockResolvedValue({ path: [1, 2], routeType: 'DIRECT' });
    canPerform.mockReturnValue(true);
    wouldViolateRetention.mockReturnValue(false);

    await validateTransfer({ ...baseArgs, currentQuantity: 42, retentionMin: 7, quantity: 15 });

    expect(wouldViolateRetention).toHaveBeenCalledWith(42, 7, 15);
  });
});
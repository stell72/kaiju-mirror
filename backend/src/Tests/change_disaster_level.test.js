import { describe, it, expect, vi, beforeEach } from 'vitest';


vi.mock('../Config/prisma', () => ({
  default: {
    disasterLevelLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import prisma from '../Config/prisma';
import { getDisasterLevel, setDisasterLevel } from './disasterLevel';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getDisasterLevel', () => {
  it('returns the default level 1 when no log entries exist', async () => {
    prisma.disasterLevelLog.findFirst.mockResolvedValue(null);

    const result = await getDisasterLevel();

    expect(result).toEqual({ level: 1, changedAt: null, changedBy: null });
    expect(prisma.disasterLevelLog.findFirst).toHaveBeenCalledWith({
      orderBy: { changedAt: 'desc' },
      include: { changedBy: { select: { id: true, email: true, role: true } } },
    });
  });

  it('returns the most recent log entry when one exists', async () => {
    const changedAt = new Date('2026-01-01T00:00:00Z');
    const changedBy = { id: 1, email: 'cd@tokyork.gov', role: 'CD' };
    prisma.disasterLevelLog.findFirst.mockResolvedValue({
      level: 3,
      changedAt,
      changedBy,
    });

    const result = await getDisasterLevel();

    expect(result).toEqual({ level: 3, changedAt, changedBy });
  });
});

describe('setDisasterLevel', () => {
  it('rejects a caller whose role is not CD', async () => {
    const result = await setDisasterLevel(3, 1, 'QC', 'trying to escalate');

    expect(result).toEqual({
      ok: false,
      status: 403,
      code: 'PERMISSION_DENIED',
      message: 'Only the City Director can change level.',
    });
    expect(prisma.disasterLevelLog.create).not.toHaveBeenCalled();
  });

  it.each([
    [0, 'below range'],
    [6, 'above range'],
    [2.5, 'non-integer'],
    [NaN, 'not a number'],
  ])('rejects an invalid level %s (%s)', async (badLevel) => {
    const result = await setDisasterLevel(badLevel, 1, 'CD', 'reason');

    expect(result).toEqual({
      ok: false,
      status: 400,
      code: 'INVALID_INPUT',
      message: 'Level must be an integer 1-5.',
    });
    expect(prisma.disasterLevelLog.create).not.toHaveBeenCalled();
  });

  it('creates a new log entry and returns it when input is valid', async () => {
    const changedAt = new Date('2026-02-01T12:00:00Z');
    prisma.disasterLevelLog.create.mockResolvedValue({
      level: 4,
      changedAt,
    });

    const result = await setDisasterLevel(4, 7, 'CD', 'Kaiju sighted near Echo');

    expect(prisma.disasterLevelLog.create).toHaveBeenCalledWith({
      data: { level: 4, changedByUserId: 7, reason: 'Kaiju sighted near Echo' },
    });
    expect(result).toEqual({ ok: true, level: 4, changedAt });
  });

  it.each([1, 2, 3, 4, 5])('accepts every valid boundary level %i', async (level) => {
    prisma.disasterLevelLog.create.mockResolvedValue({ level, changedAt: new Date() });

    const result = await setDisasterLevel(level, 1, 'CD', 'boundary check');

    expect(result.ok).toBe(true);
    expect(result.level).toBe(level);
  });
});
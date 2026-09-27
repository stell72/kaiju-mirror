import { expect, describe, it } from 'vitest'
import { canPerform } from '../Rules/permission.js'


  describe('VIEW_RESOURCES — "all" rule', () => {
    it('returns true for any role at any level', () => {
      expect(canPerform('QC', 'VIEW_RESOURCES', 1)).toBe(true);
      expect(canPerform('LC', 'VIEW_RESOURCES', 3)).toBe(true);
      expect(canPerform('CD', 'VIEW_RESOURCES', 5)).toBe(true);
      expect(canPerform('RANDOM_ROLE', 'VIEW_RESOURCES', 2)).toBe(true);
    });
  });

  describe('RESERVE_OWN_QUARTER — array rule per level', () => {
    it('returns null-level false at level 1', () => {
      expect(canPerform('QC', 'RESERVE_OWN_QUARTER', 1)).toBe(false);
    });

    it('returns true only for QC at levels 2-5', () => {
      expect(canPerform('QC', 'RESERVE_OWN_QUARTER', 2)).toBe(true);
      expect(canPerform('QC', 'RESERVE_OWN_QUARTER', 5)).toBe(true);
    });

    it('returns false for non-QC roles at levels 2-5', () => {
      expect(canPerform('LC', 'RESERVE_OWN_QUARTER', 2)).toBe(false);
      expect(canPerform('CD', 'RESERVE_OWN_QUARTER', 4)).toBe(false);
    });
  });

  describe('REQUEST_ADJACENT — mixed null/array/all across levels', () => {
    it('is false at levels 1-2 (null)', () => {
      expect(canPerform('QC', 'REQUEST_ADJACENT', 1)).toBe(false);
      expect(canPerform('CD', 'REQUEST_ADJACENT', 2)).toBe(false);
    });

    it('allows only QC at level 3', () => {
      expect(canPerform('QC', 'REQUEST_ADJACENT', 3)).toBe(true);
      expect(canPerform('LC', 'REQUEST_ADJACENT', 3)).toBe(false);
    });

    it('allows QC and LC at level 4', () => {
      expect(canPerform('QC', 'REQUEST_ADJACENT', 4)).toBe(true);
      expect(canPerform('LC', 'REQUEST_ADJACENT', 4)).toBe(true);
      expect(canPerform('CD', 'REQUEST_ADJACENT', 4)).toBe(false);
    });

    it('allows everyone at level 5 ("all")', () => {
      expect(canPerform('QC', 'REQUEST_ADJACENT', 5)).toBe(true);
      expect(canPerform('CD', 'REQUEST_ADJACENT', 5)).toBe(true);
      expect(canPerform('ANY_ROLE', 'REQUEST_ADJACENT', 5)).toBe(true);
    });
  });

  describe('ORGANIZE_TRANSIT', () => {
    it('is false at levels 1-3', () => {
      expect(canPerform('CD', 'ORGANIZE_TRANSIT', 1)).toBe(false);
      expect(canPerform('CD', 'ORGANIZE_TRANSIT', 3)).toBe(false);
    });

    it('allows only LC at level 4', () => {
      expect(canPerform('LC', 'ORGANIZE_TRANSIT', 4)).toBe(true);
      expect(canPerform('CD', 'ORGANIZE_TRANSIT', 4)).toBe(false);
    });

    it('allows LC and CD at level 5', () => {
      expect(canPerform('LC', 'ORGANIZE_TRANSIT', 5)).toBe(true);
      expect(canPerform('CD', 'ORGANIZE_TRANSIT', 5)).toBe(true);
      expect(canPerform('QC', 'ORGANIZE_TRANSIT', 5)).toBe(false);
    });
  });

  describe('REQUISITION', () => {
    it('is false at levels 1-3', () => {
      expect(canPerform('CD', 'REQUISITION', 3)).toBe(false);
    });

    it('allows only CD at levels 4-5', () => {
      expect(canPerform('CD', 'REQUISITION', 4)).toBe(true);
      expect(canPerform('CD', 'REQUISITION', 5)).toBe(true);
      expect(canPerform('LC', 'REQUISITION', 4)).toBe(false);
    });
  });

  describe('LOWER_RETENTION', () => {
    it('is false at all levels except 5', () => {
      expect(canPerform('CD', 'LOWER_RETENTION', 1)).toBe(false);
      expect(canPerform('CD', 'LOWER_RETENTION', 4)).toBe(false);
    });

    it('allows only CD at level 5', () => {
      expect(canPerform('CD', 'LOWER_RETENTION', 5)).toBe(true);
      expect(canPerform('LC', 'LOWER_RETENTION', 5)).toBe(false);
    });
  });

  describe('unknown/invalid input', () => {
    it('returns false for an unknown action', () => {
      expect(canPerform('CD', 'DESTROY_STATION', 5)).toBe(false);
    });

    it('returns false for a level that does not exist in the map', () => {
        expect(canPerform('CD', 'VIEW_RESOURCES', 99)).toBe(false);
    });

    it('returns false for undefined role/action/level', () => {
      expect(canPerform(undefined, 'VIEW_RESOURCES', 1)).toBe(true);
      expect(canPerform('CD', undefined, 1)).toBe(false);
      expect(canPerform('CD', 'REQUISITION', undefined)).toBe(false);
    });
});
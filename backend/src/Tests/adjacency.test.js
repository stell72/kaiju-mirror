import { expect, describe, it } from 'vitest'
import { isDirectlyAdjacent, findTransitPath } from '../Rules/adjacency.js'

describe('isDirectlyAdjacent', () => {
  it('returns true for direct neighbors', () => {
    expect(isDirectlyAdjacent('A', 'E')).toBe(true);
    expect(isDirectlyAdjacent('A', 'W')).toBe(true);
    expect(isDirectlyAdjacent('A', 'X')).toBe(true);
  });

  it('returns true regardless of which side has the entry (if symmetric)', () => {
    expect(isDirectlyAdjacent('E', 'A')).toBe(true);
    expect(isDirectlyAdjacent('X', 'A')).toBe(true);
  });

  it('returns false for non-adjacent nodes', () => {
    expect(isDirectlyAdjacent('A', 'Z')).toBe(false);
    expect(isDirectlyAdjacent('A', 'SEA')).toBe(false);
    expect(isDirectlyAdjacent('E', 'W')).toBe(false);
  });

  it('returns false when the key does not exist in ADJACENCY', () => {
    expect(isDirectlyAdjacent('FOO', 'A')).toBe(false);
    expect(isDirectlyAdjacent('BAR', 'BAZ')).toBe(false);
  });

  it('returns false when comparing a node to itself (unless self-listed)', () => {
    expect(isDirectlyAdjacent('A', 'A')).toBe(false);
  });

  it('handles undefined/null gracefully', () => {
    expect(isDirectlyAdjacent(undefined, 'A')).toBe(false);
    expect(isDirectlyAdjacent('A', undefined)).toBe(false);
  });
});


describe('findTransitPath', () => {
  describe('direct adjacency', () => {
    it('returns [a, b] when directly adjacent', () => {
      expect(findTransitPath('A', 'E')).toEqual(['A', 'E']);
      expect(findTransitPath('A', 'W')).toEqual(['A', 'W']);
      expect(findTransitPath('A', 'X')).toEqual(['A', 'X']);
      expect(findTransitPath('W', 'Z')).toEqual(['W', 'Z']);
      expect(findTransitPath('X', 'SEA')).toEqual(['X', 'SEA']);
    });
  });

  describe('transit through X', () => {
    it('returns [a, X, b] when not directly adjacent but both connect via X', () => {
      expect(findTransitPath('E', 'W')).toEqual(['E', 'X', 'W']);
      expect(findTransitPath('E', 'Z')).toEqual(['E', 'X', 'Z']);
      expect(findTransitPath('A', 'Z')).toEqual(['A', 'X', 'Z']);
      expect(findTransitPath('A', 'SEA')).toEqual(['A', 'X', 'SEA']);
      expect(findTransitPath('W', 'SEA')).toEqual(['W', 'X', 'SEA']);
    });

    it('checks the reverse direction too', () => {
      expect(findTransitPath('W', 'E')).toEqual(['W', 'X', 'E']);
      expect(findTransitPath('Z', 'A')).toEqual(['Z', 'X', 'A']);
    });
  });

  describe('no path found', () => {
    it('returns null when neither direct nor X-transit works', () => {
      expect(findTransitPath('SEA', 'FOO')).toBeNull();
      expect(findTransitPath('FOO', 'BAR')).toBeNull();
    });

    it('returns null when one side is X itself and not directly adjacent (edge case)', () => {
      expect(findTransitPath('X', 'FOO')).toBeNull();
      expect(findTransitPath('FOO', 'X')).toBeNull();
    });
  });

  describe('edge cases worth flagging', () => {
    it('same-node input can produce a self-transit path (documents current behavior)', () => {
      expect(findTransitPath('A', 'A')).toEqual(['A', 'X', 'A']);
    });

    it('SEA-SEA has no self-adjacency and no transit (SEA has no outgoing entry)', () => {
      expect(findTransitPath('SEA', 'SEA')).toBeNull();
    });
  });
});



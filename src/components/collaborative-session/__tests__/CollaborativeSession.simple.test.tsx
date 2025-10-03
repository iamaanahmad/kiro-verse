import React from 'react';
import { describe, it, expect } from 'vitest';
import { CollaborativeSession } from '../CollaborativeSession';

describe('CollaborativeSession Simple Import Test', () => {
  it('should import CollaborativeSession component without errors', () => {
    expect(CollaborativeSession).toBeDefined();
    expect(typeof CollaborativeSession).toBe('function');
  });
});
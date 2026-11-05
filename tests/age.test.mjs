import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateAge } from '../src/utils/age.ts';

test('antes de octubre aún no cumple el año', () => {
  assert.equal(calculateAge(new Date(2026, 8, 30)), 23);
});

test('desde octubre ya cumplió el año', () => {
  assert.equal(calculateAge(new Date(2026, 9, 1)), 24);
});

test('cuenta correctamente a inicios de año', () => {
  assert.equal(calculateAge(new Date(2026, 0, 1)), 23);
});

test('en octubre de 2025 tiene 23', () => {
  assert.equal(calculateAge(new Date(2025, 9, 15)), 23);
});

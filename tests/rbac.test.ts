import { describe, it, expect } from 'vitest';
import { hasRolePermission } from '@/lib/rbac';

describe('Role-Based Access Control (RBAC) Matrix', () => {
  it('grants SUPER_ADMIN unrestricted access across all resources and actions', () => {
    expect(hasRolePermission(['SUPER_ADMIN'], 'settings', 'update')).toBe(true);
    expect(hasRolePermission(['SUPER_ADMIN'], 'users', 'manage_roles')).toBe(true);
    expect(hasRolePermission(['SUPER_ADMIN'], 'gate', 'redeem')).toBe(true);
    expect(hasRolePermission(['SUPER_ADMIN'], 'reports', 'export')).toBe(true);
  });

  it('restricts GATE_STAFF to turnstile gate operations only', () => {
    // Permitted:
    expect(hasRolePermission(['GATE_STAFF'], 'gate', 'read')).toBe(true);
    expect(hasRolePermission(['GATE_STAFF'], 'gate', 'redeem')).toBe(true);

    // Strictly Denied:
    expect(hasRolePermission(['GATE_STAFF'], 'settings', 'update')).toBe(false);
    expect(hasRolePermission(['GATE_STAFF'], 'articles', 'publish')).toBe(false);
    expect(hasRolePermission(['GATE_STAFF'], 'users', 'create')).toBe(false);
    expect(hasRolePermission(['GATE_STAFF'], 'payments', 'reconcile')).toBe(false);
  });

  it('restricts MEDIA_MANAGER to editorial content and announcements', () => {
    expect(hasRolePermission(['MEDIA_MANAGER'], 'articles', 'publish')).toBe(true);
    expect(hasRolePermission(['MEDIA_MANAGER'], 'notifications', 'create')).toBe(true);
    expect(hasRolePermission(['MEDIA_MANAGER'], 'gate', 'redeem')).toBe(false);
    expect(hasRolePermission(['MEDIA_MANAGER'], 'settings', 'update')).toBe(false);
  });

  it('restricts MATCHDAY_EDITOR to live match centre and results', () => {
    expect(hasRolePermission(['MATCHDAY_EDITOR'], 'match_centre', 'update')).toBe(true);
    expect(hasRolePermission(['MATCHDAY_EDITOR'], 'results', 'update')).toBe(true);
    expect(hasRolePermission(['MATCHDAY_EDITOR'], 'settings', 'update')).toBe(false);
  });

  it('combines permissions when a user possesses multiple staff roles', () => {
    // Gate Staff + Matchday Editor
    const multiRoles = ['GATE_STAFF', 'MATCHDAY_EDITOR'];
    expect(hasRolePermission(multiRoles, 'gate', 'redeem')).toBe(true);
    expect(hasRolePermission(multiRoles, 'match_centre', 'update')).toBe(true);
    expect(hasRolePermission(multiRoles, 'settings', 'update')).toBe(false);
  });

  it('strictly rejects SUPPORTER or empty roles from admin actions', () => {
    expect(hasRolePermission(['SUPPORTER'], 'overview', 'read')).toBe(false);
    expect(hasRolePermission(['SUPPORTER'], 'tickets', 'create')).toBe(false);
    expect(hasRolePermission([], 'overview', 'read')).toBe(false);
  });
});

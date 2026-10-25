export type StaffRoleSlug =
  | 'SUPER_ADMIN'
  | 'CLUB_EXECUTIVE'
  | 'MEDIA_MANAGER'
  | 'MATCHDAY_EDITOR'
  | 'TICKETING_MANAGER'
  | 'GATE_STAFF'
  | 'STORE_MANAGER'
  | 'MEMBERSHIP_MANAGER'
  | 'SPONSOR_MANAGER'
  | 'FINANCE_OFFICER';

export type ResourceKey =
  | 'overview'
  | 'articles'
  | 'fixtures'
  | 'match_centre'
  | 'results'
  | 'table'
  | 'squad'
  | 'tickets'
  | 'gate'
  | 'payments'
  | 'merchandise'
  | 'memberships'
  | 'loyalty'
  | 'sponsors'
  | 'donations'
  | 'notifications'
  | 'reports'
  | 'pages'
  | 'languages'
  | 'users'
  | 'audit_logs'
  | 'settings';

export type ActionKey =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'redeem'
  | 'reconcile'
  | 'export'
  | 'manage_roles';

export interface RoleDefinition {
  slug: StaffRoleSlug | 'SUPPORTER';
  name: string;
  description: string;
  permissions: Array<{ resource: ResourceKey; actions: ActionKey[] }>;
}

const ALL_ACTIONS: ActionKey[] = [
  'read',
  'create',
  'update',
  'delete',
  'publish',
  'redeem',
  'reconcile',
  'export',
  'manage_roles',
];

const ALL_RESOURCES: ResourceKey[] = [
  'overview',
  'articles',
  'fixtures',
  'match_centre',
  'results',
  'table',
  'squad',
  'tickets',
  'gate',
  'payments',
  'merchandise',
  'memberships',
  'loyalty',
  'sponsors',
  'donations',
  'notifications',
  'reports',
  'pages',
  'languages',
  'users',
  'audit_logs',
  'settings',
];

export const ROLE_DEFINITIONS: Record<StaffRoleSlug | 'SUPPORTER', RoleDefinition> = {
  SUPER_ADMIN: {
    slug: 'SUPER_ADMIN',
    name: 'Super Administrator',
    description: 'Full platform configuration, access management, and audit review.',
    permissions: ALL_RESOURCES.map((resource) => ({ resource, actions: ALL_ACTIONS })),
  },
  CLUB_EXECUTIVE: {
    slug: 'CLUB_EXECUTIVE',
    name: 'Club Executive',
    description: 'Access to approved commercial, membership, reporting and club-management functions.',
    permissions: [
      { resource: 'overview', actions: ['read'] },
      { resource: 'fixtures', actions: ['read', 'create', 'update'] },
      { resource: 'results', actions: ['read'] },
      { resource: 'table', actions: ['read'] },
      { resource: 'squad', actions: ['read', 'create', 'update'] },
      { resource: 'tickets', actions: ['read', 'export'] },
      { resource: 'merchandise', actions: ['read'] },
      { resource: 'memberships', actions: ['read', 'create', 'update'] },
      { resource: 'sponsors', actions: ['read', 'create', 'update', 'export'] },
      { resource: 'donations', actions: ['read', 'create', 'update', 'export'] },
      { resource: 'reports', actions: ['read', 'export'] },
      { resource: 'pages', actions: ['read', 'update', 'publish'] },
      { resource: 'audit_logs', actions: ['read'] },
    ],
  },
  MEDIA_MANAGER: {
    slug: 'MEDIA_MANAGER',
    name: 'Media Manager',
    description: 'Manage articles, images, videos, player features and public announcements.',
    permissions: [
      { resource: 'overview', actions: ['read'] },
      { resource: 'articles', actions: ['read', 'create', 'update', 'delete', 'publish'] },
      { resource: 'squad', actions: ['read', 'create', 'update'] },
      { resource: 'pages', actions: ['read', 'create', 'update', 'publish'] },
      { resource: 'languages', actions: ['read', 'create', 'update'] },
      { resource: 'notifications', actions: ['read', 'create'] },
    ],
  },
  MATCHDAY_EDITOR: {
    slug: 'MATCHDAY_EDITOR',
    name: 'Matchday Editor',
    description: 'Manage assigned match updates, events, lineups, live blog, polls and match reports.',
    permissions: [
      { resource: 'overview', actions: ['read'] },
      { resource: 'fixtures', actions: ['read', 'update'] },
      { resource: 'match_centre', actions: ['read', 'create', 'update', 'publish'] },
      { resource: 'results', actions: ['read', 'create', 'update'] },
      { resource: 'table', actions: ['read', 'update'] },
      { resource: 'articles', actions: ['read', 'create', 'update', 'publish'] },
    ],
  },
  TICKETING_MANAGER: {
    slug: 'TICKETING_MANAGER',
    name: 'Ticketing Manager',
    description: 'Manage ticket categories, capacity, orders, transfers, refunds and ticketing reports.',
    permissions: [
      { resource: 'overview', actions: ['read'] },
      { resource: 'fixtures', actions: ['read'] },
      { resource: 'tickets', actions: ['read', 'create', 'update', 'export'] },
      { resource: 'gate', actions: ['read', 'redeem'] },
      { resource: 'payments', actions: ['read'] },
      { resource: 'reports', actions: ['read', 'export'] },
    ],
  },
  GATE_STAFF: {
    slug: 'GATE_STAFF',
    name: 'Gate Staff',
    description: 'Access only assigned match scanning and approved ticket lookup functions.',
    permissions: [
      { resource: 'gate', actions: ['read', 'redeem'] },
    ],
  },
  STORE_MANAGER: {
    slug: 'STORE_MANAGER',
    name: 'Store Manager',
    description: 'Manage merchandise, inventory, variants, shop orders and fulfilment.',
    permissions: [
      { resource: 'overview', actions: ['read'] },
      { resource: 'merchandise', actions: ['read', 'create', 'update', 'export'] },
      { resource: 'payments', actions: ['read'] },
      { resource: 'reports', actions: ['read', 'export'] },
    ],
  },
  MEMBERSHIP_MANAGER: {
    slug: 'MEMBERSHIP_MANAGER',
    name: 'Membership Manager',
    description: 'Manage memberships, renewals and authorised loyalty programme operations.',
    permissions: [
      { resource: 'overview', actions: ['read'] },
      { resource: 'memberships', actions: ['read', 'create', 'update', 'export'] },
      { resource: 'loyalty', actions: ['read', 'create', 'update'] },
      { resource: 'notifications', actions: ['read', 'create'] },
      { resource: 'reports', actions: ['read', 'export'] },
    ],
  },
  SPONSOR_MANAGER: {
    slug: 'SPONSOR_MANAGER',
    name: 'Sponsor Manager',
    description: 'Manage sponsor listings, placements, enquiries and campaign reports.',
    permissions: [
      { resource: 'overview', actions: ['read'] },
      { resource: 'sponsors', actions: ['read', 'create', 'update', 'export'] },
      { resource: 'reports', actions: ['read', 'export'] },
    ],
  },
  FINANCE_OFFICER: {
    slug: 'FINANCE_OFFICER',
    name: 'Finance Officer',
    description: 'Review authorised financial transactions, reconciliation, donations and exports without user-management access.',
    permissions: [
      { resource: 'overview', actions: ['read'] },
      { resource: 'payments', actions: ['read', 'reconcile', 'export'] },
      { resource: 'tickets', actions: ['read', 'export'] },
      { resource: 'merchandise', actions: ['read', 'export'] },
      { resource: 'memberships', actions: ['read', 'export'] },
      { resource: 'donations', actions: ['read', 'export'] },
      { resource: 'reports', actions: ['read', 'export'] },
      { resource: 'audit_logs', actions: ['read'] },
    ],
  },
  SUPPORTER: {
    slug: 'SUPPORTER',
    name: 'Supporter',
    description: 'Public fan account with zero administrative privileges.',
    permissions: [],
  },
};

export function hasRolePermission(
  userRoleSlugs: string[],
  resource: ResourceKey,
  action: ActionKey
): boolean {
  if (!userRoleSlugs || userRoleSlugs.length === 0) {
    return false;
  }
  for (const slug of userRoleSlugs) {
    const def = ROLE_DEFINITIONS[slug as StaffRoleSlug | 'SUPPORTER'];
    if (!def) continue;
    const resourceGrant = def.permissions.find((p) => p.resource === resource);
    if (resourceGrant && resourceGrant.actions.includes(action)) {
      return true;
    }
  }
  return false;
}

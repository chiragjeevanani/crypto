/**
 * Maps backend role to a display label for the UI.
 * Keeps User vs Admin roles clearly differentiated.
 */
const ROLE_LABELS = {
  User: 'User',
  SuperNode: 'Supernode',
  Admin: 'Admin',
  super_admin: 'Super Admin',
  Developer: 'Developer',
};

export function getRoleLabel(role) {
  if (!role) return 'Admin';
  return ROLE_LABELS[role] || role;
}

/**
 * Returns the handle to show (e.g. @developer, @superadmin).
 * Uses profile.handle or user.handle from DB, else derives from role/name.
 */
export function getRoleHandle(user, profile) {
  const handle = profile?.handle || user?.handle;
  if (handle) return handle.startsWith('@') ? handle : `@${handle}`;
  const role = user?.role || '';
  if (role === 'super_admin') return '@superadmin';
  if (role === 'Developer') return '@developer';
  if (role === 'Admin') return '@admin';
  if (role === 'SuperNode') return '@supernode';
  if (user?.name) return `@${user.name.replace(/\s+/g, '').toLowerCase().slice(0, 12)}`;
  return '@admin';
}

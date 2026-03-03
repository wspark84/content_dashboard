/**
 * 팀 권한 관리 — 역할 기반 접근 제어 (RBAC)
 */

const ROLES = {
  ceo: { label: 'CEO', permissions: ['*'] },
  content_manager: { label: '콘텐츠 매니저', permissions: ['approve', 'reject', 'edit', 'view'] },
  marketer: { label: '마케터', permissions: ['view', 'ab_test', 'report'] },
  designer: { label: '디자이너', permissions: ['view', 'edit_image'] },
};

/**
 * 역할이 특정 액션 권한을 갖는지 확인
 */
export function hasPermission(role, action) {
  const r = ROLES[role];
  if (!r) return false;
  if (r.permissions.includes('*')) return true;
  return r.permissions.includes(action);
}

/**
 * 역할의 권한 목록 반환
 */
export function getRolePermissions(role) {
  const r = ROLES[role];
  return r ? [...r.permissions] : [];
}

/**
 * 전체 역할 목록 반환
 */
export function getAllRoles() {
  return Object.entries(ROLES).map(([key, val]) => ({
    role: key,
    label: val.label,
    permissions: val.permissions,
  }));
}

export { ROLES };

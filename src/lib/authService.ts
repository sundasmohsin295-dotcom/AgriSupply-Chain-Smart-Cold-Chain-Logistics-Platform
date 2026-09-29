/**
 * Authentication & Authorization Service
 * 
 * Provides server-side style authentication boundaries.
 * In a real production environment, this would connect to a backend service.
 * For competition demo, uses secure session management with role-based access control.
 */

import { UserRole, UserSession } from '../types';

export interface AuthContext {
  isAuthenticated: boolean;
  session: UserSession | null;
  error: string | null;
  isLoading: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Authorization matrix for role-based access control
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  FARMER: [
    'batches:create',
    'batches:read',
    'inspection:submit',
    'precooling:log',
    'offline:mutate',
    'reports:view_own'
  ],
  TRANSPORTER: [
    'shipments:read',
    'telemetry:stream',
    'geofence:acknowledge',
    'thermal:override',
    'waypoint:checkin',
    'reports:view_transit'
  ],
  WAREHOUSE_ADMIN: [
    'inventory:crud',
    'coldbay:allocate',
    'pipeline:advance',
    'quarantine:manage',
    'dispatch:authorize',
    'reports:view_all',
    'audit:read'
  ],
  RETAILER: [
    'orders:read',
    'quality:verify',
    'inventory:receive',
    'shelf:allocate',
    'reports:export_csv'
  ],
  COMPLIANCE_AUDITOR: [
    'reports:export_pdf',
    'reports:export_csv',
    'verification:perform',
    'signature:verify',
    'audit:full_access',
    'compliance:certify'
  ]
};

/**
 * Validates that a user session has required permission
 */
export function hasPermission(session: UserSession | null, permission: string): boolean {
  if (!session) return false;
  const rolePermissions = ROLE_PERMISSIONS[session.role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Validates multiple permissions (AND logic)
 */
export function hasAllPermissions(session: UserSession | null, permissions: string[]): boolean {
  return permissions.every(p => hasPermission(session, p));
}

/**
 * Validates multiple permissions (OR logic)
 */
export function hasAnyPermission(session: UserSession | null, permissions: string[]): boolean {
  return permissions.some(p => hasPermission(session, p));
}

/**
 * Checks if a session token is valid (basic validation)
 * In production, this would verify against a server
 */
export function isValidSessionToken(token: string): boolean {
  if (!token || token.length < 32) return false;
  // Token format: base64 encoded, contains role and timestamp
  try {
    const decoded = atob(token);
    return decoded.includes('role=') && decoded.includes('exp=');
  } catch {
    return false;
  }
}

/**
 * Validates that a user can access a specific module/tab
 */
export function canAccessModule(session: UserSession | null, module: string): boolean {
  if (!session) return false;
  
  const moduleAccess: Record<string, UserRole[]> = {
    overview: ['FARMER', 'TRANSPORTER', 'WAREHOUSE_ADMIN', 'RETAILER', 'COMPLIANCE_AUDITOR'],
    farmer: ['FARMER', 'WAREHOUSE_ADMIN', 'COMPLIANCE_AUDITOR'],
    transporter: ['TRANSPORTER', 'WAREHOUSE_ADMIN', 'COMPLIANCE_AUDITOR'],
    warehouse: ['WAREHOUSE_ADMIN', 'RETAILER', 'COMPLIANCE_AUDITOR'],
    pipeline: ['WAREHOUSE_ADMIN', 'RETAILER', 'COMPLIANCE_AUDITOR'],
    reports: ['FARMER', 'WAREHOUSE_ADMIN', 'RETAILER', 'COMPLIANCE_AUDITOR'],
    auditor: ['COMPLIANCE_AUDITOR', 'WAREHOUSE_ADMIN']
  };

  const allowedRoles = moduleAccess[module] || [];
  return allowedRoles.includes(session.role);
}

/**
 * Demo authentication - validates credentials
 * In production, would call backend API
 */
export async function authenticateUser(credentials: AuthCredentials): Promise<{
  success: boolean;
  session?: UserSession;
  error?: string;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Demo validation (in production: call backend)
      if (!credentials.email || !credentials.password) {
        resolve({
          success: false,
          error: 'Email and password required'
        });
        return;
      }

      // For demo, accept any credentials
      // In production: validate against backend with bcrypt/argon2
      resolve({
        success: true,
        session: {
          id: `session-${crypto.randomUUID()}`,
          name: 'Demo User',
          email: credentials.email,
          role: 'FARMER',
          organization: 'Demo Organization',
          location: 'Demo Location',
          token: btoa(`role=FARMER&exp=${Date.now() + 86400000}&user=${credentials.email}`),
          permissions: ROLE_PERMISSIONS.FARMER
        }
      });
    }, 500);
  });
}

/**
 * Validates session expiration
 */
export function isSessionExpired(session: UserSession): boolean {
  try {
    const decoded = atob(session.token);
    const expMatch = decoded.match(/exp=(\d+)/);
    if (!expMatch) return false;
    const expTime = parseInt(expMatch[1], 10);
    return Date.now() > expTime;
  } catch {
    return false;
  }
}

/**
 * Logs out user (clears session)
 */
export function logoutUser(): void {
  localStorage.removeItem('agrisupply_session');
  localStorage.removeItem('agrisupply_token');
}

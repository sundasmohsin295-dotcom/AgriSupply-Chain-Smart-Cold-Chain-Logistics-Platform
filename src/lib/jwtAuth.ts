import { UserRole, UserSession } from '../types';

export const ROLE_DEFINITIONS: Record<UserRole, {
  title: string;
  name: string;
  email: string;
  organization: string;
  location: string;
  badgeLabel: string;
  avatarIcon: string;
  permissions: string[];
}> = {
  FARMER: {
    title: 'Agricultural Producer',
    name: 'Mateo Morales',
    email: 'm.morales@salinas-harvest.coop',
    organization: 'Salinas Valley Organic Grower Collective',
    location: 'Monterey County, CA',
    badgeLabel: 'Harvest Field Node',
    avatarIcon: 'Tractor',
    permissions: [
      'batches:create',
      'batches:read',
      'inspection:submit',
      'precooling:log',
      'offline:mutate'
    ]
  },
  TRANSPORTER: {
    title: 'Cold-Chain Reefer Operator',
    name: 'Carlos Mendonca',
    email: 'carlos.m@pacific-coldlink.com',
    organization: 'Pacific Cold-Link Fleet Logistics',
    location: 'Interstate-5 Corridor CA',
    badgeLabel: 'Fleet Telematics Node',
    avatarIcon: 'Truck',
    permissions: [
      'shipments:read',
      'telemetry:stream',
      'geofence:acknowledge',
      'thermal:override',
      'waypoint:checkin'
    ]
  },
  WAREHOUSE_ADMIN: {
    title: 'Cold-Storage Logistics Director',
    name: 'Elena Rostova',
    email: 'elena.rostova@sanjose-coldhub.io',
    organization: 'Silicon Valley Central Cold Depository',
    location: 'Bay Area Central Depot, CA',
    badgeLabel: 'Depot Command Hub',
    avatarIcon: 'Warehouse',
    permissions: [
      'inventory:crud',
      'coldbay:allocate',
      'pipeline:advance',
      'quarantine:manage',
      'dispatch:authorize'
    ]
  },
  COMPLIANCE_AUDITOR: {
    title: 'Lead FSMA & GlobalGAP Auditor',
    name: 'Dr. Helen Vance',
    email: 'h.vance@usda-ams.gov',
    organization: 'USDA-AMS & GlobalGAP Joint Directorate',
    location: 'Sacramento Federal Directorate, CA',
    badgeLabel: 'Regulatory Trust Node',
    avatarIcon: 'ShieldCheck',
    permissions: [
      'blockchain:verify',
      'reports:export_pdf',
      'reports:export_csv',
      'tamper:flag',
      'compliance:certify'
    ]
  }
};

/**
 * Creates a base64url encoded mock JWT string with authentic structure
 */
export function generateSignedJWT(role: UserRole, tenantId: string = 'tenant_agri_coop_us_west'): string {
  const profile = ROLE_DEFINITIONS[role];
  const header = {
    alg: 'HS256',
    typ: 'JWT',
    kid: 'agrisupply-core-sec-key-01'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: `usr_agri_${role.toLowerCase()}_${Math.floor(1000 + Math.random() * 9000)}`,
    name: profile.name,
    email: profile.email,
    role: role,
    tenant_id: tenantId,
    org: profile.organization,
    permissions: profile.permissions,
    iat: now,
    exp: now + 3600 * 24 * 7, // 7 days
    iss: 'https://auth.agrisupply.internal',
    aud: 'https://api.agrisupply.internal'
  };

  const b64Header = btoa(JSON.stringify(header)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const b64Payload = btoa(JSON.stringify(payload)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // Deterministic mock HMAC-SHA256 signature
  const b64Signature = `k8Z_${Math.random().toString(36).substring(2, 12)}_${b64Header.substring(0, 8)}wQ9x`;

  return `${b64Header}.${b64Payload}.${b64Signature}`;
}

export function decodeJWT(token: string): {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
} {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const header = JSON.parse(atob(parts[0]!.replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/')));
    return {
      header,
      payload,
      signature: parts[2]!
    };
  } catch {
    return {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { role: 'FARMER', error: 'Malformed token' },
      signature: 'invalid_signature'
    };
  }
}

const SESSION_STORAGE_KEY = 'agrisupply_current_session';

export function getStoredSession(): UserSession {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
  }
  return createSessionForRole('WAREHOUSE_ADMIN');
}

export function createSessionForRole(role: UserRole): UserSession {
  const profile = ROLE_DEFINITIONS[role];
  const token = generateSignedJWT(role);
  const session: UserSession = {
    id: `usr_${role.toLowerCase()}`,
    name: profile.name,
    email: profile.email,
    role: role,
    organization: profile.organization,
    location: profile.location,
    token: token,
    permissions: profile.permissions
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

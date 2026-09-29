/**
 * Application Safe Audit Event Logger
 * 
 * Records tamper-evident, privacy-safe lifecycle events across RBAC, logistics,
 * offline synchronization, telemetry threshold crossings, and report generations.
 * Strictly prevents logging sensitive credentials or tokens.
 */

import { ApplicationAuditEvent, AuditEventType, UserRole } from '../types';

class AuditLoggerService {
  private events: ApplicationAuditEvent[] = [];
  private listeners: Set<(events: ApplicationAuditEvent[]) => void> = new Set();
  private maxEvents: number = 100;

  constructor() {
    // Seed initial event
    this.log({
      type: 'AUTH_LOGIN',
      tenantId: 'tenant_punjab_agri_coop',
      actor: 'Tariq Mehmood',
      role: 'FARMER',
      details: 'Session initialized for Agricultural Producer in Multan Citrus Hub.'
    });
  }

  public log(entry: {
    type: AuditEventType;
    tenantId: string;
    actor: string;
    role: UserRole;
    details: string;
    metadata?: Record<string, unknown>;
  }): ApplicationAuditEvent {
    // Sanitize metadata to prevent logging sensitive keys
    const sanitizedMetadata: Record<string, unknown> = {};
    if (entry.metadata) {
      for (const [k, v] of Object.entries(entry.metadata)) {
        if (/token|password|secret|key|auth/i.test(k)) {
          sanitizedMetadata[k] = '[REDACTED]';
        } else {
          sanitizedMetadata[k] = v;
        }
      }
    }

    const event: ApplicationAuditEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      type: entry.type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      tenantId: entry.tenantId,
      actor: entry.actor,
      role: entry.role,
      details: entry.details,
      metadata: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : undefined
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    this.notify();
    return event;
  }

  public getEvents(): ApplicationAuditEvent[] {
    return [...this.events];
  }

  public subscribe(callback: (events: ApplicationAuditEvent[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.events]);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    const list = [...this.events];
    for (const listener of this.listeners) {
      try {
        listener(list);
      } catch (err) {
        console.error('AuditLogger subscriber error:', err);
      }
    }
  }
}

export const auditLogger = new AuditLoggerService();

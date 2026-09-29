/**
 * Simulated Real-Time IoT WebSocket Telemetry Stream Service
 * 
 * Emits live cold-storage and reefer sensor readings every 2000ms.
 * Architected with the exact same subscribe / unsubscribe / onMessage pattern
 * as a native WebSocket / Socket.io client, allowing seamless drop-in
 * replacement with a real backend connection without modifying UI components.
 */

import { TelemetryReading, ColdChainStatus } from '../types';
import { audioAlert } from '../lib/audioAlert';

export interface TelemetryStreamEvent {
  type: 'telemetry_tick' | 'thermal_breach' | 'auxiliary_restored';
  data: TelemetryReading;
  history: TelemetryReading[];
  isBreached: boolean;
  targetedBatchId: string;
}

export type TelemetryListener = (
  reading: TelemetryReading,
  history: TelemetryReading[],
  isBreached: boolean,
  event: TelemetryStreamEvent
) => void;

class TelemetryStreamService {
  private history: TelemetryReading[] = [];
  private isBreached: boolean = false;
  private currentTemp: number = 4.2; // Baseline around 4.2°C (matching Cold Storage #04)
  private baselineTemp: number = 4.2;
  private currentAmbient: number = 24.5;
  private currentHumidity: number = 85.0; // 85% RH
  private compressorDuty: number = 68; // %
  private batterySoh: number = 96.0; // % State of Health
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<TelemetryListener> = new Set();
  private targetedBatchId: string = '#ASG-001';
  private tickCounter: number = 0;

  constructor() {
    this.seedHistory();
    this.startStreaming();
  }

  /**
   * Pre-populate 50 historical rolling data points for smooth line chart rendering on mount
   */
  private seedHistory(): void {
    const now = Date.now();
    const count = 50;
    let runningTemp = 4.1;

    for (let i = count; i >= 0; i--) {
      const time = new Date(now - i * 2000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Smooth random walk for seed history (± 0.1 to 0.25°C)
      const delta = (Math.random() - 0.49) * 0.18;
      runningTemp = Math.max(3.5, Math.min(4.7, runningTemp + delta));

      const tempVal = parseFloat(runningTemp.toFixed(2));
      const socVal = parseFloat(Math.max(90, 96.5 - (count - i) * 0.01).toFixed(2));

      this.history.push({
        timestamp: time,
        coreTemp: tempVal,
        coreTemperature: tempVal,
        ambientTemp: parseFloat((24.2 + (Math.random() - 0.5) * 0.6).toFixed(1)),
        humidity: parseFloat((85.0 + Math.sin(i * 0.1) * 1.5).toFixed(1)),
        compressorDuty: 65 + Math.round((Math.random() - 0.5) * 6),
        batterySoc: socVal,
        batteryStateOfHealth: socVal,
        status: 'OPTIMAL'
      });
    }

    this.currentTemp = runningTemp;
  }

  /**
   * Subscribe to live simulated WebSocket message events.
   * MUST return an unsubscribe cleanup function to prevent memory leaks on component unmount.
   */
  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);

    // Immediately push current state to the new subscriber
    if (this.history.length > 0) {
      const latest = this.history[this.history.length - 1]!;
      const event: TelemetryStreamEvent = {
        type: this.isBreached ? 'thermal_breach' : 'telemetry_tick',
        data: latest,
        history: [...this.history],
        isBreached: this.isBreached,
        targetedBatchId: this.targetedBatchId
      };
      try {
        listener(latest, [...this.history], this.isBreached, event);
      } catch (err) {
        console.error('Error executing initial telemetry listener:', err);
      }
    }

    // Return strict teardown function
    return () => {
      this.unsubscribe(listener);
    };
  }

  /**
   * Explicit unsubscribe method for standard WebSocket interface compatibility
   */
  public unsubscribe(listener: TelemetryListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Alias for native WebSocket compatibility (onMessage)
   */
  public onMessage(callback: (reading: TelemetryReading, isBreached: boolean) => void): () => void {
    const listener: TelemetryListener = (reading, _history, isBreached) => {
      callback(reading, isBreached);
    };
    return this.subscribe(listener);
  }

  /**
   * Broadcast message to all active subscribers
   */
  private emit(type: TelemetryStreamEvent['type']): void {
    const latest = this.history[this.history.length - 1];
    if (!latest) return;

    const event: TelemetryStreamEvent = {
      type,
      data: latest,
      history: [...this.history],
      isBreached: this.isBreached,
      targetedBatchId: this.targetedBatchId
    };

    for (const listener of this.listeners) {
      try {
        listener(latest, [...this.history], this.isBreached, event);
      } catch (err) {
        console.error('Error in telemetry stream listener:', err);
      }
    }
  }

  /**
   * Trigger Emergency Thermal Breach simulation:
   * Drives temperature above >4.0°C critical threshold over several ticks,
   * trips compressor failure, and sounds Web Audio API alarm
   */
  public triggerThermalBreach(batchId: string = '#ASG-001'): boolean {
    this.isBreached = true;
    this.targetedBatchId = batchId;
    // Rapid initial jump above critical ceiling (>4.0°C)
    if (this.currentTemp < 4.8) {
      this.currentTemp = 4.85;
    }
    audioAlert.playBreachAlarm();
    this.tick();
    return true;
  }

  /**
   * Toggle thermal breach on / off
   */
  public toggleThermalBreach(batchId: string = '#ASG-001'): boolean {
    if (this.isBreached) {
      this.engageAuxiliaryCooling();
      return false;
    } else {
      return this.triggerThermalBreach(batchId);
    }
  }

  /**
   * Engage auxiliary cooling protocol and restore nominal temperature envelope
   */
  public engageAuxiliaryCooling(): void {
    this.isBreached = false;
    this.compressorDuty = 88; // Boost load
    this.currentTemp = 3.8; // Immediately pull down to safe zone
    audioAlert.playSyncChime();
    this.emit('auxiliary_restored');
    this.tick();
  }

  public isThermalBreachActive(): boolean {
    return this.isBreached;
  }

  public getTargetedBatchId(): string {
    return this.targetedBatchId;
  }

  public getLatestReading(): TelemetryReading | null {
    return this.history.length > 0 ? this.history[this.history.length - 1]! : null;
  }

  public getHistory(): TelemetryReading[] {
    return [...this.history];
  }

  /**
   * Core telemetry tick executed every 2000ms
   */
  private tick(): void {
    this.tickCounter++;

    if (this.isBreached) {
      // Escalating temperature walk into critical territory (>4.0°C up to 7.85°C)
      const escalationStep = 0.25 + Math.random() * 0.25;
      this.currentTemp = Math.min(7.85, parseFloat((this.currentTemp + escalationStep).toFixed(2)));
      this.compressorDuty = Math.max(18, this.compressorDuty - 4); // Compressor thermal failure
      this.currentHumidity = Math.max(76.0, parseFloat((this.currentHumidity - 0.5).toFixed(1)));
      
      // Sound dual-tone industrial alarm periodically during active breach
      if (this.tickCounter % 2 === 0) {
        audioAlert.playBreachAlarm();
      }
    } else {
      // Nominal state: check if pulling down towards baseline
      if (this.currentTemp > 4.5) {
        // Active rapid pull-down cooling towards baseline (2°C - 4.2°C)
        this.currentTemp = Math.max(this.baselineTemp, parseFloat((this.currentTemp - 0.35).toFixed(2)));
        this.compressorDuty = Math.min(90, this.compressorDuty + 3);
      } else {
        // Small realistic random walk around baseline (previous ± 0.1 to 0.3°C)
        const walk = (Math.random() - 0.49) * 0.24;
        let nextTemp = this.currentTemp + walk;

        // Dampen gently back towards baseline (3.8°C - 4.4°C) so it acts like real sensor noise
        if (nextTemp > 4.45) nextTemp -= 0.14;
        if (nextTemp < 3.75) nextTemp += 0.14;

        this.currentTemp = parseFloat(nextTemp.toFixed(2));
        this.compressorDuty = Math.min(82, Math.max(58, 68 + Math.round((Math.random() - 0.5) * 5)));
        
        // Humidity smooth random walk
        const humidityWalk = (Math.random() - 0.5) * 0.4;
        let nextHumidity = this.currentHumidity + humidityWalk;
        if (nextHumidity > 86.8) nextHumidity -= 0.3;
        if (nextHumidity < 83.2) nextHumidity += 0.3;
        this.currentHumidity = parseFloat(nextHumidity.toFixed(1));
      }
    }

    // Battery State of Health slowly decreases over a session, resets on refresh
    if (this.tickCounter % 3 === 0 && this.batterySoh > 80.0) {
      this.batterySoh = parseFloat((this.batterySoh - 0.01).toFixed(2));
    }

    const status: ColdChainStatus =
      this.currentTemp > 4.0 ? 'CRITICAL_BREACH' : this.currentTemp > 3.2 ? 'WARNING' : 'OPTIMAL';

    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newReading: TelemetryReading = {
      timestamp: time,
      coreTemp: this.currentTemp,
      coreTemperature: this.currentTemp,
      ambientTemp: parseFloat(this.currentAmbient.toFixed(1)),
      humidity: this.currentHumidity,
      compressorDuty: this.compressorDuty,
      batterySoc: this.batterySoh,
      batteryStateOfHealth: this.batterySoh,
      status
    };

    // Maintain a rolling window of the last 50 points
    this.history.push(newReading);
    if (this.history.length > 50) {
      this.history.shift();
    }

    this.emit(this.isBreached ? 'thermal_breach' : 'telemetry_tick');
  }

  /**
   * Start 2000ms streaming loop
   */
  private startStreaming(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.tick();
    }, 2000);
  }

  /**
   * Teardown service if needed
   */
  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.listeners.clear();
  }
}

export const telemetryService = new TelemetryStreamService();

import { TelemetryReading, ColdChainStatus } from '../types';
import { audioAlert } from '../lib/audioAlert';

class TelemetryStreamService {
  private history: TelemetryReading[] = [];
  private isBreached: boolean = false;
  private currentTemp: number = 1.8;
  private currentAmbient: number = 24.5;
  private currentHumidity: number = 92.4;
  private compressorDuty: number = 65; // %
  private batterySoc: number = 96; // %
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Set<(reading: TelemetryReading, history: TelemetryReading[], isBreach: boolean) => void> = new Set();

  constructor() {
    this.seedHistory();
    this.startStreaming();
  }

  private seedHistory(): void {
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now - i * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const temp = 1.6 + Math.sin(i * 0.4) * 0.35 + (Math.random() - 0.5) * 0.15;
      this.history.push({
        timestamp: time,
        coreTemp: parseFloat(temp.toFixed(2)),
        ambientTemp: 24.2 + (Math.random() - 0.5) * 0.8,
        humidity: parseFloat((92.0 + Math.sin(i * 0.2) * 1.5).toFixed(1)),
        compressorDuty: 64 + Math.round(Math.random() * 4),
        batterySoc: 96,
        status: 'OPTIMAL'
      });
    }
  }

  public subscribe(
    callback: (reading: TelemetryReading, history: TelemetryReading[], isBreach: boolean) => void
  ): () => void {
    this.listeners.add(callback);
    if (this.history.length > 0) {
      callback(this.history[this.history.length - 1]!, this.history, this.isBreached);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    const latest = this.history[this.history.length - 1];
    if (!latest) return;
    for (const listener of this.listeners) {
      listener(latest, this.history, this.isBreached);
    }
  }

  public toggleThermalBreach(): boolean {
    this.isBreached = !this.isBreached;
    if (this.isBreached) {
      audioAlert.playBreachAlarm();
    }
    this.tick();
    return this.isBreached;
  }

  public engageAuxiliaryCooling(): void {
    this.isBreached = false;
    this.currentTemp = 1.6;
    this.compressorDuty = 88;
    this.tick();
  }

  public isThermalBreachActive(): boolean {
    return this.isBreached;
  }

  private tick(): void {
    if (this.isBreached) {
      // Rapid thermal escalation past safe limits
      this.currentTemp = Math.min(7.8, this.currentTemp + 0.45 + Math.random() * 0.2);
      this.compressorDuty = Math.max(15, this.compressorDuty - 8); // compressor failure simulation
      this.currentHumidity = Math.max(81.0, this.currentHumidity - 1.2);
      audioAlert.playBreachAlarm();
    } else {
      // Nominal or recovering
      if (this.currentTemp > 2.2) {
        this.currentTemp = Math.max(1.7, this.currentTemp - 0.35); // cooling down
      } else {
        this.currentTemp = 1.7 + (Math.random() - 0.5) * 0.25;
      }
      this.compressorDuty = 65 + Math.round((Math.random() - 0.5) * 6);
      this.currentHumidity = 92.5 + (Math.random() - 0.5) * 1.0;
    }

    const status: ColdChainStatus = this.currentTemp > 4.0 ? 'CRITICAL_BREACH' : this.currentTemp > 2.8 ? 'WARNING' : 'OPTIMAL';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newReading: TelemetryReading = {
      timestamp: time,
      coreTemp: parseFloat(this.currentTemp.toFixed(2)),
      ambientTemp: parseFloat(this.currentAmbient.toFixed(1)),
      humidity: parseFloat(this.currentHumidity.toFixed(1)),
      compressorDuty: this.compressorDuty,
      batterySoc: this.batterySoc,
      status
    };

    this.history.push(newReading);
    if (this.history.length > 30) {
      this.history.shift();
    }

    this.notify();
  }

  private startStreaming(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1800);
  }

  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.listeners.clear();
  }
}

export const telemetryService = new TelemetryStreamService();

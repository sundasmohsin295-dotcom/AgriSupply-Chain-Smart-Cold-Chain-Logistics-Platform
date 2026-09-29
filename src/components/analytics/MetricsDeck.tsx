import React from 'react';
import { 
  BarChart3, 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  Percent
} from 'lucide-react';

export const MetricsDeck: React.FC = () => {
  // Spoilage reduction comparison data
  const lossRateData = [
    { commodity: 'Strawberries', conventional: 18.4, smartChain: 2.1, reduction: '-88.6%' },
    { commodity: 'Romaine Lettuce', conventional: 14.2, smartChain: 1.8, reduction: '-87.3%' },
    { commodity: 'Roma Tomatoes', conventional: 11.5, smartChain: 1.4, reduction: '-87.8%' },
    { commodity: 'Hass Avocados', conventional: 9.8, smartChain: 1.2, reduction: '-87.7%' },
    { commodity: 'Blueberries', conventional: 16.0, smartChain: 1.9, reduction: '-88.1%' }
  ];

  // Delivery corridors performance
  const corridorData = [
    { corridor: 'Salinas → SF Urban DC (168 km)', onTimeRate: 98.9, avgDuration: '2h 14m', varianceMin: '±4m' },
    { corridor: 'Pajaro Dunes → Silicon Valley (84 km)', onTimeRate: 99.4, avgDuration: '1h 05m', varianceMin: '±2m' },
    { corridor: 'Carpinteria → Central Coast Bay (140 km)', onTimeRate: 97.8, avgDuration: '1h 55m', varianceMin: '±6m' },
    { corridor: 'Hollister Valley → Oakland Port (122 km)', onTimeRate: 98.2, avgDuration: '1h 40m', varianceMin: '±5m' }
  ];

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-[#0f1722] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Agricultural Loss & Thermal Telemetry Metrics Deck</h1>
            <p className="text-xs text-slate-400">
              Autonomous cold-chain efficacy, historical corridor durations, and spoilage reduction benchmarking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Overall Spoilage Loss Rate:</span>
          <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
            1.88% (Down from 15.2%)
          </span>
        </div>
      </div>

      {/* Top 3 High-Impact KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-[#0f1722] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase tracking-wider font-mono">Agricultural Food Loss Reduction</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-black font-mono text-white">87.6%</span>
            <span className="text-xs font-semibold text-emerald-400">Net Spoilage Avoidance</span>
          </div>
          <p className="text-xs text-slate-500">
            Direct financial recovery of ~$42,000 per 100-ton harvest intake cycle.
          </p>
        </div>

        <div className="bg-[#0f1722] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase tracking-wider font-mono">Thermal Stability In-Transit</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-black font-mono text-emerald-400">99.4%</span>
            <span className="text-xs font-semibold text-slate-400">Within Setpoint</span>
          </div>
          <p className="text-xs text-slate-500">
            Average thermal deviation restricted to ±0.18°C along Interstate-5 corridor.
          </p>
        </div>

        <div className="bg-[#0f1722] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase tracking-wider font-mono">Fleet Corridors On-Time Rate</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-black font-mono text-white">98.6%</span>
            <span className="text-xs font-semibold text-amber-400">On-Time Arrival</span>
          </div>
          <p className="text-xs text-slate-500">
            Geofence automated intake expedites cross-dock turnarounds by 48 minutes.
          </p>
        </div>

      </div>

      {/* Main Charts Grid: Spoilage Comparison + Corridor Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Comparative Food Loss Bar Graph Container */}
        <div className="bg-[#0f1722] border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Post-Harvest Loss Rate by Commodity</h3>
              <p className="text-xs text-slate-400">Conventional Supply Chain vs AgriSupply Smart Cold-Chain</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block"></span> Conventional
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> AgriSupply
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {lossRateData.map((item) => (
              <div key={item.commodity} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{item.commodity}</span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-500">{item.conventional}% loss</span>
                    <span className="text-emerald-400 font-bold">{item.smartChain}% loss</span>
                    <span className="text-amber-400 font-semibold">{item.reduction}</span>
                  </div>
                </div>

                {/* Stacked comparison bar */}
                <div className="h-5 w-full bg-[#0a1017] rounded-lg overflow-hidden flex items-center p-0.5 border border-slate-800">
                  {/* Conventional bar ghost */}
                  <div
                    style={{ width: `${(item.conventional / 25) * 100}%` }}
                    className="h-full bg-slate-700/60 rounded-l relative group"
                  >
                    {/* Smart chain active bar inside */}
                    <div
                      style={{ width: `${(item.smartChain / item.conventional) * 100}%` }}
                      className="h-full bg-emerald-500 rounded"
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-mono flex justify-between border-t border-slate-800/80">
            <span>Source: University of California Postharvest Technology Center & USDA FSMA</span>
            <span>Benchmark N=1,400 Shipments</span>
          </div>
        </div>

        {/* Transportation Corridors Matrix */}
        <div className="bg-[#0f1722] border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Transit Corridor Dispatch Reliability</h3>
            <p className="text-xs text-slate-400">Geofence arrival timestamps and corridor durations</p>
          </div>

          <div className="space-y-3">
            {corridorData.map((c) => (
              <div
                key={c.corridor}
                className="p-3.5 bg-[#141d2a] border border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{c.corridor}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-1">
                    <span>Avg: <strong className="text-slate-200">{c.avgDuration}</strong></span>
                    <span>·</span>
                    <span>Variance: <strong className="text-sky-400">{c.varianceMin}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black font-mono text-emerald-400">{c.onTimeRate}%</div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">On-Time Arrival</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#0a1017] border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Compressor Energy Optimization
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dynamic inverter throttling based on ambient solar radiation reduced auxiliary diesel fuel burn by 23.4% across Pacific fleet tractors.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

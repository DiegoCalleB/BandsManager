import React from "react";
import { ShieldCheck, MapPin, ExternalLink, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Fan } from "../../types";

export interface FansDashboardViewProps {
  fans: Fan[];
  clickStats: Record<string, number>;
  effectiveBandName: string;
  evolutionaryGrowthData: any[];
  originData: any[];
  COLORS: string[];
}

export const FansDashboardView: React.FC<FansDashboardViewProps> = ({
  fans,
  clickStats,
  effectiveBandName,
  evolutionaryGrowthData,
  originData,
  COLORS
}) => {
  return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Total Fans Registrados</p>
              <h3 className="text-5xl font-black text-white font-display">{fans.length}</h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Consentimiento RGPD</p>
              <h3 className="text-4xl font-black text-emerald-400 font-display flex items-center gap-2">
                <ShieldCheck className="w-8 h-8" />
                100%
              </h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Ciudades Activas</p>
              <h3 className="text-4xl font-black text-amber-400 font-display flex items-center gap-2">
                <MapPin className="w-8 h-8" />
                {new Set(fans.map(f => f.ciudad).filter(Boolean)).size}
              </h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Clics Totales en QR & Redes</p>
              <h3 className="text-4xl font-black text-sky-400 font-display flex items-center gap-2">
                <ExternalLink className="w-7 h-7" />
                {Object.entries(clickStats).filter(([k]) => !k.endsWith('_last_at')).reduce((a, b) => a + Number(b[1] || 0), 0)}
              </h3>
            </div>
          </div>

          {/* Breakdown de Clics por Red Social, Métodos de Pago y Dossier */}
          {Object.keys(clickStats).length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Impacto de Enlaces en FansLanding & QR (Por Canal y Donaciones)
              </h4>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {Object.entries(clickStats)
                  .filter(([k]) => !k.endsWith('_last_at'))
                  .map(([key, count]) => (
                    <div key={key} className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex items-center gap-2">
                      <span className="font-semibold text-slate-200 uppercase">{key}:</span>
                      <span className="font-black text-amber-400">{count} {count === 1 ? 'clic' : 'clics'}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crecimiento Evolutivo de Fans */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-88 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    Crecimiento Evolutivo de Fans
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">Curva acumulativa de la comunidad {effectiveBandName}</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  Total: {fans.length} fans
                </span>
              </div>
              
              <div className="flex-1 min-h-0">
                {evolutionaryGrowthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionaryGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fanGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', borderRadius: '12px', color: '#fff'}}
                        formatter={(val: any, name: any) => [
                          name === 'total' ? `${val} fans acumulados` : `${val} nuevos capturados`,
                          name === 'total' ? 'Comunidad Total' : 'Capturados en el mes'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#fanGrowthGrad)" 
                        name="total" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">No hay datos suficientes</div>
                )}
              </div>
            </div>
            
            {/* Canal de Origen (Fixed & Visual) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-88 flex flex-col">
              <div className="mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Canal de Origen de Fans</p>
                <p className="text-[11px] text-slate-500 font-mono">De dónde provienen los registros</p>
              </div>

              <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center gap-4">
                {originData.length > 0 ? (
                  <>
                    <div className="w-full sm:w-1/2 h-48 sm:h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={originData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                          >
                            {originData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', borderRadius: '12px', color: '#fff'}}
                            formatter={(val: any, name: any) => [`${val} fans (${Math.round((val / (fans.length || 1)) * 100)}%)`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Channel Legend List */}
                    <div className="w-full sm:w-1/2 space-y-2 overflow-y-auto max-h-48 hide-scrollbar pr-1">
                      {originData.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800/80 text-xs font-mono">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-slate-200 font-bold truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-amber-400 font-bold">{item.value}</span>
                            <span className="text-slate-500 text-[10px]">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-slate-500 text-xs font-mono">No hay datos suficientes</div>
                )}
              </div>
            </div>
          </div>
        </div>

  );
};

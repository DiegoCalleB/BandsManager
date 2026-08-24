#!/bin/bash
cat << 'INNER_EOF' > /tmp/sed-script-epk-2.sed
1199s/grid-cols-2/grid-cols-3/
1217a\
                    <button\
                      type="button"\
                      onClick={() => setConfig({ ...config, donacionRevolut: { ...config.donacionRevolut, metodoPorDefecto: 'bizum' } })}\
                      className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition ${\
                        config.donacionRevolut?.metodoPorDefecto === 'bizum'\
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'\
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'\
                      }`}\
                    >\
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>\
                      Bizum\
                    </button>
INNER_EOF
sed -i -f /tmp/sed-script-epk-2.sed src/components/EPKManager.tsx

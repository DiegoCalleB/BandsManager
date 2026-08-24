#!/bin/bash
cat << 'INNER_EOF' > /tmp/sed-script-epk.sed
1082s/Apoyo Económico & Donaciones (Revolut & PayPal)/Apoyo Económico & Donaciones (Revolut, PayPal y Bizum)/
1088s/Permite a tus fans y asistentes al concierto hacer una aportación voluntaria directa por <strong className="text-sky-300">Revolut<\/strong> (revolut.me) o <strong className="text-blue-400">PayPal<\/strong> (paypal.me), sin comisiones intermedias. Se muestra en el formulario público "Únete", en la pantalla de confirmación y en el Dossier EPK./Permite a tus fans y asistentes al concierto hacer una aportación voluntaria directa por <strong className="text-sky-300">Revolut<\/strong>, <strong className="text-blue-400">PayPal<\/strong> o <strong className="text-emerald-400">Bizum<\/strong> sin comisiones intermedias. Se muestra en el formulario público "Únete", en la pantalla de confirmación y en el Dossier EPK./
1168a\
\
                  <div className="space-y-1.5">\
                    <div className="flex items-center gap-2">\
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center p-0.5 shadow-sm border border-emerald-500/30">\
                        <Phone className="w-3.5 h-3.5" />\
                      </div>\
                      <label className="text-xs font-semibold text-emerald-200">Bizum (Teléfono)</label>\
                    </div>\
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 focus-within:border-emerald-500 rounded-lg px-2.5">\
                      <span className="text-[10px] text-slate-500 font-mono">TLF:</span>\
                      <input\
                        type="text"\
                        value={config.donacionRevolut?.bizumTelefono || ''}\
                        onChange={e => {\
                          const num = e.target.value.replace(/[^0-9+\\s-]/g, '');\
                          setConfig(prev => ({\
                            ...prev,\
                            donacionRevolut: { ...prev.donacionRevolut, bizumTelefono: num },\
                            enlacesRedes: { ...(prev.enlacesRedes || {}), bizum: num }\
                          }));\
                        }}\
                        placeholder="+34 600 000 000"\
                        className="w-full bg-transparent py-1.5 text-xs text-emerald-300 font-bold outline-none font-mono"\
                      />\
                    </div>\
                  </div>
INNER_EOF
sed -i -f /tmp/sed-script-epk.sed src/components/EPKManager.tsx

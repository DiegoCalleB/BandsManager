#!/bin/bash
cat << 'INNER_EOF' > /tmp/sed-script-rider.sed
858a\
\
          {/* TECHNICAL RIDER */}\
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">\
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">\
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">\
                <FileDown className="w-5 h-5" /> Rider Técnico\
              </h3>\
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">\
                Solo visible aquí\
              </span>\
            </div>\
            <p className="text-xs text-slate-400">\
              Este texto y documento ya no se muestra en el enlace público. Úsalo como biblioteca para guardarlo aquí y enviarlo a las salas cuando sea necesario.\
            </p>\
\
            <div className="space-y-3">\
              <label className="text-xs font-bold text-white block">Archivo de Rider Técnico (PDF)</label>\
              {config.riderPdfUrl ? (\
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">\
                  <div className="flex items-start justify-between gap-4">\
                    <div className="flex items-center gap-3 overflow-hidden">\
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">\
                        <FileDown className="w-5 h-5" />\
                      </div>\
                      <div className="min-w-0">\
                        <p className="text-xs font-bold text-white truncate">{config.riderPdfName || 'Archivo subido'}</p>\
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">PDF guardado correctamente</p>\
                      </div>\
                    </div>\
                    <button\
                      type="button"\
                      onClick={() => setConfig({ ...config, riderPdfUrl: '', riderPdfName: '' })}\
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition shrink-0"\
                      title="Eliminar PDF"\
                    >\
                      <Trash2 className="w-4 h-4" />\
                    </button>\
                  </div>\
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">\
                    <a\
                      href={config.riderPdfUrl}\
                      target="_blank"\
                      rel="noopener noreferrer"\
                      className="flex-1 py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition"\
                    >\
                      <Download className="w-3.5 h-3.5" /> Descargar / Abrir Rider\
                    </a>\
                    \
                    <label className="cursor-pointer py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition">\
                      <Upload className="w-3.5 h-3.5 text-amber-400" /> Cambiar\
                      <input \
                        type="file" \
                        accept=".pdf,.doc,.docx" \
                        onChange={handleRiderUpload} \
                        className="hidden" \
                        disabled={isUploadingRider}\
                      />\
                    </label>\
                  </div>\
                </div>\
              ) : (\
                <div className="p-5 bg-slate-950 border border-dashed border-slate-800 rounded-xl text-center space-y-3">\
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">\
                    <FileDown className="w-6 h-6 text-amber-400" />\
                  </div>\
                  <div className="space-y-1">\
                    <p className="text-xs font-bold text-white">Sube aquí el Rider Técnico (PDF)</p>\
                  </div>\
\
                  <label className="inline-flex cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs items-center gap-2 transition shadow-md">\
                    {isUploadingRider ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}\
                    <span>{isUploadingRider ? 'Subiendo Documento...' : 'Seleccionar PDF / Rider'}</span>\
                    <input \
                      type="file" \
                      accept=".pdf,.doc,.docx" \
                      onChange={handleRiderUpload} \
                      className="hidden" \
                      disabled={isUploadingRider}\
                    />\
                  </label>\
                </div>\
              )}\
              \
              <div className="pt-2 space-y-1">\
                <label className="text-[11px] font-semibold text-slate-400">Rider Técnico (Texto)</label>\
                <textarea\
                  value={config.riderTecnico || ''}\
                  onChange={e => setConfig({ ...config, riderTecnico: e.target.value })}\
                  placeholder="Canales, microfonía, DIs, etc..."\
                  rows={4}\
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-colors font-mono leading-relaxed resize-none"\
                />\
              </div>\
            </div>\
          </div>
INNER_EOF
sed -i -f /tmp/sed-script-rider.sed src/components/EPKManager.tsx

#!/bin/bash
cat << 'INNER_EOF' > patch.sed
519,543c\
            {hasBizum && (\
              <button\
                type="button"\
                onClick={handleCopyBizum}\
                className="group relative flex items-center gap-2.5 p-2.5 rounded-xl bg-[#000000] hover:bg-[#1a1a1a] border border-emerald-500/40 hover:border-emerald-400 transition-all duration-200 shadow-sm text-left active:scale-[0.98] cursor-pointer overflow-hidden animate-donate-cta-glow-delayed col-span-full"\
              >\
                <span\
                  className="pointer-events-none absolute -top-1/2 -left-8 h-[200%] w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-donate-sheen-delayed"\
                  aria-hidden="true"\
                />\
                <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center p-1 shrink-0 shadow group-hover:scale-105 transition-transform">\
                  <BizumLogo className="w-full h-full" />\
                </div>\
                <div className="min-w-0 flex-1 flex justify-between items-center">\
                  <div>\
                    <span className="text-[11px] sm:text-xs font-bold text-white group-hover:text-amber-300 transition block truncate">\
                      Bizum\
                    </span>\
                    <span className="text-[10px] text-emerald-400 font-mono font-bold block truncate group-hover:text-emerald-300">\
                      {bizumTelefono}\
                    </span>\
                  </div>\
                  <div\
                    className="p-1.5 rounded-lg bg-neutral-800/80 group-hover:bg-neutral-700 transition-colors flex items-center justify-center"\
                  >\
                    {bizumCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-300" />}\
                  </div>\
                </div>\
              </button>\
            )}
INNER_EOF
sed -i -f patch.sed src/components/FansLanding.tsx

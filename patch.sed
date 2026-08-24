519,544c\
            {hasBizum && (\
              <button\
                type="button"\
                onClick={handleCopyBizum}\
                className="group relative flex items-center gap-2.5 p-2.5 rounded-xl bg-[#008f6b] hover:bg-[#007054] border border-emerald-400/40 hover:border-emerald-300 transition-all duration-200 shadow-sm text-left active:scale-[0.98] cursor-pointer overflow-hidden animate-donate-cta-glow-delayed"\
              >\
                <span\
                  className="pointer-events-none absolute -top-1/2 -left-8 h-[200%] w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-donate-sheen-delayed"\
                  aria-hidden="true"\
                />\
                <div className="w-7 h-7 rounded-lg bg-white text-[#008f6b] flex items-center justify-center p-1 shrink-0 shadow group-hover:scale-105 transition-transform">\
                  <BizumLogo className="w-full h-full" />\
                </div>\
                <div className="min-w-0 flex-1">\
                  <span className="text-[11px] sm:text-xs font-bold text-white group-hover:text-amber-300 transition block truncate">\
                    Bizum\
                  </span>\
                  <span className="text-[9px] text-emerald-100 font-mono block truncate group-hover:text-white">\
                    {bizumCopied ? '¡Número copiado!' : bizumTelefono}\
                  </span>\
                </div>\
              </button>\
            )}\
          </div>

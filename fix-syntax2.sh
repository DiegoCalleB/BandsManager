cat << 'INNER_EOF' > fix-syntax2.sed
531,544c\
                <div className="min-w-0 flex-1">\
                  <span className="text-[11px] sm:text-xs font-bold text-white group-hover:text-amber-300 transition block truncate">\
                    Bizum\
                  </span>\
                  <span className="text-[9px] text-emerald-100 font-mono block truncate group-hover:text-white">\
                    {bizumCopied ? '¡Copiado!' : bizumTelefono}\
                  </span>\
                </div>\
              </button>\
            )}\
          </div>
INNER_EOF
sed -i -f fix-syntax2.sed src/components/FansLanding.tsx

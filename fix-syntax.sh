cat << 'INNER_EOF' > fix-syntax.sed
535,539c\
                  <span className="text-[9px] text-emerald-100 font-mono block truncate group-hover:text-white">\
                    {bizumCopied ? '¡Copiado!' : bizumTelefono}\
                  </span>\
                </div>\
              </button>
INNER_EOF
sed -i -f fix-syntax.sed src/components/FansLanding.tsx

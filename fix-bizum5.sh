cat << 'INNER_EOF' > fix5.sed
535,537c\
                  </span>\
                  <span className="text-[9px] text-emerald-100 font-mono block truncate group-hover:text-white">\
                    {bizumCopied ? '¡Copiado!' : bizumTelefono}\
                  </span>\
INNER_EOF
sed -i -f fix5.sed src/components/FansLanding.tsx

cat << 'INNER_EOF' > fix2.sed
543a\
\
          {/* Pie de seguridad y métricas */}\
          <div className="pt-2.5 flex items-center justify-between text-[10px] text-neutral-500">\
            <span className="flex items-center gap-1">\
              <LockIcon className="w-3 h-3 text-neutral-500 shrink-0" />\
              <span>Pago seguro sin comisiones para la banda</span>\
            </span>
INNER_EOF
sed -i -f fix2.sed src/components/FansLanding.tsx

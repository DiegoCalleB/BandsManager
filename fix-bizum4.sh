cat << 'INNER_EOF' > fix4.sed
541,561c\
            )}\
          </div>\
\
          {/* Pie de seguridad y métricas */}\
          <div className="pt-2.5 flex items-center justify-between text-[10px] text-neutral-500">\
            <span className="flex items-center gap-1">\
              <LockIcon className="w-3 h-3 text-neutral-500 shrink-0" />\
              <span>Pago seguro sin comisiones para la banda</span>\
            </span>\
            {totalClicks > 0 && (\
              <span className="text-[9px] font-mono text-neutral-500 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">\
                {totalClicks} {totalClicks === 1 ? t('clickSingular') : t('clickPlural')}\
              </span>\
            )}\
          </div>\
        </div>\
      </div>\
    );\
  };
INNER_EOF
sed -i -f fix4.sed src/components/FansLanding.tsx

cat << 'INNER_EOF' > fix-icon-again.sed
451,452c\
              <div className="absolute inset-0 bg-emerald-400/10 animate-pulse" />\
              <img src="/Screenshot_20260824_160458_Google.jpg" alt="Aportaciones" className="w-full h-full object-cover relative z-10 rounded-xl" />
INNER_EOF
sed -i -f fix-icon-again.sed src/components/FansLanding.tsx

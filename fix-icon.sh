cat << 'INNER_EOF' > fix-icon.sed
451,452c\
              <div className="absolute inset-0 bg-emerald-400/10 animate-pulse" />\
              <HandHeart className="w-6 h-6 relative z-10" />
INNER_EOF
sed -i -f fix-icon.sed src/components/FansLanding.tsx

cat << 'INNER_EOF' > fix-dup.sed
538,539d
INNER_EOF
sed -i -f fix-dup.sed src/components/FansLanding.tsx

cat << 'INNER_EOF' > fix-grid.sed
466c\
          <div className={\`grid gap-2 pt-3 \${[hasRevolut, hasPaypal, hasBizum].filter(Boolean).length === 3 ? 'grid-cols-3' : [hasRevolut, hasPaypal, hasBizum].filter(Boolean).length === 2 ? 'grid-cols-2' : 'grid-cols-1'}\`}>
INNER_EOF
sed -i -f fix-grid.sed src/components/FansLanding.tsx

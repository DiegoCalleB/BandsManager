#!/bin/bash
cat << 'INNER_EOF' > /tmp/sed-script-bizum.sed
21a\
  const [bizumCopied, setBizumCopied] = useState(false);\
  const handleCopyBizum = (e: React.MouseEvent) => {\
    e.preventDefault();\
    navigator.clipboard.writeText(donacionRevolut?.bizumTelefono || socialLinks?.bizum || '');\
    setBizumCopied(true);\
    setTimeout(() => setBizumCopied(false), 2000);\
  };
528,533c\
                  <button\
                    onClick={handleCopyBizum}\
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"\
                  >
536c\
                    {bizumCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-300" />}
INNER_EOF
sed -i -f /tmp/sed-script-bizum.sed src/components/FansLanding.tsx

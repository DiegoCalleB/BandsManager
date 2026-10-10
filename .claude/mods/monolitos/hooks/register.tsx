import type { Register } from 'claude-code'

const SCRIPT = `
n="$1"; ref="$2"
if [ -z "$ref" ]; then
  git ls-files | grep -E '\\.(ts|tsx|js|jsx|css)$' | while read -r f; do
    [ -f "$f" ] && printf '%s %s\\n' "$(wc -l < "$f")" "$f"
  done
else
  git ls-tree -r --name-only "$ref" | grep -E '\\.(ts|tsx|js|jsx|css)$' | while read -r f; do
    printf '%s %s\\n' "$(git show "$ref:$f" | wc -l)" "$f"
  done
fi | sort -rn | head -n "$n"
`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'monolitos',
      description: 'Archivos de código más grandes: /monolitos [N] [rama-o-commit]',
    })

    return next(e)
  })

  on('command.run', { command: 'monolitos' }, async ($, e) => {
    const [first, second] = e.args.trim().split(/\s+/).filter(Boolean)
    const isNum = first !== undefined && /^\d+$/.test(first)
    const n = isNum ? Math.min(Number(first), 200) : 15
    const ref = (isNum ? second : first) ?? ''
    if (ref && !/^[\w./@-]+$/.test(ref) && !ref.startsWith('-')) {
      return { text: `Ref inválida: ${ref}` }
    }
    if (ref.startsWith('-')) return { text: `Ref inválida: ${ref}` }

    const run = await $.process.run(['sh', '-c', SCRIPT, '_', String(n), ref])
    if (run.exitCode !== 0) return { text: `Error: ${run.stderr.trim() || 'exit ' + run.exitCode}` }

    const rows = run.stdout.trim().split('\n').filter(Boolean).map(l => {
      const [lines, ...path] = l.trim().split(/\s+/)
      return `${lines.padStart(6)}  ${path.join(' ')}`
    })

    return { text: `Archivos más grandes${ref ? ` en ${ref}` : ''}:\n${rows.join('\n')}` }
  })
}

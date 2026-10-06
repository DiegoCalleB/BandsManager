// Conventional Commits: de aquí sale la versión (fix -> parche, feat -> menor, feat! -> mayor).
// Ver AGENTS.md §7.6. Los mensajes van en español, así que no se fuerza el estilo del asunto.
/* global module */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'chore', 'ci', 'build', 'style', 'revert']],
    'subject-case': [0],
    'header-max-length': [1, 'always', 120],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};

250,288c\
@keyframes donate-cta-glow {\
  0%, 100% { box-shadow: 0 0 12px 1px rgba(255, 255, 255, 0.08); }\
  50% { box-shadow: 0 0 24px 3px rgba(255, 255, 255, 0.2); }\
}\
\
.animate-donate-cta-glow {\
  animation: donate-cta-glow 2.5s ease-in-out infinite;\
}\
\
@keyframes donate-sheen {\
  0% { transform: translateX(-150%) skewX(-25deg); }\
  100% { transform: translateX(350%) skewX(-25deg); }\
}\
\
.animate-donate-sheen {\
  animation: donate-sheen 3s infinite;\
}\
\
/* Desfase negativo para que empiece de inmediato pero en otro punto del ciclo */\
.animate-donate-cta-glow-delayed {\
  animation: donate-cta-glow 2.5s ease-in-out infinite;\
  animation-delay: -1.25s;\
}\
\
.animate-donate-sheen-delayed {\
  animation: donate-sheen 3s infinite;\
  animation-delay: -1.5s;\
}\
\
@media (prefers-reduced-motion: reduce) {\
  .animate-heartbeat,\
  .animate-donate-cta-glow,\
  .animate-donate-cta-glow-delayed,\
  .animate-donate-sheen,\
  .animate-donate-sheen-delayed {\
    animation: none;\
  }\
}

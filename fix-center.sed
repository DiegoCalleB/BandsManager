483,533c\
                {activeMethods.map((id, index) => {\
                  const isFullWidth = activeMethods.length === 3 && index === 0;\
                  const containerLayout = isFullWidth ? 'col-span-2 py-3.5 justify-center' : 'p-2.5 justify-start';\
                  const textLayout = isFullWidth ? 'flex flex-col items-start' : 'min-w-0 flex-1';\
                  const iconSize = isFullWidth ? 'w-8 h-8' : 'w-7 h-7';\
                  \
                  if (id === 'revolut') {\
                    return (\
                      <a key={id} href={revolutUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackClick('revolut', revolutUrl, contextType)} className={\`group relative flex items-center gap-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-neutral-700/80 hover:border-neutral-500 transition-all duration-200 shadow-sm text-left active:scale-[0.98] cursor-pointer overflow-hidden animate-donate-cta-glow \${containerLayout}\`}>\
                        <span className="pointer-events-none absolute -top-1/2 -left-8 h-[200%] w-8 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-donate-sheen" aria-hidden="true" />\
                        <div className={\`rounded-lg bg-white text-black flex items-center justify-center p-1 shrink-0 shadow group-hover:scale-105 transition-transform \${iconSize}\`}>\
                          <svg className="w-full h-full fill-black" viewBox="0 0 24 24"><path d="M18.72 9.24c-.06-.5-.2-.98-.44-1.42a4.43 4.43 0 0 0-1.12-1.3A4.78 4.78 0 0 0 15.5 5.6c-.63-.23-1.3-.35-1.98-.35H6.28v2.75h7.24c.72 0 1.39.28 1.9.79.5.5.79 1.18.79 1.9 0 .73-.29 1.4-.79 1.91-.51.5-1.18.78-1.9.78h-3.3v2.8h2.64l4.28 7.82h3.28l-4.14-7.57a4.93 4.93 0 0 0 2.94-4.23zM6.28 10.3v13.7h2.75V10.3H6.28z"/></svg>\
                        </div>\
                        <div className={textLayout}>\
                          <span className="text-[11px] sm:text-xs font-bold text-white group-hover:text-amber-300 transition block truncate">Revolut</span>\
                          <span className="text-[9px] text-neutral-400 font-mono block truncate group-hover:text-neutral-200">{revolutDisplay.replace(/^revolut\.me\\//, '@')}</span>\
                        </div>\
                      </a>\
                    );\
                  }\
                  \
                  if (id === 'paypal') {\
                    return (\
                      <a key={id} href={paypalUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackClick('paypal', paypalUrl, contextType)} className={\`group relative flex items-center gap-2.5 rounded-xl bg-[#003087] hover:bg-[#00266e] border border-sky-400/40 hover:border-sky-300 transition-all duration-200 shadow-sm text-left active:scale-[0.98] cursor-pointer overflow-hidden animate-donate-cta-glow-delayed \${containerLayout}\`}>\
                        <span className="pointer-events-none absolute -top-1/2 -left-8 h-[200%] w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-donate-sheen-delayed" aria-hidden="true" />\
                        <div className={\`rounded-lg bg-white text-[#003087] flex items-center justify-center p-1 shrink-0 shadow group-hover:scale-105 transition-transform \${iconSize}\`}>\
                          <PayPalLogo className="w-full h-full" />\
                        </div>\
                        <div className={textLayout}>\
                          <span className="text-[11px] sm:text-xs font-bold text-white group-hover:text-amber-300 transition block truncate">PayPal</span>\
                          <span className="text-[9px] text-sky-200 font-mono block truncate group-hover:text-white">{paypalDisplay.replace(/^paypal\.me\\//, '@')}</span>\
                        </div>\
                      </a>\
                    );\
                  }\
                  \
                  if (id === 'bizum') {\
                    return (\
                      <button key={id} type="button" onClick={handleCopyBizum} className={\`group relative flex items-center gap-2.5 rounded-xl bg-[#008f6b] hover:bg-[#007054] border border-emerald-400/40 hover:border-emerald-300 transition-all duration-200 shadow-sm text-left active:scale-[0.98] cursor-pointer overflow-hidden animate-donate-cta-glow-delayed \${containerLayout}\`}>\
                        <span className="pointer-events-none absolute -top-1/2 -left-8 h-[200%] w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-donate-sheen-delayed" aria-hidden="true" />\
                        <div className={\`rounded-lg bg-white text-[#008f6b] flex items-center justify-center p-1 shrink-0 shadow group-hover:scale-105 transition-transform \${iconSize}\`}>\
                          <BizumLogo className="w-full h-full" />\
                        </div>\
                        <div className={textLayout}>\
                          <span className="text-[11px] sm:text-xs font-bold text-white group-hover:text-amber-300 transition block truncate">Bizum</span>\
                          <span className="text-[9px] text-emerald-100 font-mono block truncate group-hover:text-white">{bizumCopied ? 'Copiado' : bizumTelefono}</span>\
                        </div>\
                      </button>\
                    );\
                  }\
                  \
                  return null;\
                })}

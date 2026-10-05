const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'CalendarView.tsx');
let text = fs.readFileSync(filePath, 'utf8');

const target = `                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 mb-1">Horario</label>
                  <input
                    type="text"
                    value={editRehearsalDraft.hora}
                    onChange={(e) => setEditRehearsalDraft(prev => prev ? { ...prev, hora: e.target.value } : prev)}
                    placeholder="ej. 18:00 - 21:00"
                    required
                    className={\`w-full px-2 py-1 text-[10px] rounded-lg outline-none font-mono \${
                      isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
                    }\`}
                  />
                </div>
              </div>`;

const replacement = `                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 mb-1">Horario</label>
                  <input
                    type="text"
                    value={editRehearsalDraft.hora}
                    onChange={(e) => setEditRehearsalDraft(prev => prev ? { ...prev, hora: e.target.value } : prev)}
                    placeholder="ej. 18:00 - 21:00"
                    required
                    className={\`w-full px-2 py-1 text-[10px] rounded-lg outline-none font-mono \${
                      isStitchLight ? 'bg-slate-50 text-slate-900' : 'bg-neutral-900 text-white'
                    }\`}
                  />
                </div>`;

const normalizedText = text.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (normalizedText.includes(normalizedTarget)) {
  const newText = normalizedText.replace(normalizedTarget, replacement);
  fs.writeFileSync(filePath, newText, 'utf8');
  console.log('Successfully fixed extra </div> at edit rehearsal form!');
} else {
  console.log('Target not found, checking substring...');
}

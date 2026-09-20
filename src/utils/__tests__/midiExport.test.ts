import { describe, it, expect } from' vitest';
import { eventosAMidiBlob } from' ../midiExport';
import { MelodicNoteEvent } from' ../../types';

async function bytesDe(blob: Blob): Promise<number[]> {
 return Array.from(new Uint8Array(await blob.arrayBuffer()));
}

function leerAscii(bytes: number[], desde: number, largo: number): string {
 return bytes.slice(desde, desde + largo).map((b) => String.fromCharCode(b)).join('');
}

/** Localiza una secuencia de bytes; -1 si no está. */
function indiceDe(bytes: number[], patron: number[]): number {
 for (let i = 0; i <= bytes.length - patron.length; i++) {
 if (patron.every((b, j) => bytes[i + j] === b)) return i;
 }
 return -1;
}

const dosNotas: MelodicNoteEvent[] = [
 { tiempo: 0, nota:' E4', duracionBeats: 1, velocidad: 1 },
 { tiempo: 2, nota:' G4', duracionBeats: 0.5, velocidad: 0.5 }
];

describe('eventosAMidiBlob', () => {
 it('escribe una cabecera de Standard MIDI File tipo 0 con 480 pulsos por negra', async () => {
 const bytes = await bytesDe(eventosAMidiBlob({ eventos: dosNotas, bpm: 120, instrument:' guitarra' }));

 expect(leerAscii(bytes, 0, 4)).toBe('MThd');
 expect(bytes.slice(4, 8)).toEqual([0, 0, 0, 6]); // longitud de cabecera
 expect(bytes.slice(8, 10)).toEqual([0, 0]); // formato 0
 expect(bytes.slice(10, 12)).toEqual([0, 1]); // una pista
 expect((bytes[12] << 8) | bytes[13]).toBe(480); // PPQ
 expect(leerAscii(bytes, 14, 4)).toBe('MTrk');
 });

 it('declara la longitud real del bloque de pista', async () => {
 const bytes = await bytesDe(eventosAMidiBlob({ eventos: dosNotas, bpm: 120, instrument:' guitarra' }));

 const declarada = (bytes[18] << 24) | (bytes[19] << 16) | (bytes[20] << 8) | bytes[21];
 expect(declarada).toBe(bytes.length - 22);
 });

 it('graba el tempo para que el DAW abra el fichero a la velocidad correcta', async () => {
 const bytes = await bytesDe(eventosAMidiBlob({ eventos: dosNotas, bpm: 140, instrument:' violin' }));

 const i = indiceDe(bytes, [0xff, 0x51, 0x03]);
 expect(i).toBeGreaterThan(-1);
 const micros = (bytes[i + 3] << 16) | (bytes[i + 4] << 8) | bytes[i + 5];
 expect(micros).toBe(Math.round(60_000_000 / 140));
 });

 it('asigna el programa de General MIDI de cada instrumento', async () => {
 const violin = await bytesDe(eventosAMidiBlob({ eventos: dosNotas, bpm: 120, instrument:' violin' }));
 expect(indiceDe(violin, [0xc0, 40])).toBeGreaterThan(-1);

 const guitarra = await bytesDe(eventosAMidiBlob({ eventos: dosNotas, bpm: 120, instrument:' guitarra' }));
 expect(indiceDe(guitarra, [0xc0, 25])).toBeGreaterThan(-1);

 const handpan = await bytesDe(eventosAMidiBlob({ eventos: dosNotas, bpm: 120, instrument:' handpan' }));
 expect(indiceDe(handpan, [0xc0, 114])).toBeGreaterThan(-1);
 });

 it('manda la percusión al canal 10 de batería y sin cambio de programa', async () => {
 const bytes = await bytesDe(eventosAMidiBlob({
 eventos: [{ tiempo: 0, nota:' C2', duracionBeats: 0.5, velocidad: 1 }],
 bpm: 120,
 instrument:' percusion'
 }));

 // Canal 10 = índice 9: note-on 0x99, note-off 0x89.
 expect(indiceDe(bytes, [0x99, 36])).toBeGreaterThan(-1);
 expect(indiceDe(bytes, [0x89, 36])).toBeGreaterThan(-1);
 // En el canal de batería un program change no aporta nada y puede confundir al DAW.
 expect(indiceDe(bytes, [0xc9])).toBe(-1);
 });

 it('traduce la duración en compases a pulsos y empareja cada nota con su note-off', async () => {
 const bytes = await bytesDe(eventosAMidiBlob({
 eventos: [{ tiempo: 0, nota:' E4', duracionBeats: 1, velocidad: 1 }],
 bpm: 120,
 instrument:' guitarra'
 }));

 // E4 = 64, a intensidad máxima = 127.
 const on = indiceDe(bytes, [0x90, 64, 127]);
 expect(on).toBeGreaterThan(-1);

 // Una negra son 480 pulsos: el delta antes del note-off debe codificar 480 -> 0x83 0x60.
 const off = indiceDe(bytes, [0x83, 0x60, 0x80, 64]);
 expect(off).toBeGreaterThan(on);
 });

 it('convierte la intensidad de 0-1 al rango 0-127 de MIDI', async () => {
 const bytes = await bytesDe(eventosAMidiBlob({
 eventos: [{ tiempo: 0, nota:' E4', duracionBeats: 1, velocidad: 0.5 }],
 bpm: 120,
 instrument:' guitarra'
 }));

 expect(indiceDe(bytes, [0x90, 64, 64])).toBeGreaterThan(-1);
 });

 it('suelta la nota anterior antes de repicar la misma altura', async () => {
 // Sin ordenar los eventos, el note-off de la primera mataría a la segunda nada más empezar.
 const bytes = await bytesDe(eventosAMidiBlob({
 eventos: [
 { tiempo: 0, nota:' E4', duracionBeats: 1, velocidad: 1 },
 { tiempo: 1, nota:' E4', duracionBeats: 1, velocidad: 1 }
 ],
 bpm: 120,
 instrument:' guitarra'
 }));

 const off = indiceDe(bytes, [0x80, 64, 0x40]);
 const segundoOn = bytes.indexOf(0x90, off);
 expect(off).toBeGreaterThan(-1);
 expect(segundoOn).toBeGreaterThan(off);
 });

 it('ignora una nota que no se puede interpretar en vez de escribir basura', async () => {
 const bytes = await bytesDe(eventosAMidiBlob({
 eventos: [
 { tiempo: 0, nota:' H4', duracionBeats: 1, velocidad: 1 },
 { tiempo: 1, nota:' E4', duracionBeats: 1, velocidad: 1 }
 ],
 bpm: 120,
 instrument:' guitarra'
 }));

 // Solo debe quedar un note-on, el de la nota válida.
 expect(bytes.filter((b, i) => b === 0x90 && bytes[i + 1] === 64).length).toBe(1);
 });

 it('cierra siempre la pista con el meta evento de fin', async () => {
 const bytes = await bytesDe(eventosAMidiBlob({ eventos: [], bpm: 120, instrument:' guitarra' }));

 expect(bytes.slice(-3)).toEqual([0xff, 0x2f, 0x00]);
 });

 it('produce un fichero válido aunque la idea venga vacía', async () => {
 const blob = eventosAMidiBlob({ eventos: [], bpm: 120, instrument:' violin' });
 const bytes = await bytesDe(blob);

 expect(blob.type).toBe('audio/midi');
 expect(leerAscii(bytes, 0, 4)).toBe('MThd');
 });
});

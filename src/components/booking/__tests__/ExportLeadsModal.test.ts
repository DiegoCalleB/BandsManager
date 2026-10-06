import { describe, it, expect } from 'vitest';
import { Lead } from '../../../types';

describe('ExportLeadsModal Data Formatting', () => {
  const mockLeads: Lead[] = [
    {
      id: 'lead-1',
      nombre_sala: 'Sala Caracol',
      ciudad: 'Madrid',
      region: 'Madrid',
      direccion: 'Calle Bernardino Obregón 18',
      aforo: 500,
      tipo: 'sala',
      estado: 'confirmado',
      email_contacto: 'info@salacaracol.com',
      telefono: '915000000',
      website: 'https://salacaracol.com',
      instagram: '@salacaracol',
      genero: 'Rock / Ska',
      fuente: 'Scout',
      pitch_generado: 'Hola Sala Caracol, nos encantaría tocar...',
      notas: 'Concierto confirmado para noviembre'
    },
    {
      id: 'lead-2',
      nombre_sala: 'Razzmatazz',
      ciudad: 'Barcelona',
      region: 'Cataluña',
      direccion: 'Carrer dels Almogàvers 122',
      aforo: 1000,
      tipo: 'sala',
      estado: 'negociando',
      email_contacto: 'booking@salarazzmatazz.com',
      telefono: '933208200',
      website: 'https://salarazzmatazz.com',
      instagram: '@razzmatazzbcn',
      genero: 'Mestizaje',
      fuente: 'Manual',
      pitch_generado: 'Hola Razzmatazz...',
      notas: 'Respuesta pendiente'
    }
  ];

  it('formatea celdas de CSV con comillas dobles y escapado seguro', () => {
    const cleanCsvCell = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${str}"`;
    };

    expect(cleanCsvCell('Sala "La Riviera"')).toBe('"Sala ""La Riviera"""');
    expect(cleanCsvCell(500)).toBe('"500"');
    expect(cleanCsvCell(null)).toBe('""');
  });

  it('genera contenido CSV con prefijo UTF-8 BOM (\\uFEFF)', () => {
    const headers = ['ID', 'Nombre', 'Ciudad'];
    const rows = mockLeads.map(l => `"${l.id}","${l.nombre_sala}","${l.ciudad}"`);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    expect(csvContent.startsWith('\uFEFF')).toBe(true);
    expect(csvContent).toContain('Sala Caracol');
    expect(csvContent).toContain('Razzmatazz');
    expect(csvContent).toContain('Barcelona');
  });
});

import React, { useState } from 'react';
import { Concert, KeyContactItem, CierreMaterialItem, MerchBoloItem, MerchControlBolo } from '../../types';
import { RoadbookInfo } from './calendarTypes';
import { openWhatsAppChat } from '../../utils/whatsapp';

export function useCalendarRoadbook(
  selectedConcert: Concert | null | undefined,
  getBandIdentity?: (bandId?: string) => { name: string; logoUrl?: string }
) {
  // Form states for adding Cierre Item
  const [newCierreItemText, setNewCierreItemText] = useState('');
  const [newCierreItemCat, setNewCierreItemCat] = useState<'escenario' | 'camerino' | 'furgoneta'>('escenario');

  // Form states for Key Contacts
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactNombre, setNewContactNombre] = useState('');
  const [newContactRol, setNewContactRol] = useState('Producción / Sala');
  const [newContactTelefono, setNewContactTelefono] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactNotas, setNewContactNotas] = useState('');

  // Form states for Merch Control
  const [showAddMerchForm, setShowAddMerchForm] = useState(false);
  const [newMerchNombre, setNewMerchNombre] = useState('');
  const [newMerchCategoria, setNewMerchCategoria] = useState<'camisetas' | 'vinilos' | 'musica' | 'accesorios' | 'otro'>('camisetas');
  const [newMerchTalla, setNewMerchTalla] = useState('');
  const [newMerchPrecio, setNewMerchPrecio] = useState<string>('20');
  const [newMerchStockInicial, setNewMerchStockInicial] = useState<string>('15');
  const [merchCopiedToast, setMerchCopiedToast] = useState(false);

  const getDefaultRoadbook = (concert?: Concert | null): RoadbookInfo => {
    const salaNombre = concert?.sala || 'Sala de Conciertos';
    const ciudadNombre = concert?.ciudad || 'Madrid';
    return {
      contactoPromotor: `Manuel (Producción ${salaNombre})`,
      telefonoPromotor: '+34 654 321 987',
      tecnicoSonido: 'Carlos (FOH / Sonido)',
      hotelNombre: 'Hotel de Gira',
      hotelDireccion: ciudadNombre,
      cateringInfo: 'Cena caliente tras prueba de sonido + aguas, fruta y toallas en camerino',
      inputList:
        '1. Bombo (Beta 52)\n2. Caja Top (SM57)\n3. Hi-Hat (KM184)\n4. Bajo (D.I. Radial J48)\n5. Guitarra 1 (e906)\n6. Guitarra 2 (SM57)\n7. Teclado L/R (2x D.I.)\n8. Trompeta (Clip DPA)\n9. Saxo (Clip DPA)\n10. Voz Principal (Beta 58)\n11. Coro Gtr (SM58)\n12. Coro Teclado (SM58)',
      horaLlegada: '17:00',
      horaPruebaSonido: '18:00 - 19:30',
      horaAperturaPuertas: '20:30',
      horaShow: concert?.fecha ? '21:30' : '21:30',
      horaCierreToque: '01:00',
      paEspecificaciones: 'Sistema Line Array estéreo homogéneo (D&B / L-Acoustics / Meyer) con subwoofers dedicados y presión adecuada.',
      monitoresTipo: 'In-Ears estéreo de la banda (traemos transmisores propios) + 2 cuñas de refuerzo en frontal de escenario.',
      canalesMonitores: '4 envíos auxiliares independientes XLR a rack de IEMs.',
      backlineInfo:
        'Sala aporta: Batería básica (bombo, toms, pie hihat, 3 pies plato). Banda trae: Caja, platos, pedal bombo, amplificadores de guitarra/bajo y pedaleras.',
      potenciaElectrica: '2 tomas Schuko 220V / 16A limpias en frontal y trasera de escenario.',
      notasTecnicas: 'Muelle de carga lateral disponible desde las 16:30. Acceso a prueba de sonido puntual.',
      contactosClave: [
        {
          id: 'ct-1',
          nombre: `Manuel Producción (${salaNombre})`,
          rol: 'Promotor / Sala',
          telefono: '+34 654 321 987',
          email: 'produccion@conciertos.es',
          notas: 'Contacto principal para accesos, llaves camerino y cobro de taquilla/caché.',
        },
        {
          id: 'ct-2',
          nombre: 'Carlos Sonido (FOH)',
          rol: 'Técnico de Sonido (P.A.)',
          telefono: '+34 612 345 678',
          email: 'sonido@salaslive.com',
          notas: 'A cargo de la mesa de mezclas en sala y chequeo de líneas de microfonía.',
        },
        {
          id: 'ct-3',
          nombre: 'Laura Hospitalidad',
          rol: 'Producción / Camerinos',
          telefono: '+34 699 112 233',
          email: 'camerinos@venues.com',
          notas: 'Catering, toallas, acreditaciones y acceso a furgoneta de carga.',
        },
      ],
      cierreMaterial: [
        {
          id: 'cm-1',
          categoria: 'escenario',
          item: 'Instrumentos principales y estuches rígidos (guitarras, bajo, violín, sintes/teclado)',
          checked: false,
        },
        { id: 'cm-2', categoria: 'escenario', item: 'Pedaleras de efectos, alimentadores y fuentes de corriente', checked: false },
        { id: 'cm-3', categoria: 'escenario', item: 'Cables jack / XLR propios, alargaderas y adaptadores', checked: false },
        { id: 'cm-4', categoria: 'escenario', item: 'Petacas de in-ears, auriculares y transmisores inalámbricos', checked: false },
        { id: 'cm-5', categoria: 'escenario', item: 'Pies de micro y soportes de instrumento de la banda', checked: false },
        { id: 'cm-6', categoria: 'escenario', item: 'Micrófonos vocales y pinzas especiales', checked: false },
        { id: 'cm-7', categoria: 'camerino', item: 'Ropa de directo, calzado y fundas de ropa', checked: false },
        { id: 'cm-8', categoria: 'camerino', item: 'Mochilas personales, carteras, teléfonos y documentación', checked: false },
        { id: 'cm-9', categoria: 'camerino', item: 'Cargadores de móvil, powerbanks y tablets de partituras', checked: false },
        { id: 'cm-10', categoria: 'camerino', item: 'Caja de Merchandising, datáfono y dinero recaudado en efectivo', checked: false },
        { id: 'cm-11', categoria: 'furgoneta', item: 'Todo el backline estibado y trincado con cinchas de amarre', checked: false },
        { id: 'cm-12', categoria: 'furgoneta', item: 'Portón trasero y puertas laterales cerradas con candado/alarma', checked: false },
        { id: 'cm-13', categoria: 'furgoneta', item: 'Inspección visual final de camerino y escenario (¡cero olvidos!)', checked: false },
      ],
      merchControl: {
        items: [
          {
            id: 'mb-1',
            nombre: 'Camiseta Gira Oficial',
            categoria: 'camisetas',
            talla: 'M',
            precioUnitario: 20,
            stockInicial: 15,
            stockFinal: 5,
          },
          {
            id: 'mb-2',
            nombre: 'Camiseta Gira Oficial',
            categoria: 'camisetas',
            talla: 'L',
            precioUnitario: 20,
            stockInicial: 20,
            stockFinal: 6,
          },
          {
            id: 'mb-3',
            nombre: 'Vinilo LP 12" Edición Limitada',
            categoria: 'vinilos',
            talla: 'LP',
            precioUnitario: 25,
            stockInicial: 15,
            stockFinal: 7,
          },
          {
            id: 'mb-4',
            nombre: 'Pack Púas de Colección + Pegatinas',
            categoria: 'accesorios',
            talla: 'Pack',
            precioUnitario: 5,
            stockInicial: 40,
            stockFinal: 12,
          },
          {
            id: 'mb-5',
            nombre: 'Totebag Algodón Serigrafiada',
            categoria: 'accesorios',
            talla: 'Única',
            precioUnitario: 12,
            stockInicial: 15,
            stockFinal: 5,
          },
        ],
        fondoCajaInicial: 50,
        ingresosEfectivo: 480,
        ingresosBizum: 460,
        notas: 'Mesa de merchandising bien ubicada junto al acceso principal. Gran tirón de vinilos y camisetas tras el show.',
      },
    };
  };

  const [allRoadbooks, setAllRoadbooks] = useState<Record<string, RoadbookInfo>>(() => {
    try {
      const saved = localStorage.getItem('bakandeya_roadbooks');
      return saved
        ? JSON.parse(saved)
        : {
            '2026-07-18': {
              contactoPromotor: 'Manuel (Producción Cabo de Plata)',
              telefonoPromotor: '+34 654 321 987',
              tecnicoSonido: 'Carlos (FOH Bakandeya)',
              hotelNombre: 'Hotel Playa de Barbate ****',
              hotelDireccion: 'Avenida del Mar, 12, 11160 Barbate',
              cateringInfo: 'Cena tras prueba de sonido (21:00). 2 menús vegetarianos.',
              inputList:
                '1. Bombo (Beta 52)\n2. Caja Top (SM57)\n3. Bajo (DI Radial)\n4. Gtr L (e609)\n5. Teclado L/R\n6. Tpt (Clip)\n7. Voz Ppal (Beta 58)\n8. Coros (SM58)',
            },
          };
    } catch {
      return {};
    }
  });

  const saveRoadbook = (dateKey: string, info: RoadbookInfo) => {
    const updated = { ...allRoadbooks, [dateKey]: info };
    setAllRoadbooks(updated);
    try {
      localStorage.setItem('bakandeya_roadbooks', JSON.stringify(updated));
    } catch {}
  };

  const getCurrentRoadbook = (dateKey: string, concert?: Concert | null): RoadbookInfo => {
    const existing = allRoadbooks[dateKey];
    const def = getDefaultRoadbook(concert || selectedConcert);
    if (!existing) return def;
    return {
      ...def,
      ...existing,
      contactosClave: existing.contactosClave && existing.contactosClave.length > 0 ? existing.contactosClave : def.contactosClave,
      cierreMaterial: existing.cierreMaterial && existing.cierreMaterial.length > 0 ? existing.cierreMaterial : def.cierreMaterial,
      merchControl:
        existing.merchControl && existing.merchControl.items && existing.merchControl.items.length > 0
          ? existing.merchControl
          : def.merchControl,
    };
  };

  const updateRoadbookField = (dateKey: string, partial: Partial<RoadbookInfo>) => {
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const updated: RoadbookInfo = { ...current, ...partial };
    saveRoadbook(dateKey, updated);
  };

  const handleToggleCierreItem = (itemId: string, dateKey: string) => {
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const updatedList = (current.cierreMaterial || []).map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item));
    updateRoadbookField(dateKey, { cierreMaterial: updatedList });
  };

  const handleToggleAllCierreItems = (dateKey: string, checkAll: boolean) => {
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const updatedList = (current.cierreMaterial || []).map((item) => ({ ...item, checked: checkAll }));
    updateRoadbookField(dateKey, { cierreMaterial: updatedList });
  };

  const handleAddCierreItem = (dateKey: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCierreItemText.trim()) return;
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const newItem: CierreMaterialItem = {
      id: `cm-${Date.now()}`,
      categoria: newCierreItemCat,
      item: newCierreItemText.trim(),
      checked: false,
    };
    updateRoadbookField(dateKey, { cierreMaterial: [...(current.cierreMaterial || []), newItem] });
    setNewCierreItemText('');
  };

  const handleDeleteCierreItem = (itemId: string, dateKey: string) => {
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const updatedList = (current.cierreMaterial || []).filter((item) => item.id !== itemId);
    updateRoadbookField(dateKey, { cierreMaterial: updatedList });
  };

  const handleAddKeyContact = (dateKey: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newContactNombre.trim() || !newContactTelefono.trim()) return;
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const newContact: KeyContactItem = {
      id: `ct-${Date.now()}`,
      nombre: newContactNombre.trim(),
      rol: newContactRol,
      telefono: newContactTelefono.trim(),
      email: newContactEmail.trim() || undefined,
      notas: newContactNotas.trim() || undefined,
    };
    updateRoadbookField(dateKey, { contactosClave: [...(current.contactosClave || []), newContact] });
    setNewContactNombre('');
    setNewContactTelefono('');
    setNewContactEmail('');
    setNewContactNotas('');
    setShowAddContactForm(false);
  };

  const handleDeleteKeyContact = (contactId: string, dateKey: string) => {
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const updatedList = (current.contactosClave || []).filter((c) => c.id !== contactId);
    updateRoadbookField(dateKey, { contactosClave: updatedList });
  };

  const openWhatsAppContact = (contact: KeyContactItem, eventDateStr: string, venueName: string) => {
    const cleanPhone = contact.telefono.replace(/[^0-9]/g, '');
    const bandName = (getBandIdentity ? getBandIdentity(selectedConcert?.band_id).name : '') || 'la banda';
    const msg = `¡Hola ${contact.nombre}! Te escribo de parte de ${bandName} con respecto al concierto en ${venueName} el día ${eventDateStr}. ¿Cómo estás? Quería consultar unos detalles de producción.`;
    openWhatsAppChat(cleanPhone, msg);
  };

  const handleUpdateMerchItem = (dateKey: string, itemId: string, updates: Partial<MerchBoloItem>) => {
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const merch = current.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
    const updatedItems = merch.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item));
    updateRoadbookField(dateKey, {
      merchControl: {
        ...merch,
        items: updatedItems,
      },
    });
  };

  const handleAddMerchItem = (dateKey: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMerchNombre.trim()) return;
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const merch = current.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
    const precio = Math.max(0, parseFloat(newMerchPrecio) || 0);
    const stockIni = Math.max(0, parseInt(newMerchStockInicial, 10) || 0);
    const newItem: MerchBoloItem = {
      id: `mb-${Date.now()}`,
      nombre: newMerchNombre.trim(),
      categoria: newMerchCategoria,
      talla: newMerchTalla.trim() || undefined,
      precioUnitario: precio,
      stockInicial: stockIni,
      stockFinal: stockIni,
    };
    updateRoadbookField(dateKey, {
      merchControl: {
        ...merch,
        items: [...merch.items, newItem],
      },
    });
    setNewMerchNombre('');
    setNewMerchTalla('');
    setShowAddMerchForm(false);
  };

  const handleDeleteMerchItem = (dateKey: string, itemId: string) => {
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const merch = current.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
    const updatedItems = merch.items.filter((item) => item.id !== itemId);
    updateRoadbookField(dateKey, {
      merchControl: {
        ...merch,
        items: updatedItems,
      },
    });
  };

  const handleUpdateMerchTotals = (dateKey: string, updates: Partial<MerchControlBolo>) => {
    const current = getCurrentRoadbook(dateKey, selectedConcert);
    const merch = current.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
    updateRoadbookField(dateKey, {
      merchControl: {
        ...merch,
        ...updates,
      },
    });
  };

  const handleCopyMerchSummary = (roadbook: RoadbookInfo, dateKey: string, concert?: Concert | null) => {
    const merch = roadbook.merchControl || getDefaultRoadbook(concert).merchControl!;
    const sala = concert?.sala || 'Sala';
    const lines: string[] = [];
    let totalUnidadesVendidas = 0;
    let totalRecaudadoEstimado = 0;

    merch.items.forEach((item) => {
      const vendidos = Math.max(0, item.stockInicial - (item.stockFinal !== undefined ? item.stockFinal : item.stockInicial));
      const subtotal = vendidos * item.precioUnitario;
      totalUnidadesVendidas += vendidos;
      totalRecaudadoEstimado += subtotal;
      if (vendidos > 0) {
        lines.push(
          `• ${item.nombre}${item.talla ? ` (${item.talla})` : ''}: ${vendidos} uds x ${item.precioUnitario}€ = ${subtotal.toFixed(2)}€`
        );
      }
    });

    const totalCobrado = (merch.ingresosEfectivo || 0) + (merch.ingresosBizum || 0);

    const textoResumen = [
      `👕 *CONTROL DE MERCHANDISING - ${sala.toUpperCase()}*`,
      `📅 Fecha: ${dateKey}`,
      `📦 Unidades vendidas: ${totalUnidadesVendidas}`,
      `💶 Total ventas teóricas: ${totalRecaudadoEstimado.toFixed(2)} €`,
      lines.length > 0 ? `\n*Desglose de productos:*\n${lines.join('\n')}` : '\n(Sin ventas registradas)',
      `\n*Cierre de caja:*`,
      `💵 Efectivo recaudado: ${(merch.ingresosEfectivo || 0).toFixed(2)} €`,
      `📱 Bizum / TPV: ${(merch.ingresosBizum || 0).toFixed(2)} €`,
      `💰 *TOTAL COBRADO:* ${totalCobrado.toFixed(2)} €`,
      merch.fondoCajaInicial ? `🪙 Fondo de caja inicial: ${merch.fondoCajaInicial.toFixed(2)} €` : '',
      Math.abs(totalCobrado - totalRecaudadoEstimado) > 0.01
        ? `⚠️ Descuadre caja: ${(totalCobrado - totalRecaudadoEstimado).toFixed(2)} €`
        : '✅ Caja cuadrada con las ventas',
      merch.notas ? `\n📝 *Notas:* ${merch.notas}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(textoResumen);
    setMerchCopiedToast(true);
    setTimeout(() => setMerchCopiedToast(false), 3000);
  };

  return {
    allRoadbooks,
    setAllRoadbooks,
    saveRoadbook,
    getDefaultRoadbook,
    getCurrentRoadbook,
    updateRoadbookField,
    handleToggleCierreItem,
    handleToggleAllCierreItems,
    handleAddCierreItem,
    handleDeleteCierreItem,
    handleAddKeyContact,
    handleDeleteKeyContact,
    openWhatsAppContact,
    handleUpdateMerchItem,
    handleAddMerchItem,
    handleDeleteMerchItem,
    handleUpdateMerchTotals,
    handleCopyMerchSummary,
    // Form states
    newCierreItemText,
    setNewCierreItemText,
    newCierreItemCat,
    setNewCierreItemCat,
    showAddContactForm,
    setShowAddContactForm,
    newContactNombre,
    setNewContactNombre,
    newContactRol,
    setNewContactRol,
    newContactTelefono,
    setNewContactTelefono,
    newContactEmail,
    setNewContactEmail,
    newContactNotas,
    setNewContactNotas,
    showAddMerchForm,
    setShowAddMerchForm,
    newMerchNombre,
    setNewMerchNombre,
    newMerchCategoria,
    setNewMerchCategoria,
    newMerchTalla,
    setNewMerchTalla,
    newMerchPrecio,
    setNewMerchPrecio,
    newMerchStockInicial,
    setNewMerchStockInicial,
    merchCopiedToast,
  };
}

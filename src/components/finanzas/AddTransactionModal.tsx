import React, { useState } from 'react';
import { ThemeColors, Payment } from '../../types';
import { X, Plus } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { Input, Select } from '../ui';

interface AddTransactionModalProps {
  isOpen: boolean;
  colors: ThemeColors;
  onClose: () => void;
  onAddPayment: (payment: Payment) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, colors, onClose, onAddPayment }) => {
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('ingreso');
  const [categoria, setCategoria] = useState<Payment['categoria']>('concierto');
  const [concepto, setConcepto] = useState('');
  const [importe, setImporte] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [estado, setEstado] = useState<'pendiente' | 'pagado'>('pagado');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto || !importe) return;

    setIsSubmitting(true);
    try {
      const newPayment: Payment = {
        id: 'pay-' + Date.now(),
        tipo,
        categoria,
        concepto,
        importe: parseFloat(importe) || 0,
        fecha,
        estado,
      };

      await onAddPayment(newPayment);
      onClose();
      setConcepto('');
      setImporte('');
    } catch (err) {
      console.error('Error adding payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/60 overflow-y-auto overscroll-contain animate-fadeIn">
        <div
          id="add-transaction-modal"
          className="w-full max-w-md rounded-[var(--r-l)] p-6 relative my-auto max-h-[90vh] overflow-y-auto"
          style={{
            backgroundColor: colors.card,
            color: colors.text,
          }}
        >
          <button aria-label="Cerrar"
            id="close-add-transaction-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[var(--tentative)]" />
            Nueva Transacción
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2 text-[var(--ink-2)]">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('ingreso')}
                  className={`py-2 px-4 rounded-[var(--r-pill)] text-sm font-semibold transition-ui ${
                    tipo === 'ingreso'
                      ? 'bg-[var(--ok)]/20 text-[var(--ink)]'
                      : 'bg-[var(--surface)]/40 text-[var(--ink-2)] hover:bg-[var(--surface)]'
                  }`}
                >
                  Ingreso (+€)
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('gasto')}
                  className={`py-2 px-4 rounded-[var(--r-pill)] text-sm font-semibold transition-ui ${
                    tipo === 'gasto'
                      ? 'bg-[var(--alert)]/20 text-[var(--ink)]'
                      : 'bg-[var(--surface)]/40 text-[var(--ink-2)] hover:bg-[var(--surface)]'
                  }`}
                >
                  Gasto (-€)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 text-[var(--ink-2)]">Categoría</label>
              <Select aria-label="Categoría"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Payment['categoria'])}
                wrapperClassName="w-full"
              >
                <option value="concierto">Concierto / caché</option>
                <option value="merchandising">Merchandising</option>
                <option value="subvencion">Subvención / ayuda</option>
                <option value="transporte">Transporte / gasolina</option>
                <option value="alojamiento">Alojamiento</option>
                <option value="comida">Dietas / Comida</option>
                <option value="promo">Promoción / prensa</option>
                <option value="otros">Otros</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 text-[var(--ink-2)]">Concepto / descripción</label>
              <Input
                type="text"
                required
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej. Caché Concierto Wurlitzer"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-2 text-[var(--ink-2)]">Importe (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={importe}
                  onChange={(e) => setImporte(e.target.value)}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-[var(--ink-2)]">Fecha</label>
                <Input aria-label="Fecha"
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 text-[var(--ink-2)]">Estado</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEstado('pagado')}
                  className={`py-2 px-3 rounded-[var(--r-pill)] text-xs font-semibold transition-ui ${
                    estado === 'pagado' ? 'bg-[var(--ok)]/20 text-[var(--ink)]' : 'bg-[var(--surface)]/40 text-[var(--ink-2)]'
                  }`}
                >
                  Pagado / completado
                </button>
                <button
                  type="button"
                  onClick={() => setEstado('pendiente')}
                  className={`py-2 px-3 rounded-[var(--r-pill)] text-xs font-semibold transition-ui ${
                    estado === 'pendiente' ? 'bg-[var(--acc)]/20 text-[var(--acc-ink)]' : 'bg-[var(--surface)]/40 text-[var(--ink-2)]'
                  }`}
                >
                  Pendiente / Cobro futuro
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-[var(--r-m)] font-bold bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)] transition-ui disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Transacción'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

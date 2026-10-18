// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Lead } from '../../../../types';
import { VenuePitchComposer, type VenuePitchComposerProps } from '../VenuePitchComposer';
import { TEXTO_AVISO_EMAIL } from '../../../../utils/avisoDeEmail';

const lead = (estado: string, email = 'info@sala-inexistente.test', para = email) =>
  ({
    id: 'l1',
    estado,
    email_contacto: email,
    datos_fuentes: { email_contacto: { fuente: 'ia', confianza: 'baja', en: '2026-10-18T12:00:00Z', aviso: { tipo: 'dominio_inexistente', para } } },
  }) as unknown as Lead;

const montar = (selectedLead: Lead) =>
  render(
    <VenuePitchComposer
      {...({
        isReplyStage: false,
        setShowMultiModelModal: vi.fn(),
        handleCopyPitch: vi.fn(),
        copiedPitch: false,
        setShowWhatsAppModal: vi.fn(),
        selectedLead,
        handleApprovePitchDirectly: vi.fn(),
        isCreatingDraft: false,
        activeCampaign: null,
        handleRegeneratePitchWithFeedback: vi.fn(),
        isRegeneratingPitch: false,
        editedLeadInfo: {},
        editedPitch: '',
        setEditedPitch: vi.fn(),
        setIsEditingPitch: vi.fn(),
        bandName: 'Banda',
        onUpdateLead: vi.fn(),
        isEditingPitch: false,
        handleSavePitch: vi.fn(),
      } as VenuePitchComposerProps)}
    />,
  );

afterEach(cleanup);

describe('VenuePitchComposer: aviso de email dudoso', () => {
  it('avisa antes de aprobar si el email quedó en duda', () => {
    montar(lead('pendiente_aprobacion'));
    expect(screen.getByText(TEXTO_AVISO_EMAIL)).toBeTruthy();
  });

  it('no avisa si el email se editó después del aviso', () => {
    montar(lead('pendiente_aprobacion', 'otro@sala.test', 'info@sala-inexistente.test'));
    expect(screen.queryByText(TEXTO_AVISO_EMAIL)).toBeNull();
  });

  it('no avisa cuando ya no hay nada que aprobar', () => {
    montar(lead('enviado'));
    expect(screen.queryByText(TEXTO_AVISO_EMAIL)).toBeNull();
  });
});

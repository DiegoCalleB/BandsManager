---
id: src_components_onboarding_types
title: "src/components/onboarding/types.ts"
layer: frontend
domain: system
file: "src/components/onboarding/types.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/onboarding/types.ts

> **Ubicación:** `src/components/onboarding/types.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SpotifyTrack, SpotifyAlbum, SpotifyArtist, QuickEventItem, ManualSongItem, PressQuoteItem, WizardMemberItem, WizardStepDef.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_onboarding_steps_StepEvents|src/components/onboarding/steps/StepEvents.tsx]] *(from #frontend)*
- [[src_components_onboarding_steps_StepMembers|src/components/onboarding/steps/StepMembers.tsx]] *(from #frontend)*
- [[src_components_onboarding_steps_StepMusicSetlist|src/components/onboarding/steps/StepMusicSetlist.tsx]] *(from #frontend)*
- [[src_components_onboarding_steps_StepPressProof|src/components/onboarding/steps/StepPressProof.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useEventsStep|src/components/onboarding/wizard/hooks/useEventsStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useMembersStep|src/components/onboarding/wizard/hooks/useMembersStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useMusicSetlistStep|src/components/onboarding/wizard/hooks/useMusicSetlistStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useOnboardingWizardController|src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_usePressProofStep|src/components/onboarding/wizard/hooks/usePressProofStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useWizardSteps|src/components/onboarding/wizard/hooks/useWizardSteps.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

import { describe, it, expect } from' vitest';
import { normalizePlan } from' ../../../utils/planPermissions';

describe('Onboarding Wizard Plan Gating Logic', () => {
 it('correctly identifies promo plan without booking and agent email steps', () => {
 const plan = normalizePlan('promo');
 const isPromoPlan = plan ===' promo' || plan ===' promo_plus';
 const hasBookingAccess = !isPromoPlan;
 const hasAiAgentAccess = ['local',' de_gira',' cabeza_de_cartel'].includes(plan);

 expect(isPromoPlan).toBe(true);
 expect(hasBookingAccess).toBe(false);
 expect(hasAiAgentAccess).toBe(false);
 });

 it('enables booking conditions for standard paid/active plans', () => {
 const plans = ['ensayo',' local',' de_gira',' cabeza_de_cartel'];
 for (const p of plans) {
 const plan = normalizePlan(p);
 const isPromoPlan = plan ===' promo' || plan ===' promo_plus';
 const hasBookingAccess = !isPromoPlan;
 expect(hasBookingAccess).toBe(true);
 }
 });

 it('enables AI agent steps only for tiers with agent support (local, de_gira, cabeza_de_cartel)', () => {
 expect(['local',' de_gira',' cabeza_de_cartel'].includes(normalizePlan('ensayo'))).toBe(false);
 expect(['local',' de_gira',' cabeza_de_cartel'].includes(normalizePlan('local'))).toBe(true);
 expect(['local',' de_gira',' cabeza_de_cartel'].includes(normalizePlan('de_gira'))).toBe(true);
 expect(['local',' de_gira',' cabeza_de_cartel'].includes(normalizePlan('cabeza_de_cartel'))).toBe(true);
 });
});

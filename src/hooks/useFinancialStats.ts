// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { useMemo } from 'react';
import { Payment, Concert } from '../types';
import { calculateFinancialSummary } from '../utils/financeUtils';

export function useFinancialStats(payments: Payment[], concerts: Concert[] = []) {
  return useMemo(() => {
    return calculateFinancialSummary(payments);
  }, [payments, concerts]);
}

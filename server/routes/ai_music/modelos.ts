/**
 * Identificadores de los modelos de separación de stems en Replicate.
 */

// Identificadores de modelos de Replicate (verificados y distintos)
export const REPLICATE_MODEL_DEMUCS_V4 = 'cjwbw/demucs';
export const REPLICATE_MODEL_MVSEP_MDX23 =
  'lucataco/mvsep-mdx23-music-separation';
export const REPLICATE_VERSION_MVSEP_MDX23 =
  '510b9b91aec1bfa7d634e6c06ee80c18492fb0fc06aa1474533fbda90dd3dba4';

export const REPLICATE_MODELS = {
  demucs: REPLICATE_MODEL_DEMUCS_V4,
  'mvsep-mdx23': REPLICATE_MODEL_MVSEP_MDX23,
} as const;

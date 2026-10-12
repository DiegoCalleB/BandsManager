/**
 * Webhook de Replicate para las predicciones de stems: se autentica por firma HMAC y es idempotente.
 * Fal.ai no usa webhook: sus resultados se recogen por polling (el endpoint que había no lo
 * registraba nadie y solo escribía en el log lo que le enviaran, sin firma).
 */
import express from 'express';
import { verifyReplicateWebhook, isPredictionWebhookProcessed, recordPredictionJob } from '../../services/stemPredictionReconciler.js';
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';

const router = express.Router();

/**
 * Webhook para recepcion asincrona de predicciones de Replicate con firma HMAC e idempotencia
 */
router.post(
  ['/webhooks/replicate-stems', '/api/webhooks/replicate-stems'],
  async (req, res) => {
    try {
      const webhookHeaders = {
        id: (req.headers['webhook-id'] || req.headers['webhook_id']) as
          | string
          | undefined,
        timestamp: (req.headers['webhook-timestamp'] ||
          req.headers['webhook_timestamp']) as string | undefined,
        signature: (req.headers['webhook-signature'] ||
          req.headers['webhook_signature'] ||
          req.headers['replicate-signature']) as string | undefined,
      };
      const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET;

      // 1. Fail-closed: si el secreto no está configurado, rechazar inmediatamente con 401
      if (!webhookSecret) {
        console.error(
          '[Replicate Webhook] ❌ REPLICATE_WEBHOOK_SECRET no configurado — rechazando webhook por seguridad.'
        );
        return res.status(401).json({
          error: 'REPLICATE_WEBHOOK_SECRET no configurado en el servidor',
          reason: 'secret_not_configured',
        });
      }

      const rawBody =
        // `limiteCuerpo` guarda el cuerpo crudo para verificar la firma.
        (req as typeof req & { rawBody?: Buffer }).rawBody ||
        (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      const verification = verifyReplicateWebhook(
        rawBody,
        webhookHeaders,
        webhookSecret
      );
      if (!verification.valid) {
        console.warn(
          `[Stem Webhook] ❌ Firma HMAC inválida en webhook de Replicate: ${verification.reason}`
        );
        return res
          .status(401)
          .json({ error: 'Firma HMAC inválida', reason: verification.reason });
      }

      const prediction = req.body;
      const predictionId = prediction?.id;

      if (!predictionId) {
        return res.status(400).json({ error: 'ID de predicción ausente' });
      }

      // 2. Comprobación de idempotencia por prediction_id
      const alreadyProcessed = await isPredictionWebhookProcessed(predictionId);
      if (alreadyProcessed) {
        console.log(
          `[Stem Webhook] ⚡ Webhook ${predictionId} ya procesado anteriormente (Idempotencia).`
        );
        return res.json({ status: 'already_processed', id: predictionId });
      }

      // 3. Registrar el trabajo y su estado en Supabase
      await recordPredictionJob({
        id: predictionId,
        status: prediction.status || 'processing',
        provider: 'replicate',
        webhook_received_at: new Date().toISOString(),
        webhook_signature_verified: !!webhookSecret,
        result_stems_map: prediction.output || null,
        error_message: prediction.error || null,
      });

      console.log(
        `[Stem Webhook] ✅ Webhook ${predictionId} procesado exitosamente con estado: ${prediction.status}`
      );
      return res.json({ status: 'processed', id: predictionId });
    } catch (errCapturado) {
      const err = comoErrorCapturado(errCapturado);
      console.error('[Stem Webhook] Error procesando webhook:', err);
      return res
        .status(500)
        .json({ error: err?.message || 'Error procesando webhook' });
    }
  }
);

export default router;

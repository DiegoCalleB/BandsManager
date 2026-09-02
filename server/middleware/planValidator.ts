import express from "express";

/**
 * Features access by plan
 * buskers: EPK (dossier) + Fans capture + Calendar ONLY
 *          Perfect for festival bands, simple & clean UI
 * pro: Everything (CRM, Agentes, Reels, Finanzas, Repertorio, Tours, Rehearsals, etc)
 *      For bands that want booking automation & professional tools
 */
export const PLAN_FEATURES: Record<string, string[]> = {
  buskers: ["epk", "fans", "calendar"],
  pro: ["epk", "fans", "calendar", "crm", "leads", "agentes", "repertorio", "reels", "finanzas", "tours", "rehearsals"],
};

export function createPlanMiddleware(allowedFeatures: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    const band = (req as any).band;

    if (!user || !band) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userPlan = band.plan || "free";
    const availableFeatures = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free;

    // Check if the user's plan has access to all required features
    const hasAccess = allowedFeatures.every(feature => availableFeatures.includes(feature));

    if (!hasAccess) {
      return res.status(403).json({
        error: "Feature not available in your plan",
        plan: userPlan,
        message: `Please upgrade to Pro to access this feature`,
        upgrade_url: "/api/upgrade", // Later: Stripe/Paddle link
      });
    }

    next();
  };
}

/**
 * Middleware factory that can be applied to routers
 * Example: router.use(requirePlanAccess("crm", "leads"))
 */
export function requirePlanAccess(...features: string[]) {
  return createPlanMiddleware(features);
}

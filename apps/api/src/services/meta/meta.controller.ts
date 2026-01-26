/**
 * ==================== META CONTROLLER ====================
 * Endpoints publics utilitaires
 */

import type { Request, Response, NextFunction } from 'express';
import * as metaService from './meta.service.js';

/**
 * GET /api/meta/languages
 * Liste des langues disponibles
 */
export async function getLanguages(
    _req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const languages = await metaService.listLanguages();

        return res.json({
            success: true,
            data: languages,
        });
    } catch (error) {
        next(error);
    }
}

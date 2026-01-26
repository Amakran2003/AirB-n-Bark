/**
 * ==================== META SERVICE ====================
 * Donnees publiques utilitaires
 */

import { prisma } from '../../lib/prisma.js';

export async function listLanguages() {
    return prisma.language.findMany({
        where: { isActive: true },
        select: {
            id: true,
            code: true,
            label: true,
        },
        orderBy: { label: 'asc' },
    });
}

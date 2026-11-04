/**
 * Route « Masquer / Afficher » partagée par les contenus de l'admin.
 *
 * PATCH /:id/status  { status: "published" | "draft" (| "closed") }
 *
 * Ne modifie QUE le champ status : les PUT /:id existants remplacent tout
 * l'élément (boutons d'inscription, ordre…), ils ne conviennent donc pas
 * pour une simple bascule de visibilité.
 */
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

function addStatusRoute(router, prisma, modelName, allowed = ['published', 'draft']) {
  router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    const { status } = req.body || {};
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Statut invalide (attendu : ${allowed.join(', ')})` });
    }
    try {
      const item = await prisma[modelName].update({
        where: { id: req.params.id },
        data: { status },
      });
      res.json(item);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Élément introuvable' });
      }
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = { addStatusRoute };

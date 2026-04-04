const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const socialMediaService = require('../services/social-media.service');

const prisma = new PrismaClient();

// GET all social media posts (public - only approved)
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.socialMediaPost.findMany({
      where: { status: 'approved' },
      orderBy: { publishedAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all social media posts including pending (admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, platform } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (platform) where.platform = platform;

    const posts = await prisma.socialMediaPost.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FETCH posts from specific platform (admin)
router.post('/fetch/:platform', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { platform } = req.params;
    const validPlatforms = ['youtube', 'facebook', 'instagram', 'tiktok'];
    
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    const posts = await socialMediaService.fetchPosts(platform);
    
    // Sauvegarder les nouveaux posts avec status pending
    const savedPosts = [];
    for (const post of posts) {
      // Vérifier si le post existe déjà
      const existing = await prisma.socialMediaPost.findUnique({
        where: { postId: post.postId }
      });

      if (!existing) {
        const saved = await prisma.socialMediaPost.create({
          data: {
            ...post,
            status: 'pending'
          }
        });
        savedPosts.push(saved);
      }
    }

    res.json({
      message: `Fetched ${posts.length} posts from ${platform}`,
      newPosts: savedPosts.length,
      posts: savedPosts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VALIDATE social media post (admin)
router.put('/:id/validate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const post = await prisma.socialMediaPost.update({
      where: { id: req.params.id },
      data: {
        status,
        validatedBy: req.userId,
        validatedAt: new Date()
      }
    });

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE social media post (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.socialMediaPost.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SYNC all platforms (admin) - Récupère tous les posts de toutes les plateformes
router.post('/sync-all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const platforms = ['youtube', 'facebook', 'instagram', 'tiktok'];
    const results = {};

    for (const platform of platforms) {
      try {
        const posts = await socialMediaService.fetchPosts(platform);
        let newPostsCount = 0;

        for (const post of posts) {
          const existing = await prisma.socialMediaPost.findUnique({
            where: { postId: post.postId }
          });

          if (!existing) {
            await prisma.socialMediaPost.create({
              data: {
                ...post,
                status: 'pending'
              }
            });
            newPostsCount++;
          }
        }

        results[platform] = {
          total: posts.length,
          new: newPostsCount
        };
      } catch (error) {
        results[platform] = {
          error: error.message
        };
      }
    }

    res.json({
      message: 'Sync completed',
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

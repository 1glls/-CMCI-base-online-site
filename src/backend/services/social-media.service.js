const axios = require('axios');

class SocialMediaService {
  // YouTube Data API v3
  async fetchYouTubePosts() {
    try {
      const channelId = process.env.YOUTUBE_CHANNEL_ID;
      const apiKey = process.env.YOUTUBE_API_KEY;
      
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: 'snippet',
            channelId: channelId,
            order: 'date',
            maxResults: 10,
            type: 'video',
            key: apiKey
          }
        }
      );

      return response.data.items.map(item => ({
        platform: 'youtube',
        postId: `youtube_${item.id.videoId}`,
        content: item.snippet.description,
        mediaUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        author: item.snippet.channelTitle,
        publishedAt: new Date(item.snippet.publishedAt)
      }));
    } catch (error) {
      console.error('YouTube fetch error:', error.message);
      return [];
    }
  }

  // Facebook Graph API
  async fetchFacebookPosts() {
    try {
      const pageId = process.env.FACEBOOK_PAGE_ID;
      const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
      
      if (!accessToken) {
        throw new Error('Facebook access token not configured');
      }

      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${pageId}/posts`,
        {
          params: {
            fields: 'id,message,created_time,full_picture,permalink_url',
            access_token: accessToken,
            limit: 10
          }
        }
      );

      return response.data.data.map(post => ({
        platform: 'facebook',
        postId: `facebook_${post.id}`,
        content: post.message || '',
        mediaUrl: post.permalink_url,
        thumbnailUrl: post.full_picture || null,
        author: 'CMCI Belgique',
        publishedAt: new Date(post.created_time)
      }));
    } catch (error) {
      console.error('Facebook fetch error:', error.message);
      return [];
    }
  }

  // Instagram Graph API
  async fetchInstagramPosts() {
    try {
      const userId = process.env.INSTAGRAM_USER_ID;
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      
      if (!accessToken) {
        throw new Error('Instagram access token not configured');
      }

      const response = await axios.get(
        `https://graph.instagram.com/${userId}/media`,
        {
          params: {
            fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
            access_token: accessToken,
            limit: 10
          }
        }
      );

      return response.data.data.map(post => ({
        platform: 'instagram',
        postId: `instagram_${post.id}`,
        content: post.caption || '',
        mediaUrl: post.permalink,
        thumbnailUrl: post.thumbnail_url || post.media_url,
        author: 'CMCI Belgique',
        publishedAt: new Date(post.timestamp)
      }));
    } catch (error) {
      console.error('Instagram fetch error:', error.message);
      return [];
    }
  }

  // TikTok API (utilise l'API officielle TikTok for Business)
  async fetchTikTokPosts() {
    try {
      const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
      
      if (!accessToken) {
        throw new Error('TikTok access token not configured');
      }

      // Note: L'API TikTok nécessite une app approuvée
      const response = await axios.post(
        'https://open.tiktokapis.com/v2/video/list/',
        {
          max_count: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.videos.map(video => ({
        platform: 'tiktok',
        postId: `tiktok_${video.id}`,
        content: video.title || '',
        mediaUrl: video.share_url,
        thumbnailUrl: video.cover_image_url,
        author: 'CMCI Belgique',
        publishedAt: new Date(video.create_time * 1000)
      }));
    } catch (error) {
      console.error('TikTok fetch error:', error.message);
      return [];
    }
  }

  // Fonction principale pour récupérer les posts selon la plateforme
  async fetchPosts(platform) {
    switch (platform) {
      case 'youtube':
        return await this.fetchYouTubePosts();
      case 'facebook':
        return await this.fetchFacebookPosts();
      case 'instagram':
        return await this.fetchInstagramPosts();
      case 'tiktok':
        return await this.fetchTikTokPosts();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

module.exports = new SocialMediaService();

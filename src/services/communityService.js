import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

class CommunityService {
  normalizePost(post = {}) {
    return {
      id: post.id || post._id,
      content: post.content || '',
      cropCategory: post.cropCategory || 'General',
      tags: Array.isArray(post.tags) ? post.tags : [],
      author: post.author || (post.authorId ? {
        id: post.authorId.id || post.authorId._id,
        name: post.authorId.name || 'Community Member',
        role: post.authorId.role || '',
        phone: post.authorId.phone || '',
      } : null),
      likeCount: Number(post.likeCount || post.likes?.length || 0),
      commentCount: Number(post.commentCount || post.comments?.length || 0),
      likedByMe: !!post.likedByMe,
      comments: Array.isArray(post.comments)
        ? post.comments.map((comment) => ({
            id: comment.id || comment._id,
            content: comment.content || '',
            createdAt: comment.createdAt || null,
            user: comment.user || (comment.userId ? {
              id: comment.userId.id || comment.userId._id,
              name: comment.userId.name || 'Member',
              role: comment.userId.role || '',
            } : null),
          }))
        : [],
      isPinned: !!post.isPinned,
      createdAt: post.createdAt || null,
      updatedAt: post.updatedAt || null,
    };
  }

  async getPosts(filters = {}) {
    const query = new URLSearchParams();

    if (filters.category && filters.category !== 'all') {
      query.append('category', String(filters.category));
    }
    if (filters.page) {
      query.append('page', String(filters.page));
    }
    if (filters.limit) {
      query.append('limit', String(filters.limit));
    }

    const endpoint = query.toString()
      ? `${API_ENDPOINTS.COMMUNITY.POSTS}?${query.toString()}`
      : API_ENDPOINTS.COMMUNITY.POSTS;

    const response = await apiService.get(endpoint);
    const posts = Array.isArray(response?.data) ? response.data : [];

    return {
      data: posts.map((post) => this.normalizePost(post)),
      pagination: response?.pagination || null,
      total: response?.total ?? posts.length,
    };
  }

  async createPost(payload) {
    const response = await apiService.post(API_ENDPOINTS.COMMUNITY.CREATE_POST, payload);
    return this.normalizePost(response?.data || response);
  }

  async toggleLike(postId) {
    const response = await apiService.post(API_ENDPOINTS.COMMUNITY.LIKE(postId), {});
    return {
      likedByMe: !!response?.data?.likedByMe,
      likeCount: Number(response?.data?.likeCount || 0),
    };
  }

  async addComment(postId, comment) {
    const response = await apiService.post(API_ENDPOINTS.COMMUNITY.COMMENT(postId), { comment });
    return this.normalizePost(response?.data || response);
  }
}

export default new CommunityService();

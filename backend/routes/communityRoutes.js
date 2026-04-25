const express = require('express');
const CommunityPost = require('../models/CommunityPost');

const idsEqual = (left, right) => {
    if (!left || !right) return false;
    const leftId = left._id ? String(left._id) : String(left);
    const rightId = right._id ? String(right._id) : String(right);
    return leftId === rightId;
};

const serializeCommunityPost = (post, viewerId) => {
    const likedByMe = (post.likes || []).some((userId) => idsEqual(userId, viewerId));

    return {
        id: post._id,
        content: post.content,
        cropCategory: post.cropCategory,
        tags: post.tags || [],
        author: post.authorId
            ? {
                id: post.authorId._id,
                name: post.authorId.name,
                role: post.authorId.role,
                phone: post.authorId.phone,
            }
            : null,
        likeCount: (post.likes || []).length,
        commentCount: (post.comments || []).length,
        likedByMe,
        comments: (post.comments || []).map((comment) => ({
            id: comment._id,
            content: comment.content,
            createdAt: comment.createdAt,
            user: comment.userId
                ? {
                    id: comment.userId._id,
                    name: comment.userId.name,
                    role: comment.userId.role,
                }
                : null,
        })),
        isPinned: post.isPinned,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    };
};

const createCommunityRoutes = ({ authenticateToken }) => {
    const router = express.Router();

    router.get('/posts', authenticateToken, async (req, res) => {
        try {
            const { category, page = 1, limit = 20 } = req.query;

            const query = {
                isActive: true,
            };

            if (category && category !== 'all' && category !== 'General') {
                query.cropCategory = category;
            }

            const pageNumber = Math.max(1, Number(page) || 1);
            const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
            const skip = (pageNumber - 1) * pageSize;

            const [posts, total] = await Promise.all([
                CommunityPost.find(query)
                    .populate('authorId', 'name role phone')
                    .populate('comments.userId', 'name role')
                    .sort({ isPinned: -1, createdAt: -1 })
                    .skip(skip)
                    .limit(pageSize),
                CommunityPost.countDocuments(query),
            ]);

            res.json({
                success: true,
                data: posts.map((post) => serializeCommunityPost(post, req.user._id)),
                pagination: {
                    total,
                    page: pageNumber,
                    pages: Math.ceil(total / pageSize),
                    limit: pageSize,
                },
            });
        } catch (error) {
            console.error('Get community posts error:', error);
            res.status(500).json({ message: 'Failed to fetch community posts', error: error.message });
        }
    });

    router.post('/posts', authenticateToken, async (req, res) => {
        try {
            const { content, cropCategory = 'General', tags = [] } = req.body || {};

            if (!content || String(content).trim().length < 3) {
                return res.status(400).json({ message: 'Post content must be at least 3 characters' });
            }

            const normalizedTags = Array.isArray(tags)
                ? tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
                : String(tags || '')
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .slice(0, 5);

            const post = await CommunityPost.create({
                authorId: req.user._id,
                content: String(content).trim(),
                cropCategory,
                tags: normalizedTags,
            });

            const populatedPost = await CommunityPost.findById(post._id)
                .populate('authorId', 'name role phone')
                .populate('comments.userId', 'name role');

            res.status(201).json({
                success: true,
                message: 'Post created successfully',
                data: serializeCommunityPost(populatedPost, req.user._id),
            });
        } catch (error) {
            console.error('Create community post error:', error);
            res.status(500).json({ message: 'Failed to create post', error: error.message });
        }
    });

    router.post('/posts/:postId/like', authenticateToken, async (req, res) => {
        try {
            const post = await CommunityPost.findOne({
                _id: req.params.postId,
                isActive: true,
            });

            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            const currentUserId = req.user._id;
            const alreadyLiked = (post.likes || []).some((userId) => idsEqual(userId, currentUserId));

            if (alreadyLiked) {
                post.likes = (post.likes || []).filter((userId) => !idsEqual(userId, currentUserId));
            } else {
                post.likes = [...(post.likes || []), currentUserId];
            }

            await post.save();

            res.json({
                success: true,
                message: alreadyLiked ? 'Post unliked successfully' : 'Post liked successfully',
                data: {
                    id: post._id,
                    likedByMe: !alreadyLiked,
                    likeCount: (post.likes || []).length,
                },
            });
        } catch (error) {
            console.error('Like community post error:', error);
            res.status(500).json({ message: 'Failed to like post', error: error.message });
        }
    });

    router.post('/posts/:postId/comment', authenticateToken, async (req, res) => {
        try {
            const { comment, content } = req.body || {};
            const commentText = String(comment || content || '').trim();

            if (!commentText) {
                return res.status(400).json({ message: 'Comment text is required' });
            }

            const post = await CommunityPost.findOne({
                _id: req.params.postId,
                isActive: true,
            });

            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            post.comments.push({
                userId: req.user._id,
                content: commentText,
                createdAt: new Date(),
            });
            await post.save();

            const populatedPost = await CommunityPost.findById(post._id)
                .populate('authorId', 'name role phone')
                .populate('comments.userId', 'name role');

            res.json({
                success: true,
                message: 'Comment added successfully',
                data: serializeCommunityPost(populatedPost, req.user._id),
            });
        } catch (error) {
            console.error('Comment community post error:', error);
            res.status(500).json({ message: 'Failed to comment on post', error: error.message });
        }
    });

    return router;
};

module.exports = { createCommunityRoutes };

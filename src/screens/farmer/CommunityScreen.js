import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import communityService from '../../services/communityService';
import Button from '../../components/common/Button';
import { formatRelativeTime } from '../../utils/formatters';

const CATEGORY_FILTERS = ['all', 'General', 'Grains', 'Vegetables', 'Fruits', 'Pulses', 'Spices', 'Other'];

const CommunityScreen = () => {
  const isFocused = useIsFocused();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [postCategory, setPostCategory] = useState('General');
  const [newPost, setNewPost] = useState('');
  const [commentDraftByPost, setCommentDraftByPost] = useState({});

  const loadPosts = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await communityService.getPosts({
        category: selectedCategory,
        limit: 40,
      });
      setPosts(response?.data || []);
    } catch (loadError) {
      console.error('Community posts load error:', loadError);
      setError(loadError.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (isFocused) {
      loadPosts();
    }
  }, [isFocused, loadPosts]);

  useEffect(() => {
    if (!loading) {
      loadPosts(false);
    }
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts(false);
  }, [loadPosts]);

  const postCountLabel = useMemo(() => {
    if (!posts.length) return 'No posts yet';
    return `${posts.length} post${posts.length === 1 ? '' : 's'}`;
  }, [posts.length]);

  const submitPost = async () => {
    if (!newPost.trim()) {
      Alert.alert('Community', 'Please write something before posting.');
      return;
    }

    setPosting(true);
    try {
      const createdPost = await communityService.createPost({
        content: newPost.trim(),
        cropCategory: postCategory,
      });

      setPosts((prev) => [createdPost, ...prev]);
      setNewPost('');
      Alert.alert('Community', 'Post shared successfully.');
    } catch (createError) {
      console.error('Create post error:', createError);
      Alert.alert('Community', createError.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId) => {
    const currentPost = posts.find((post) => post.id === postId);
    if (!currentPost) return;

    const optimisticLiked = !currentPost.likedByMe;
    const optimisticCount = Math.max(0, currentPost.likeCount + (optimisticLiked ? 1 : -1));

    setPosts((prev) => prev.map((post) => (
      post.id === postId
        ? { ...post, likedByMe: optimisticLiked, likeCount: optimisticCount }
        : post
    )));

    try {
      const likeState = await communityService.toggleLike(postId);
      setPosts((prev) => prev.map((post) => (
        post.id === postId
          ? { ...post, likedByMe: likeState.likedByMe, likeCount: likeState.likeCount }
          : post
      )));
    } catch (errorLike) {
      console.error('Toggle like error:', errorLike);
      setPosts((prev) => prev.map((post) => (
        post.id === postId
          ? { ...post, likedByMe: currentPost.likedByMe, likeCount: currentPost.likeCount }
          : post
      )));
      Alert.alert('Community', errorLike.message || 'Failed to update like');
    }
  };

  const submitComment = async (postId) => {
    const commentText = (commentDraftByPost[postId] || '').trim();
    if (!commentText) {
      Alert.alert('Community', 'Please write a comment first.');
      return;
    }

    try {
      const updatedPost = await communityService.addComment(postId, commentText);
      setPosts((prev) => prev.map((post) => (post.id === postId ? updatedPost : post)));
      setCommentDraftByPost((prev) => ({
        ...prev,
        [postId]: '',
      }));
    } catch (errorComment) {
      console.error('Add comment error:', errorComment);
      Alert.alert('Community', errorComment.message || 'Failed to add comment');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading community posts...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.composeCard}>
        <Text style={styles.composeTitle}>Community Forum</Text>
        <Text style={styles.composeDescription}>
          Ask questions, share updates, and connect with farmers, traders, and transport partners.
        </Text>

        <TextInput
          style={styles.composeInput}
          multiline
          numberOfLines={4}
          placeholder="Share your farming update or ask the community..."
          placeholderTextColor={Colors.textSecondary}
          value={newPost}
          onChangeText={setNewPost}
          maxLength={500}
          textAlignVertical="top"
        />

        <Text style={styles.inputCounter}>{newPost.length}/500</Text>

        <View style={styles.chipsWrap}>
          {CATEGORY_FILTERS.filter((category) => category !== 'all').map((category) => {
            const selected = postCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => setPostCategory(category)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{category}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title="Post to Community"
          icon="campaign"
          onPress={submitPost}
          loading={posting}
          fullWidth
        />
      </View>

      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Discussion Feed</Text>
        <Text style={styles.feedCount}>{postCountLabel}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {CATEGORY_FILTERS.map((category) => {
          const selected = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              style={[styles.filterChip, selected && styles.filterChipActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                {category === 'all' ? 'All Topics' : category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {posts.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="forum" size={30} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No discussions yet</Text>
          <Text style={styles.emptyText}>Be the first to start a useful conversation.</Text>
        </View>
      ) : (
        posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postAvatar}>
                <MaterialIcons name="person" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.postMeta}>
                <Text style={styles.postAuthor}>{post.author?.name || 'Community Member'}</Text>
                <Text style={styles.postSubMeta}>
                  {post.author?.role || 'member'} • {formatRelativeTime(post.createdAt)}
                </Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{post.cropCategory}</Text>
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post.id)}>
                <MaterialIcons
                  name={post.likedByMe ? 'favorite' : 'favorite-border'}
                  size={18}
                  color={post.likedByMe ? '#D32F2F' : Colors.textSecondary}
                />
                <Text style={styles.actionText}>{post.likeCount}</Text>
              </TouchableOpacity>

              <View style={styles.actionBtn}>
                <MaterialIcons name="chat-bubble-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.actionText}>{post.commentCount}</Text>
              </View>
            </View>

            {!!post.comments?.length && (
              <View style={styles.commentsBlock}>
                {post.comments.slice(-2).map((comment) => (
                  <View key={comment.id} style={styles.commentRow}>
                    <Text style={styles.commentAuthor}>{comment.user?.name || 'Member'}:</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment"
                placeholderTextColor={Colors.textSecondary}
                value={commentDraftByPost[post.id] || ''}
                onChangeText={(value) => setCommentDraftByPost((prev) => ({ ...prev, [post.id]: value }))}
              />
              <TouchableOpacity style={styles.commentSend} onPress={() => submitComment(post.id)}>
                <MaterialIcons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {!!error && (
        <View style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={18} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  composeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    marginBottom: 12,
  },
  composeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  composeDescription: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  composeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
  },
  inputCounter: {
    marginTop: 5,
    alignSelf: 'flex-end',
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: '#F7F7F7',
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#E8F5E9',
  },
  chipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.primary,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 2,
  },
  feedTitle: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '700',
  },
  feedCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterRow: {
    marginBottom: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#E8F5E9',
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postMeta: {
    flex: 1,
    marginLeft: 8,
  },
  postAuthor: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700',
  },
  postSubMeta: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  categoryBadge: {
    borderWidth: 1,
    borderColor: '#C8E6C9',
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  postContent: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  commentsBlock: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
    marginBottom: 8,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
    marginRight: 4,
  },
  commentText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    color: Colors.text,
    fontSize: 12,
  },
  commentSend: {
    marginLeft: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    marginLeft: 8,
    color: Colors.error,
    fontSize: 12,
    flex: 1,
  },
});

export default CommunityScreen;
const express = require('express');
const { 
  getFeed, toggleLike, toggleSave, createPost, getExploreFeed, 
  getHashtagPosts, getTrendingHashtags, getUserPosts, getPostById,
  editPost, deletePost, archivePost, pinPost, updatePostSettings, reportPost, hidePost, getPostLikes
} = require('../controllers/postController');
const { addComment, getComments, deleteComment, editComment, likeComment, pinComment, reportComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected Routes
router.use(protect);
router.get('/feed', getFeed);
router.get('/explore', getExploreFeed);
router.get('/trending-hashtags', getTrendingHashtags);
router.get('/hashtag/:tag', getHashtagPosts);
router.get('/user/:id', getUserPosts);
router.post('/', createPost);
router.get('/:id', getPostById);
router.put('/:id', editPost);
router.delete('/:id', deletePost);
router.put('/:id/archive', archivePost);
router.put('/:id/pin', pinPost);
router.put('/:id/settings', updatePostSettings);
router.post('/:id/report', reportPost);
router.post('/:id/hide', hidePost);

router.post('/:id/like', toggleLike);
router.get('/:id/likes', getPostLikes);
router.post('/:id/save', toggleSave);

// Comments
router.get('/:postId/comments', getComments);
router.post('/:postId/comments', addComment);
router.put('/:postId/comments/:commentId', editComment);
router.delete('/:postId/comments/:commentId', deleteComment);
router.put('/:postId/comments/:commentId/like', likeComment);
router.put('/:postId/comments/:commentId/pin', pinComment);
router.post('/:postId/comments/:commentId/report', reportComment);

module.exports = router;

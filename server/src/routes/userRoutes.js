const express = require('express');
const { 
  getUserProfile, updateUserProfile, getSavedPosts, followUser, unfollowUser, 
  getFollowers, removeFollower, getFollowing, getUserByUsername, getPopularCreators,
  acceptFollowRequest, declineFollowRequest, getMutualFollowers,
  toggleBlockUser, toggleRestrictUser, toggleMuteUser, toggleCloseFriend,
  reportUser, hideUserContent, requestVerification,
  cancelFollowRequest, getFollowRequests, getSuggestedUsers, deleteAccount
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all user routes
router.use(protect);

router.delete('/me', deleteAccount);
router.get('/popular', getPopularCreators);
router.get('/suggested', getSuggestedUsers);
router.get('/saved-posts', getSavedPosts);
router.get('/username/:username', getUserByUsername);
router.get('/follow-requests', getFollowRequests);
router.post('/follow-requests/:id/accept', acceptFollowRequest);
router.post('/follow-requests/:id/decline', declineFollowRequest);
router.delete('/follow-requests/:id/cancel', cancelFollowRequest);
router.post('/verification-request', requestVerification);
router.put('/update', updateUserProfile);

// Routes with /:id at the top level
router.get('/:id', getUserProfile);
router.post('/:id/follow', followUser);
router.delete('/:id/follow', unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/:id/mutual-followers', getMutualFollowers);
router.delete('/followers/:followerId', removeFollower);
router.post('/:id/block', toggleBlockUser);
router.post('/:id/restrict', toggleRestrictUser);
router.post('/:id/mute', toggleMuteUser);
router.post('/:id/close-friends', toggleCloseFriend);
router.post('/:id/report', reportUser);
router.post('/:id/hide-content', hideUserContent);

module.exports = router;

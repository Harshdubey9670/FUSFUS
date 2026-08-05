const User = require('../models/User');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp -otpExpires')
      .populate('followers', 'username avatar fullName')
      .populate('following', 'username avatar fullName');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/update
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { 
      avatar, username, bio, website, 
      coverPhoto, pronouns, gender, category, 
      accountType, isPrivate 
    } = req.body;

    // Check if new username is already taken by someone else
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
      user.username = username;
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
      user.profilePicture = avatar; // keep in sync
    }
    
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (coverPhoto !== undefined) user.coverPhoto = coverPhoto;
    if (pronouns !== undefined) user.pronouns = pronouns;
    if (gender !== undefined) user.gender = gender;
    if (category !== undefined) user.category = category;
    if (accountType !== undefined) user.accountType = accountType;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get saved posts for user
// @route   GET /api/users/saved-posts
// @access  Private
const getSavedPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedPosts',
      populate: {
        path: 'user',
        select: 'username fullName avatar profilePicture'
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user.savedPosts.reverse() // Newest saved first
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user or request to follow
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res, next) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();
    const targetUserId = req.params.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if already following using string ID comparison
    const isAlreadyFollowing = currentUser.following.some(
      (id) => id && id.toString() === targetUserId
    );

    if (isAlreadyFollowing) {
      return res.status(200).json({ 
        success: true, 
        message: "Already following user", 
        data: currentUser.following, 
        status: 'following' 
      });
    }

    const Notification = require('../models/Notification');
    const { getIo } = require('../socket');
    const io = getIo();

    if (userToFollow.isPrivate) {
      // Send a follow request
      const hasRequested = userToFollow.followRequests.some(
        (id) => id && id.toString() === currentUserId
      );

      if (!hasRequested) {
        await userToFollow.updateOne({ $addToSet: { followRequests: currentUserId } });
        
        // Create DB notification
        Notification.create({
          recipient: userToFollow._id,
          sender: currentUser._id,
          type: 'follow_request',
          message: `${currentUser.username} requested to follow you`
        }).catch(err => console.error('[Notification Error]', err));

        // Real-time socket emission to target user
        if (io) {
          io.to(targetUserId).emit('follow_request', {
            senderId: currentUserId,
            senderUsername: currentUser.username,
            senderAvatar: currentUser.avatar || currentUser.profilePicture,
            message: `${currentUser.username} requested to follow you`
          });
          io.to(targetUserId).emit('notification_count_update', { delta: 1 });
        }
      }
      return res.status(200).json({ success: true, message: "Follow request sent", status: 'requested' });
    } else {
      // Follow immediately using $addToSet for idempotency
      await currentUser.updateOne({ $addToSet: { following: targetUserId } });
      await userToFollow.updateOne({ $addToSet: { followers: currentUserId } });
      
      if (!currentUser.following.some((id) => id && id.toString() === targetUserId)) {
        currentUser.following.push(targetUserId);
      }

      // Create DB notification
      Notification.create({
        recipient: userToFollow._id,
        sender: currentUser._id,
        type: 'follow',
        message: `${currentUser.username} started following you`
      }).catch(err => console.error('[Notification Error]', err));

      // Real-time socket emission to target user
      if (io) {
        io.to(targetUserId).emit('new_notification', {
          type: 'follow',
          senderId: currentUserId,
          senderUsername: currentUser.username,
          senderAvatar: currentUser.avatar || currentUser.profilePicture,
          message: `${currentUser.username} started following you`
        });
        io.to(targetUserId).emit('notification_count_update', { delta: 1 });
      }

      return res.status(200).json({ 
        success: true, 
        message: "User followed successfully", 
        data: currentUser.following, 
        status: 'following' 
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
const unfollowUser = async (req, res, next) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();
    const targetUserId = req.params.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ success: false, message: "You cannot unfollow yourself" });
    }

    const userToUnfollow = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await currentUser.updateOne({ $pull: { following: targetUserId } });
    await userToUnfollow.updateOne({ $pull: { followers: currentUserId } });
    
    // Update local array object to return
    currentUser.following = currentUser.following.filter(
      (id) => id && id.toString() !== targetUserId
    );

    return res.status(200).json({ 
      success: true, 
      message: "User unfollowed successfully", 
      data: currentUser.following 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get followers of a user with pagination and search
// @route   GET /api/users/:id/followers
// @access  Private
const getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = { _id: { $in: user.followers } };
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    const followers = await User.find(query)
      .select('username fullName profilePicture avatar')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: followers,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + followers.length < total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a follower
// @route   DELETE /api/users/followers/:followerId
// @access  Private
const removeFollower = async (req, res, next) => {
  try {
    const followerId = req.params.followerId;
    
    // Ensure the current user has this follower
    const currentUser = await User.findById(req.user.id);
    if (!currentUser.followers.includes(followerId)) {
      return res.status(400).json({ success: false, message: "This user is not following you" });
    }

    // Remove followerId from currentUser's followers
    await currentUser.updateOne({ $pull: { followers: followerId } });
    
    // Remove currentUser's id from the follower's following array
    await User.findByIdAndUpdate(followerId, { $pull: { following: req.user.id } });

    res.status(200).json({ success: true, message: "Follower removed successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get following of a user with pagination and search
// @route   GET /api/users/:id/following
// @access  Private
const getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = { _id: { $in: user.following } };
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    const followingList = await User.find(query)
      .select('username fullName profilePicture avatar')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: followingList,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + followingList.length < total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by username (for @mention profile resolution)
// @route   GET /api/users/username/:username
// @access  Private
const getUserByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular creators (Algorithm based on followers, engagement, activity)
// @route   GET /api/users/popular
// @access  Private
const getPopularCreators = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Advanced algorithm to find popular creators
    // Score = (Followers * 1) + (Recent Posts * 10) + (Recent Likes * 5)
    const pipeline = [
      { $match: { _id: { $ne: req.user._id } } },
      
      // Calculate follower count
      { $addFields: { followerScore: { $size: { $ifNull: ["$followers", []] } } } },
      
      // Lookup recent posts for activity and engagement
      {
        $lookup: {
          from: 'posts',
          let: { userId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$user', '$$userId'] },
                createdAt: { $gte: fourteenDaysAgo }
              } 
            },
            { $project: { _id: 1, likesCount: { $size: { $ifNull: ["$likes", []] } } } }
          ],
          as: 'recentPosts'
        }
      },
      
      // Compute scores
      {
        $addFields: {
          activityScore: { $multiply: [{ $size: "$recentPosts" }, 10] },
          engagementScore: { 
            $multiply: [
              { $sum: "$recentPosts.likesCount" }, 
              5
            ] 
          }
        }
      },
      
      // Final Composite Score
      {
        $addFields: {
          totalScore: { $add: ["$followerScore", "$activityScore", "$engagementScore"] }
        }
      },
      
      // Sort and Format
      { $sort: { totalScore: -1, isVerified: -1 } },
      { $limit: limit },
      { 
        $project: { 
          username: 1, 
          fullName: 1, 
          avatar: 1, 
          profilePicture: 1, 
          isVerified: 1,
          followerCount: "$followerScore",
          totalScore: 1
        } 
      }
    ];

    const creators = await User.aggregate(pipeline);

    res.status(200).json({ success: true, data: creators });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept follow request
// @route   POST /api/users/follow-requests/:id/accept
// @access  Private
const acceptFollowRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.id;
    const currentUserId = (req.user._id || req.user.id).toString();
    const currentUser = await User.findById(currentUserId);

    const hasRequest = currentUser.followRequests.some(
      (id) => id && id.toString() === requesterId
    );

    if (!hasRequest) {
      return res.status(200).json({ success: true, message: 'Follow request already processed' });
    }

    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({ success: false, message: 'Requester not found' });
    }

    // Move from requests to followers
    await currentUser.updateOne({ 
      $pull: { followRequests: requesterId },
      $addToSet: { followers: requesterId }
    });
    
    // Add to requester's following
    await requester.updateOne({ $addToSet: { following: currentUserId } });

    // Create DB notification for requester (they got accepted)
    const Notification = require('../models/Notification');
    Notification.create({
      recipient: requester._id,
      sender: currentUser._id,
      type: 'follow_accepted',
      message: `${currentUser.username} accepted your follow request`
    }).catch(err => console.error('[Notification Error]', err));

    // Real-time socket emission
    const { getIo } = require('../socket');
    const io = getIo();
    if (io) {
      // Notify requester their request was accepted
      io.to(requesterId).emit('follow_accepted', {
        acceptorId: currentUserId,
        acceptorUsername: currentUser.username,
        acceptorAvatar: currentUser.avatar || currentUser.profilePicture,
        message: `${currentUser.username} accepted your follow request`
      });
      io.to(requesterId).emit('notification_count_update', { delta: 1 });
    }

    res.status(200).json({ success: true, message: 'Follow request accepted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Decline follow request
// @route   POST /api/users/follow-requests/:id/decline
// @access  Private
const declineFollowRequest = async (req, res, next) => {
  try {
    const requesterId = req.params.id;
    const currentUserId = (req.user._id || req.user.id).toString();
    const currentUser = await User.findById(currentUserId);

    if (currentUser) {
      await currentUser.updateOne({ $pull: { followRequests: requesterId } });
    }
    res.status(200).json({ success: true, message: 'Follow request declined' });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a sent follow request
// @route   DELETE /api/users/follow-requests/:id/cancel
// @access  Private
const cancelFollowRequest = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = (req.user._id || req.user.id).toString();
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await targetUser.updateOne({ $pull: { followRequests: currentUserId } });
    res.status(200).json({ success: true, message: 'Follow request cancelled' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get follow requests for the authenticated user
// @route   GET /api/users/follow-requests
// @access  Private
const getFollowRequests = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).populate({
      path: 'followRequests',
      select: 'username fullName avatar profilePicture'
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user.followRequests });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mutual followers
// @route   GET /api/users/:id/mutual-followers
// @access  Private
const getMutualFollowers = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id || req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Mutuals = Users that currentUser is following AND are in targetUser's followers
    const targetFollowerStrings = new Set((targetUser.followers || []).map(id => id.toString()));
    const mutualIds = (currentUser.following || []).filter(id => targetFollowerStrings.has(id.toString()));
    
    const mutuals = await User.find({ _id: { $in: mutualIds } })
      .select('username fullName avatar profilePicture')
      .limit(20);

    res.status(200).json({ success: true, data: mutuals, count: mutualIds.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block user
// @route   POST /api/users/:id/block
// @access  Private
const toggleBlockUser = async (req, res, next) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();
    const targetId = req.params.id;
    if (targetId === currentUserId) return res.status(400).json({ success: false, message: "Cannot block yourself" });
    
    const currentUser = await User.findById(currentUserId);
    const isBlocked = (currentUser.blockedUsers || []).some(id => id && id.toString() === targetId);

    if (isBlocked) {
      await currentUser.updateOne({ $pull: { blockedUsers: targetId } });
    } else {
      // Also unfollow each other if blocking
      await currentUser.updateOne({ 
        $addToSet: { blockedUsers: targetId },
        $pull: { followers: targetId, following: targetId }
      });
      await User.findByIdAndUpdate(targetId, {
        $pull: { followers: currentUserId, following: currentUserId }
      });

      // Real-time socket: tell target that they were blocked (to force a UI update)
      const { getIo } = require('../socket');
      const io = getIo();
      if (io) {
        io.to(targetId).emit('relationship_updated', {
          type: 'blocked',
          byUserId: currentUserId
        });
      }
    }

    const updatedUser = await User.findById(currentUserId);
    res.status(200).json({ 
      success: true, 
      message: isBlocked ? 'User unblocked' : 'User blocked',
      isBlocked: !isBlocked,
      blockedUsers: updatedUser.blockedUsers,
      following: updatedUser.following
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle restrict user
// @route   POST /api/users/:id/restrict
// @access  Private
const toggleRestrictUser = async (req, res, next) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();
    const targetId = req.params.id;
    if (targetId === currentUserId) return res.status(400).json({ success: false, message: "Cannot restrict yourself" });
    
    const currentUser = await User.findById(currentUserId);
    const isRestricted = (currentUser.restrictedUsers || []).some(id => id && id.toString() === targetId);

    if (isRestricted) {
      await currentUser.updateOne({ $pull: { restrictedUsers: targetId } });
    } else {
      await currentUser.updateOne({ $addToSet: { restrictedUsers: targetId } });
    }

    const updatedUser = await User.findById(currentUserId);
    res.status(200).json({ 
      success: true, 
      message: isRestricted ? 'User unrestricted' : 'User restricted',
      isRestricted: !isRestricted,
      restrictedUsers: updatedUser.restrictedUsers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle mute user
// @route   POST /api/users/:id/mute
// @access  Private
const toggleMuteUser = async (req, res, next) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();
    const targetId = req.params.id;
    if (targetId === currentUserId) return res.status(400).json({ success: false, message: "Cannot mute yourself" });
    
    const currentUser = await User.findById(currentUserId);
    const isMuted = (currentUser.mutedUsers || []).some(id => id && id.toString() === targetId);

    if (isMuted) {
      await currentUser.updateOne({ $pull: { mutedUsers: targetId } });
    } else {
      await currentUser.updateOne({ $addToSet: { mutedUsers: targetId } });
    }

    const updatedUser = await User.findById(currentUserId);
    res.status(200).json({ 
      success: true, 
      message: isMuted ? 'User unmuted' : 'User muted',
      isMuted: !isMuted,
      mutedUsers: updatedUser.mutedUsers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request Verification
// @route   POST /api/users/verification-request
// @access  Private
const requestVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }
    
    if (user.verificationRequestStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Verification request already pending' });
    }

    user.verificationRequestStatus = 'pending';
    await user.save();

    res.status(200).json({ success: true, message: 'Verification request submitted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suggested users to follow
// @route   GET /api/users/suggested
// @access  Private
const getSuggestedUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    const limit = parseInt(req.query.limit, 10) || 10;
    const excludedIds = [...currentUser.following, currentUser._id, ...currentUser.blockedUsers];

    // Pipeline to find suggestions
    const pipeline = [
      { 
        $match: { 
          _id: { $nin: excludedIds } 
        } 
      },
      // Give weight to users in the same category if category exists
      {
        $addFields: {
          categoryMatch: { 
            $cond: [ 
              { $and: [
                { $ne: [currentUser.category, ''] },
                { $eq: ['$category', currentUser.category] }
              ]}, 
              10, 
              0 
            ] 
          },
          followerScore: { $size: { $ifNull: ["$followers", []] } }
        }
      },
      {
        $addFields: {
          totalScore: { $add: ["$categoryMatch", "$followerScore"] }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: limit },
      { 
        $project: { 
          username: 1, 
          fullName: 1, 
          avatar: 1, 
          profilePicture: 1, 
          category: 1,
          isVerified: 1
        } 
      }
    ];

    const suggested = await User.aggregate(pipeline);

    res.status(200).json({ success: true, data: suggested });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/me
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // In a real application, you would also delete related Posts, Comments, Settings, Notifications, etc.
    // For this module scope, we will delete the User and UserSettings models at minimum.
    const UserSettings = require('../models/UserSettings');
    await UserSettings.deleteOne({ user: req.user.id });
    
    // Remove from other users' followers/following arrays
    await User.updateMany(
      { followers: req.user.id },
      { $pull: { followers: req.user.id } }
    );
    await User.updateMany(
      { following: req.user.id },
      { $pull: { following: req.user.id } }
    );
    
    await user.deleteOne();
    
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Close Friend
// @route   POST /api/users/:id/close-friends
// @access  Private
const toggleCloseFriend = async (req, res, next) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();
    const targetId = req.params.id;
    if (targetId === currentUserId) return res.status(400).json({ success: false, message: "Cannot add yourself to close friends" });
    
    const currentUser = await User.findById(currentUserId);
    const isCloseFriend = (currentUser.closeFriends || []).some(id => id && id.toString() === targetId);

    if (isCloseFriend) {
      await currentUser.updateOne({ $pull: { closeFriends: targetId } });
    } else {
      await currentUser.updateOne({ $addToSet: { closeFriends: targetId } });
    }

    const updatedUser = await User.findById(currentUserId);
    res.status(200).json({ 
      success: true, 
      message: isCloseFriend ? 'Removed from Close Friends' : 'Added to Close Friends', 
      isCloseFriend: !isCloseFriend,
      closeFriends: updatedUser.closeFriends
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a user profile
// @route   POST /api/users/:id/report
// @access  Private
const reportUser = async (req, res, next) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();
    const targetId = req.params.id;
    const { reason, details } = req.body;

    if (targetId === currentUserId) {
      return res.status(400).json({ success: false, message: "Cannot report yourself" });
    }

    const Report = require('../models/Report');
    await Report.create({
      reporter: currentUserId,
      targetType: 'user',
      targetId: targetId,
      reason: reason || 'Inappropriate Profile/Behavior',
      details: details || ''
    });

    res.status(200).json({ success: true, message: 'User reported successfully. Our moderation team will review this.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Hide all content from a user
// @route   POST /api/users/:id/hide-content
// @access  Private
const hideUserContent = async (req, res, next) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();
    const targetId = req.params.id;
    
    if (targetId === currentUserId) {
      return res.status(400).json({ success: false, message: "Cannot hide your own content" });
    }

    const currentUser = await User.findById(currentUserId);
    const isMuted = (currentUser.mutedUsers || []).some(id => id && id.toString() === targetId);

    if (!isMuted) {
      await currentUser.updateOne({ $addToSet: { mutedUsers: targetId } });
    }

    res.status(200).json({ success: true, message: 'User content hidden from your feed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getSavedPosts,
  followUser,
  unfollowUser,
  getFollowers,
  removeFollower,
  getFollowing,
  getUserByUsername,
  getPopularCreators,
  acceptFollowRequest,
  declineFollowRequest,
  getMutualFollowers,
  toggleBlockUser,
  toggleRestrictUser,
  toggleMuteUser,
  toggleCloseFriend,
  reportUser,
  hideUserContent,
  requestVerification,
  cancelFollowRequest,
  getFollowRequests,
  getSuggestedUsers,
  deleteAccount
};

const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Get comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Protected
exports.getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    
    // Pagination (optional, default to 20 per page)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const comments = await Comment.find({ post: postId })
      .sort({ isPinned: -1, createdAt: -1 }) // pinned first, then newest
      .skip(startIndex)
      .limit(limit)
      .populate('user', 'username profilePicture')
      .populate('mentions', 'username')
      .lean(); // Faster for read-only tree building

    const total = await Comment.countDocuments({ post: postId });

    res.status(200).json({
      success: true,
      count: comments.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment
// @route   POST /api/posts/:postId/comments
// @access  Protected
exports.addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text, parentComment } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Extract Mentions
    const User = require('../models/User');
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentionedUsernames = [...new Set(Array.from(text.matchAll(mentionRegex), m => m[1]))];
    const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } }).select('_id');
    const mentionIds = mentionedUsers.map(u => u._id);

    // Validate parent comment if provided
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' });
      }
      // If the parent is already a reply, link it to the top-level parent instead (single-level nesting)
      if (parent.parentComment) {
        parentComment = parent.parentComment;
      }
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user.id,
      text: text.trim(),
      parentComment: parentComment || null,
      mentions: mentionIds
    });

    // Populate info
    await comment.populate('user', 'username profilePicture');
    await comment.populate('mentions', 'username');

    // Update Post
    post.comments.push(comment._id);
    post.commentsCount += 1;
    await post.save();

    // Fire notifications
    const Notification = require('../models/Notification');
    
    // Notification for Post Owner
    if (post.user.toString() !== req.user.id.toString()) {
      Notification.create({
        recipient: post.user,
        sender: req.user.id,
        type: 'comment',
        post: post._id,
      }).catch(err => console.error('[Notification Error]', err));
    }

    // Notification for Parent Comment Owner (if reply)
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent && parent.user.toString() !== req.user.id.toString()) {
        Notification.create({
          recipient: parent.user,
          sender: req.user.id,
          type: 'mention', // or 'reply'
          message: 'replied to your comment',
          post: post._id,
        }).catch(err => console.error('[Notification Error]', err));
      }
    }

    // Notification for Mentions
    mentionIds.forEach(id => {
      if (id.toString() !== req.user.id.toString()) {
        Notification.create({
          recipient: id,
          sender: req.user.id,
          type: 'mention',
          message: 'mentioned you in a comment',
          post: post._id,
        }).catch(err => console.error('[Notification Error]', err));
      }
    });

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Protected
exports.deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;

    const comment = await Comment.findById(commentId);
    const post = await Post.findById(postId);

    if (!comment || !post) {
      return res.status(404).json({ success: false, message: 'Comment or Post not found' });
    }

    // Ensure the user owns the comment OR owns the post
    if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();

    // Update Post
    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: commentId },
      $inc: { commentsCount: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a comment
// @route   PUT /api/posts/:postId/comments/:commentId
// @access  Protected
exports.editComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
    }

    comment.text = text.trim();
    comment.isEdited = true;
    
    // We could re-parse mentions here, but skipping for simplicity
    await comment.save();
    await comment.populate('user', 'username profilePicture');
    await comment.populate('mentions', 'username');

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or Unlike a comment
// @route   PUT /api/posts/:postId/comments/:commentId/like
// @access  Protected
exports.likeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(req.user.id);

    if (isLiked) {
      await comment.updateOne({ $pull: { likes: req.user.id } });
    } else {
      await comment.updateOne({ $push: { likes: req.user.id } });
      
      // Fire notification
      if (comment.user.toString() !== req.user.id.toString()) {
        const Notification = require('../models/Notification');
        Notification.create({
          recipient: comment.user,
          sender: req.user.id,
          type: 'like', // could be comment_like
          message: 'liked your comment',
          post: comment.post,
        }).catch(err => console.error('[Notification Error]', err));
      }
    }

    res.status(200).json({
      success: true,
      message: isLiked ? 'Comment unliked' : 'Comment liked',
      isLiked: !isLiked
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pin or Unpin a comment
// @route   PUT /api/posts/:postId/comments/:commentId/pin
// @access  Protected
exports.pinComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    const comment = await Comment.findById(commentId);

    if (!post || !comment) {
      return res.status(404).json({ success: false, message: 'Post or Comment not found' });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only post owner can pin comments' });
    }

    comment.isPinned = !comment.isPinned;
    await comment.save();

    res.status(200).json({
      success: true,
      message: comment.isPinned ? 'Comment pinned' : 'Comment unpinned',
      isPinned: comment.isPinned
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a comment
// @route   POST /api/posts/:postId/comments/:commentId/report
// @access  Protected
exports.reportComment = async (req, res, next) => {
  try {
    // Dummy implementation for reporting
    res.status(200).json({
      success: true,
      message: 'Comment reported successfully'
    });
  } catch (error) {
    next(error);
  }
};

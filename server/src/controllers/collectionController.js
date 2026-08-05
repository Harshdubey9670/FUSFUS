const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Get all collections for logged-in user
// @route   GET /api/collections
// @access  Private
const getCollections = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('collections savedPosts')
      .populate({
        path: 'collections.posts',
        select: 'media',
        options: { limit: 1 }
      })
      .populate({
        path: 'savedPosts',
        select: 'media',
        options: { limit: 1 }
      });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Build "All Posts" virtual collection as first item
    const allPostsCollection = {
      _id: 'all',
      name: 'All Posts',
      postsCount: user.savedPosts.length,
      coverImage: user.savedPosts[0]?.media?.[0]?.url || null,
    };

    const collections = user.collections.map(col => ({
      _id: col._id,
      name: col.name,
      postsCount: col.posts.length,
      coverImage: col.posts[0]?.media?.[0]?.url || null,
      createdAt: col.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: [allPostsCollection, ...collections],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts inside a specific collection
// @route   GET /api/collections/:id/posts
// @access  Private
const getCollectionPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('collections savedPosts');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let posts;
    if (req.params.id === 'all') {
      const fullUser = await User.findById(req.user._id)
        .populate({ path: 'savedPosts', populate: { path: 'user', select: 'username profilePicture avatar' } });
      posts = fullUser.savedPosts.reverse();
    } else {
      const col = user.collections.id(req.params.id);
      if (!col) return res.status(404).json({ success: false, message: 'Collection not found' });

      const fullCol = await User.findById(req.user._id)
        .select('collections')
        .populate({ path: 'collections.posts', populate: { path: 'user', select: 'username profilePicture avatar' } });
      const foundCol = fullCol.collections.id(req.params.id);
      posts = foundCol ? [...foundCol.posts].reverse() : [];
    }

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new collection
// @route   POST /api/collections
// @access  Private
const createCollection = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Collection name is required' });
    }

    const user = await User.findById(req.user._id).select('collections');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent duplicate names
    const exists = user.collections.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, message: 'A collection with this name already exists' });
    }

    user.collections.push({ name: name.trim(), posts: [] });
    await user.save();

    const newCol = user.collections[user.collections.length - 1];
    res.status(201).json({
      success: true,
      data: { _id: newCol._id, name: newCol.name, postsCount: 0, coverImage: null }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rename a collection
// @route   PUT /api/collections/:id
// @access  Private
const renameCollection = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'New name is required' });
    }

    const user = await User.findById(req.user._id).select('collections');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const col = user.collections.id(req.params.id);
    if (!col) return res.status(404).json({ success: false, message: 'Collection not found' });

    // Check for duplicate name (excluding itself)
    const duplicate = user.collections.some(
      c => c._id.toString() !== req.params.id && c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'A collection with this name already exists' });
    }

    col.name = name.trim();
    await user.save();

    res.status(200).json({ success: true, data: { _id: col._id, name: col.name } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a collection
// @route   DELETE /api/collections/:id
// @access  Private
const deleteCollection = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('collections');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const col = user.collections.id(req.params.id);
    if (!col) return res.status(404).json({ success: false, message: 'Collection not found' });

    col.deleteOne();
    await user.save();

    res.status(200).json({ success: true, message: 'Collection deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a post to a collection
// @route   POST /api/collections/:id/posts
// @access  Private
const addPostToCollection = async (req, res, next) => {
  try {
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ success: false, message: 'postId is required' });

    const user = await User.findById(req.user._id).select('collections savedPosts');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Post must be saved first
    if (!user.savedPosts.includes(postId)) {
      return res.status(400).json({ success: false, message: 'Post must be saved before adding to a collection' });
    }

    const col = user.collections.id(req.params.id);
    if (!col) return res.status(404).json({ success: false, message: 'Collection not found' });

    // Avoid duplicates
    if (!col.posts.map(p => p.toString()).includes(postId)) {
      col.posts.push(postId);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Post added to collection' });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a post from a collection
// @route   DELETE /api/collections/:id/posts/:postId
// @access  Private
const removePostFromCollection = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('collections');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const col = user.collections.id(req.params.id);
    if (!col) return res.status(404).json({ success: false, message: 'Collection not found' });

    col.posts = col.posts.filter(p => p.toString() !== req.params.postId);
    await user.save();

    res.status(200).json({ success: true, message: 'Post removed from collection' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCollections,
  getCollectionPosts,
  createCollection,
  renameCollection,
  deleteCollection,
  addPostToCollection,
  removePostFromCollection,
};

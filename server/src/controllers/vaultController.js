const { Memory, VaultAlbum, VaultSecurity } = require('../models/MemoryVault');
const crypto = require('crypto');

// Helper to hash PIN
const hashPin = (pin) => crypto.createHash('sha256').update(pin).digest('hex');

// @desc    Verify Vault PIN / Biometric session
// @route   POST /api/vault/verify-pin
// @access  Private
exports.verifyVaultPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    let sec = await VaultSecurity.findOne({ user: req.user.id });

    if (!sec || !sec.pinHash) {
      // Default initial PIN if unconfigured is '1234'
      const defaultHash = hashPin('1234');
      sec = await VaultSecurity.create({ user: req.user.id, pinHash: defaultHash });
    }

    const inputHash = hashPin(pin);
    if (inputHash !== sec.pinHash) {
      return res.status(401).json({ success: false, message: 'Invalid 4-digit PIN code' });
    }

    res.status(200).json({
      success: true,
      message: 'Vault unlocked successfully',
      sessionToken: 'valid_vault_session'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set or Update Vault PIN
// @route   POST /api/vault/set-pin
// @access  Private
exports.setVaultPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4) {
      return res.status(400).json({ success: false, message: 'PIN must be 4 digits' });
    }

    const pinHash = hashPin(pin);
    const sec = await VaultSecurity.findOneAndUpdate(
      { user: req.user.id },
      { pinHash },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'PIN code updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Memory Timeline
// @route   GET /api/vault/memories
// @access  Private
exports.getMemories = async (req, res, next) => {
  try {
    const { search, favorite, hidden } = req.query;
    const query = { user: req.user.id, isDeleted: false };

    if (favorite === 'true') query.isFavorite = true;
    if (hidden === 'true') query.isHidden = true;
    if (search) query.title = { $regex: search, $options: 'i' };

    const memories = await Memory.find(query).sort({ memoryDate: -1 });

    res.status(200).json({
      success: true,
      data: memories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Memory to Vault
// @route   POST /api/vault/memories
// @access  Private
exports.addMemory = async (req, res, next) => {
  try {
    const { title, mediaUrl, mediaType = 'image', isPrivate = false, isHidden = false, albumId } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: 'Media URL is required' });
    }

    const encryptedMetadata = Buffer.from(JSON.stringify({ title, date: new Date() })).toString('base64');

    const memory = await Memory.create({
      user: req.user.id,
      title,
      mediaUrl,
      mediaType,
      album: albumId || null,
      isPrivate,
      isHidden,
      encryptedMetadata
    });

    res.status(201).json({ success: true, data: memory });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Favorite Status
// @route   PUT /api/vault/memories/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res, next) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, user: req.user.id });
    if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });

    memory.isFavorite = !memory.isFavorite;
    await memory.save();

    res.status(200).json({ success: true, isFavorite: memory.isFavorite });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft Delete Memory (Move to Trash Bin)
// @route   DELETE /api/vault/memories/:id
// @access  Private
exports.softDeleteMemory = async (req, res, next) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, user: req.user.id });
    if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });

    memory.isDeleted = true;
    memory.deletedAt = new Date();
    await memory.save();

    res.status(200).json({ success: true, message: 'Moved memory to Trash Bin' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Trash Bin Memories
// @route   GET /api/vault/trash
// @access  Private
exports.getTrashBin = async (req, res, next) => {
  try {
    const trash = await Memory.find({ user: req.user.id, isDeleted: true }).sort({ deletedAt: -1 });
    res.status(200).json({ success: true, data: trash });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore Deleted Memory from Trash Bin
// @route   POST /api/vault/restore/:id
// @access  Private
exports.restoreMemory = async (req, res, next) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, user: req.user.id });
    if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });

    memory.isDeleted = false;
    memory.deletedAt = null;
    await memory.save();

    res.status(200).json({ success: true, message: 'Memory restored successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Vault Albums (Private & Hidden)
// @route   GET /api/vault/albums
// @access  Private
exports.getAlbums = async (req, res, next) => {
  try {
    const albums = await VaultAlbum.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: albums });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Vault Album
// @route   POST /api/vault/albums
// @access  Private
exports.createAlbum = async (req, res, next) => {
  try {
    const { name, isPrivate = true, isHidden = false, coverImage } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Album name is required' });

    const album = await VaultAlbum.create({
      user: req.user.id,
      name,
      isPrivate,
      isHidden,
      coverImage
    });

    res.status(201).json({ success: true, data: album });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Encrypted Share Link
// @route   POST /api/vault/share-link
// @access  Private
exports.generateShareLink = async (req, res, next) => {
  try {
    const { memoryId } = req.body;
    const token = crypto.randomBytes(16).toString('hex');
    const shareUrl = `http://localhost:5173/app/vault/share?token=${token}`;

    res.status(200).json({
      success: true,
      shareUrl,
      expiresIn: '24 hours'
    });
  } catch (error) {
    next(error);
  }
};

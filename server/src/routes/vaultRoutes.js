const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/verify-pin', vaultController.verifyVaultPin);
router.post('/set-pin', vaultController.setVaultPin);

router.get('/memories', vaultController.getMemories);
router.post('/memories', vaultController.addMemory);
router.put('/memories/:id/favorite', vaultController.toggleFavorite);
router.delete('/memories/:id', vaultController.softDeleteMemory);

router.get('/trash', vaultController.getTrashBin);
router.post('/restore/:id', vaultController.restoreMemory);

router.get('/albums', vaultController.getAlbums);
router.post('/albums', vaultController.createAlbum);

router.post('/share-link', vaultController.generateShareLink);

module.exports = router;

const express = require('express');
const {
  getCollections,
  getCollectionPosts,
  createCollection,
  renameCollection,
  deleteCollection,
  addPostToCollection,
  removePostFromCollection,
} = require('../controllers/collectionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getCollections);
router.post('/', createCollection);
router.get('/:id/posts', getCollectionPosts);
router.put('/:id', renameCollection);
router.delete('/:id', deleteCollection);
router.post('/:id/posts', addPostToCollection);
router.delete('/:id/posts/:postId', removePostFromCollection);

module.exports = router;

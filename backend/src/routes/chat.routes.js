const express = require('express');
const { body } = require('express-validator');

const {
  createDirectChat,
  createGroupChat,
  getChatById,
  getChats,
  togglePinned,
  updateCustomLists,
} = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');
const handleValidation = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getChats);
router.get('/:chatId', getChatById);
router.post(
  '/direct',
  [body('targetUserId').isMongoId(), handleValidation],
  createDirectChat,
);
router.post(
  '/group',
  [
    body('name').trim().isLength({ min: 2, max: 80 }),
    body('memberIds').isArray({ min: 2 }),
    handleValidation,
  ],
  createGroupChat,
);
router.patch(
  '/:chatId/lists',
  [body('customLists').isArray(), handleValidation],
  updateCustomLists,
);
router.patch('/:chatId/pin', togglePinned);

module.exports = router;

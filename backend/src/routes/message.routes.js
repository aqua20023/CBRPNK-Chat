const express = require('express');
const { body } = require('express-validator');

const {
  getMessages,
  markSeen,
  sendMessage,
  uploadAttachments,
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const handleValidation = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect);

router.get('/:chatId', getMessages);
router.post(
  '/:chatId',
  [
    body('text').optional().isString(),
    body('attachments').optional().isArray(),
    body('clientMessageId').optional().isString(),
    handleValidation,
  ],
  sendMessage,
);
router.post('/:chatId/seen', markSeen);
router.post('/:chatId/upload', upload.array('files', 6), uploadAttachments);

module.exports = router;

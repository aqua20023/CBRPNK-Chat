const express = require('express');
const { body } = require('express-validator');

const {
  getMe,
  login,
  register,
  updateAvatar,
  updateMe,
  updatePushToken,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { avatarUpload } = require('../middleware/upload.middleware');
const handleValidation = require('../middleware/validate.middleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 60 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    handleValidation,
  ],
  register,
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty(), handleValidation],
  login,
);

router.get('/me', protect, getMe);
router.patch(
  '/me',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 60 }),
    body('about').optional().trim().isLength({ max: 280 }),
    handleValidation,
  ],
  updateMe,
);
router.patch('/me/avatar', protect, avatarUpload.single('avatar'), updateAvatar);
router.patch(
  '/push-token',
  protect,
  [body('token').trim().notEmpty(), handleValidation],
  updatePushToken,
);

module.exports = router;

const { cloudinary, isCloudinaryReady } = require('../config/cloudinary');
const User = require('../models/User.model');
const asyncHandler = require('../middleware/async.middleware');
const { createAppError } = require('../utils/appError');
const { signToken } = require('../utils/jwt');

function buildAuthResponse(user) {
  return {
    user,
    token: signToken(user._id),
  };
}

const register = asyncHandler(async (request, response) => {
  const { name, email, password } = request.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createAppError(409, 'Email is already registered.');
  }

  const user = await User.create({ name, email, password });
  response.status(201).json(buildAuthResponse(user.toJSON()));
});

const login = asyncHandler(async (request, response) => {
  const { email, password } = request.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw createAppError(401, 'Invalid email or password.');
  }

  const payload = user.toJSON();
  response.json(buildAuthResponse(payload));
});

const getMe = asyncHandler(async (request, response) => {
  response.json({ user: request.user });
});

const updateMe = asyncHandler(async (request, response) => {
  const updates = {};
  const allowedFields = ['name', 'about'];

  allowedFields.forEach((field) => {
    if (typeof request.body[field] === 'string') {
      updates[field] = request.body[field].trim();
    }
  });

  if (!Object.keys(updates).length) {
    throw createAppError(400, 'No profile fields provided.');
  }

  const user = await User.findByIdAndUpdate(request.user._id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  const io = request.app.get('io');
  io.emit('profile_updated', {
    userId: user._id,
    profile: {
      name: user.name,
      about: user.about,
      avatarUrl: user.avatarUrl,
    },
  });

  response.json({ user });
});

const updateAvatar = asyncHandler(async (request, response) => {
  if (!isCloudinaryReady) {
    throw createAppError(503, 'Cloudinary is not configured for avatar uploads.');
  }

  if (!request.file) {
    throw createAppError(400, 'Avatar image is required.');
  }

  const currentUser = await User.findById(request.user._id).select('-password');
  if (!currentUser) {
    throw createAppError(404, 'User not found.');
  }

  const nextAvatarUrl = request.file.path || request.file.secure_url || '';
  const nextAvatarPublicId = request.file.filename || request.file.public_id || '';

  if (!nextAvatarUrl) {
    throw createAppError(500, 'Avatar upload failed.');
  }

  const previousAvatarPublicId = currentUser.avatarPublicId;
  currentUser.avatarUrl = nextAvatarUrl;
  currentUser.avatarPublicId = nextAvatarPublicId;
  await currentUser.save();

  if (previousAvatarPublicId && previousAvatarPublicId !== nextAvatarPublicId) {
    await cloudinary.uploader.destroy(previousAvatarPublicId).catch(() => null);
  }

  const io = request.app.get('io');
  io.emit('profile_updated', {
    userId: currentUser._id,
    profile: {
      name: currentUser.name,
      about: currentUser.about,
      avatarUrl: currentUser.avatarUrl,
    },
  });

  response.json({ user: currentUser });
});

const updatePushToken = asyncHandler(async (request, response) => {
  const { token } = request.body;

  if (!token) {
    throw createAppError(400, 'Push token is required.');
  }

  const user = await User.findByIdAndUpdate(
    request.user._id,
    { $addToSet: { fcmTokens: token } },
    { new: true },
  ).select('-password');

  response.json({ user });
});

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  updateAvatar,
  updatePushToken,
};

const asyncHandler = require('./async.middleware');
const User = require('../models/User.model');
const { createAppError } = require('../utils/appError');
const { verifyToken } = require('../utils/jwt');

const protect = asyncHandler(async (request, response, next) => {
  const authorization = request.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw createAppError(401, 'Authentication token missing.');
  }

  const payload = verifyToken(token);
  const user = await User.findById(payload.sub).select('-password');

  if (!user) {
    throw createAppError(401, 'User no longer exists.');
  }

  request.user = user;
  next();
});

module.exports = {
  protect,
};

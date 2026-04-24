const User = require('../models/User.model');
const asyncHandler = require('../middleware/async.middleware');

const getUsers = asyncHandler(async (request, response) => {
  const search = String(request.query.search || '').trim();
  const filter = {
    _id: { $ne: request.user._id },
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter)
    .select('name email avatarUrl about')
    .sort({ name: 1 })
    .limit(30);

  response.json({ users });
});

module.exports = {
  getUsers,
};

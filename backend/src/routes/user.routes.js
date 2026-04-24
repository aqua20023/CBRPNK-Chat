const express = require('express');

const { getUsers } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/', getUsers);

module.exports = router;

const { validationResult } = require('express-validator');
const { createAppError } = require('../utils/appError');

function handleValidation(request, response, next) {
  const result = validationResult(request);

  if (result.isEmpty()) {
    return next();
  }

  return next(createAppError(422, 'Validation failed.', result.array()));
}

module.exports = handleValidation;

/**
 * Wraps an async route handler so any thrown error is forwarded to next()
 * instead of crashing the process or requiring per-handler try/catch.
 */
const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

module.exports = catchAsync;

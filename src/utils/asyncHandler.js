/**
 * Async Handler Wrapper
 * Wraps async route handlers to automatically catch errors and pass them to Express error middleware.
 * This eliminates the need for try-catch blocks in every controller function.
 * 
 * Usage:
 * export const myFunction = asyncHandler(async (req, res) => {
 *   // Your code here - errors will be automatically caught
 *   const data = await someAsyncOperation();
 *   return successResponse(res, data, 'Success');
 * });
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};


// Helper function for consistent responses
const sendResponse = (statusCode, data, message, res, status) => {
    res.status(statusCode).json({ data, message, isSucces: status, statusCode });
  };

module.exports = { sendResponse };
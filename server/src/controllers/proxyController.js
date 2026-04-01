const axios = require('axios');
const catchAsync = require('../utils/catchAsync');

exports.proxyRequest = catchAsync(async (req, res) => {
  const { url, method, headers, data } = req.body;

  if (!url) {
    return res.status(400).json({ status: 'fail', message: 'URL is required' });
  }

  const startTime = Date.now();

  try {
    const response = await axios({
      url,
      method: method || 'GET',
      headers: headers || {},
      data,
      validateStatus: () => true, // Don't throw errors for non-2xx status codes
      timeout: 10000 // 10 second timeout
    });

    const timeTaken = Date.now() - startTime;

    res.status(200).json({
      status: 'success',
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        timeTaken
      }
    });
  } catch (error) {
    const timeTaken = Date.now() - startTime;
    res.status(500).json({
      status: 'error',
      message: error.message,
      data: {
        status: error.response?.status || 500,
        statusText: error.response?.statusText || 'Internal Server Error',
        headers: error.response?.headers || {},
        data: error.response?.data || error.message,
        timeTaken
      }
    });
  }
});

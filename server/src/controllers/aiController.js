// const { GoogleGenAI } = require('@google/genai');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/AppError');

// exports.analyzeResponse = catchAsync(async (req, res, next) => {
//   if (!process.env.GEMINI_API_KEY) {
//     return next(new AppError('GEMINI_API_KEY is missing in server configuration. Please provide it.', 500));
//   }

//   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
//   const { status, data, headers, timeTaken, url, method } = req.body;

//   let prompt = '';

//   if (status >= 200 && status < 300) {
//     prompt = `You are an expert API Developer Assistant. I just sent a ${method} request to ${url}. The request was successful (Status: ${status}, Time: ${timeTaken}ms).

// Here are the headers:
// ${JSON.stringify(headers, null, 2)}

// Here is the response body data:
// ${JSON.stringify(data, null, 2)}

// Please thoroughly analyze this response.
// 1. Provide a beautiful, structured summary of what this data represents using bullet points and relevant emojis.
// 2. Extract the key data points into a Markdown Table for quick reading.
// 3. Explain how a frontend developer might consume and display this payload in a real-world application.

// **CRITICAL FORMATTING INSTRUCTIONS:**
// - You MUST wrap ANY code examples (JavaScript, JSON, etc.) perfectly inside triple backticks (\`\`\`) with the correct language identifier. Wait, NEVER just output raw code without standard Markdown fencing.
// - Keep your response professional, visually appealing, and generously use rich Markdown formatting (bolding, headers, lists, and tables). 
// - Do NOT wrap your entire response inside a single huge code block. Text should be separate from code blocks.`;
//   } else {
//     prompt = `You are an expert Backend Debugging Assistant. I just sent a ${method} request to ${url}, but it FAILED with an HTTP Status ${status} (Time: ${timeTaken}ms).

// Here are the response headers returned by the server:
// ${JSON.stringify(headers, null, 2)}

// Here is the error response body:
// ${JSON.stringify(data, null, 2)}

// Please thoroughly analyze this error and provide a highly aesthetic, structured report:
// ### 🚨 Error Root Cause
// - Diagnose the most likely logical cause of this error given the specific HTTP status code and response payload. Use bold text and bullet points.

// ### 🛠️ Actionable Debugging Steps
// - Provide 3-4 concrete, numbered steps I can take immediately to fix this issue.

// ### 📋 Header & Payload Inspection
// - Format any crucial request/response anomalies you noticed into a clean Markdown table.

// **CRITICAL FORMATTING INSTRUCTIONS:**
// - You MUST wrap ANY code examples perfectly inside triple backticks (\`\`\`) with the correct language identifier.
// - Keep your response extremely professional and visually appealing. 
// - Do NOT wrap your entire response inside a single code block. Text should be separate from code. Ensure the Markdown looks gorgeous when rendered!`;
//   }

//   try {
//     const response = await ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: prompt,
//     });

//     res.status(200).json({
//       status: 'success',
//       data: {
//         analysis: response.text
//       }
//     });
//   } catch (error) {
//     console.error("Gemini AI API Error:", error);
//     return next(new AppError('Failed to analyze with Gemini AI: ' + error.message, 500));
//   }
// });
const { GoogleGenAI } = require('@google/genai');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.analyzeResponse = catchAsync(async (req, res, next) => {
  // 🔴 Check API key
  if (!process.env.GEMINI_API_KEY) {
    return next(new AppError('GEMINI_API_KEY is missing in server configuration.', 500));
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const { status, data, headers, timeTaken, url, method } = req.body;

  let prompt = '';

  // ================= SUCCESS CASE =================
  if (status >= 200 && status < 300) {
    prompt = `
You are a beginner-friendly API assistant.

I sent a ${method} request to ${url}.
Status: ${status}, Time: ${timeTaken}ms.

Response data:
${JSON.stringify(data, null, 2)}

👉 Explain in VERY SIMPLE words:

1. What this response means (max 3-4 bullet points)
2. Important fields in this response (simple explanation)
3. Is this response good or bad? (and why)

👉 Rules:
- Keep answer SHORT and EASY
- Use simple English
- Use bullet points only
- Do NOT generate HTML or long code
- Avoid complex words
`;
  }

  // ================= ERROR CASE =================
  else {
    prompt = `
You are a beginner-friendly debugging assistant.

I sent a ${method} request to ${url}.
It FAILED with status ${status}.
Time: ${timeTaken}ms.

Error response:
${JSON.stringify(data, null, 2)}

👉 Explain clearly:

1. What is the main problem? (1-2 lines)
2. Why this error happened (simple reason)
3. How to fix it (step-by-step)
4. Small example fix (if possible)

👉 Rules:
- Keep it SHORT
- Use simple English
- Focus only on debugging
- No long explanation
`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      generationConfig: {
        maxOutputTokens: 500, // 🔥 limit long responses
        temperature: 0.3      // 🔥 more focused answers
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        analysis: response.text
      }
    });

  } catch (error) {
    console.error("Gemini AI API Error:", error);
    return next(new AppError('Failed to analyze with Gemini AI: ' + error.message, 500));
  }
});
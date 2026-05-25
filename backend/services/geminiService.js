const crypto = require('crypto');
const fs = require('fs');

let GoogleGenerativeAI;
let client = null;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (e) {
  GoogleGenerativeAI = null;
}

if (GoogleGenerativeAI && process.env.GEMINI_API_KEY) {
  try {
    client = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (e) {
    console.warn('Failed to initialize Gemini client, falling back to local analyzer.');
    client = null;
  }
}

const cache = new Map();

function analyzeLocally(prompt) {
  try {
    const jsonMatch = prompt.match(/(\[.*\]|\{.*\})/s);
    if (!jsonMatch) return 'No expense data found in prompt.';
    const data = JSON.parse(jsonMatch[0]);
    const expenses = Array.isArray(data) ? data : [];
    if (!expenses.length) return 'No expenses to analyze.';

    let total = 0;
    const byCategory = {};
    for (const e of expenses) {
      const amount = Number(e.amount) || 0;
      total += amount;
      const cat = e.category || 'uncategorized';
      byCategory[cat] = (byCategory[cat] || 0) + amount;
    }
    const avg = total / expenses.length;
    const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    let text = `Analyzed ${expenses.length} expenses. Total: $${total.toFixed(2)}. Average: $${avg.toFixed(2)}.`;
    if (top) text += ` Top category: ${top[0]} ($${top[1].toFixed(2)}).`;
    return text + ' (Local analysis)';
  } catch (err) {
    return 'Local analysis failed.';
  }
}

async function callGemini(prompt) {
  if (!client) throw new Error('No Gemini client available');
  // The SDK surface can differ across versions; attempt a few patterns safely.
  const model = client.getGenerativeModel ? client.getGenerativeModel({ model: 'gemini-2.0' }) : client;
  const generate = model.generateContent || model.generateText || model.text || null;
  if (!generate) throw new Error('No known generate method on Gemini client');
  const result = await generate.call(model, prompt);
  // Normalize common result shapes
  if (result == null) return '';
  if (typeof result === 'string') return result;
  if (result.response) {
    if (typeof result.response.text === 'function') return await result.response.text();
    if (typeof result.response.text === 'string') return result.response.text;
  }
  if (result.outputText) return result.outputText;
  if (result.output && Array.isArray(result.output) && result.output[0] && result.output[0].content) {
    return result.output[0].content;
  }
  return JSON.stringify(result);
}

async function generateContent(prompt) {
  const key = crypto.createHash('sha256').update(prompt).digest('hex');
  if (cache.has(key)) return cache.get(key);
  try {
    if (client) {
      const out = await callGemini(prompt);
      cache.set(key, out);
      return out;
    } else {
      const out = analyzeLocally(prompt);
      cache.set(key, out);
      return out;
    }
  } catch (err) {
    console.error('Gemini API Error:', err);
    const fallback = analyzeLocally(prompt);
    cache.set(key, fallback);
    return fallback;
  }
}

module.exports = {
  generateContent,
  _cache: cache
};
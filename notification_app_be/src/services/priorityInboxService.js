const axios = require('axios');
const MinHeap = require('../utils/MinHeap');
require('dotenv').config();

const TYPE_WEIGHTS = { Placement: 100, Result: 60, Event: 30 };

const computeScore = (n) => {
  const ageInDays = (Date.now() - new Date(n.Timestamp).getTime()) / 86400000;
  return (TYPE_WEIGHTS[n.Type] || 0) + Math.max(0, 30 - ageInDays);
};

const getPriorityInbox = async (topN = 10) => {
  const { data } = await axios.get(process.env.EVAL_API_URL, {
    headers: { Authorization: `Bearer ${process.env.EVAL_API_TOKEN}` }
  });

  const notifications = data.notifications || [];
  const heap = new MinHeap();

  for (const n of notifications) {
    const score = computeScore(n);
    if (heap.size() < topN) {
      heap.push({ ...n, score });
    } else if (score > heap.peek().score) {
      heap.pop();
      heap.push({ ...n, score });
    }
  }

  const result = [];
  while (heap.size() > 0) result.unshift(heap.pop());
  return result;
};

module.exports = { getPriorityInbox };

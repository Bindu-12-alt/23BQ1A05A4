const axios = require('axios');
const MinHeap = require('../utils/MinHeap');
require('dotenv').config();

// higher weight = more important type, placement matters most to students
const TYPE_WEIGHTS = { Placement: 100, Result: 60, Event: 30 };

const computeScore = (notif) => {
  const ageInDays = (Date.now() - new Date(notif.Timestamp).getTime()) / 86400000;
  // newer notifications get a bonus up to 30 points, older ones lose it
  return (TYPE_WEIGHTS[notif.Type] || 0) + Math.max(0, 30 - ageInDays);
};

const getPriorityInbox = async (topN = 10) => {
  const response = await axios.get(process.env.EVAL_API_URL, {
    headers: { Authorization: `Bearer ${process.env.EVAL_API_TOKEN}` }
  });

  const allNotifications = response.data.notifications || [];
  console.log(`[debug] total notifications fetched: ${allNotifications.length}`);

  // using a min-heap of size N instead of sorting everything
  // sort would be O(M log M), heap keeps it O(M log N) which is better when N is small
  const heap = new MinHeap();

  for (const notif of allNotifications) {
    const score = computeScore(notif);
    if (heap.size() < topN) {
      heap.push({ ...notif, score });
    } else if (score > heap.peek().score) {
      // only replace if this one scores higher than the current lowest in heap
      heap.pop();
      heap.push({ ...notif, score });
    }
  }

  // extract in descending order (highest score first)
  const topNotifications = [];
  while (heap.size() > 0) topNotifications.unshift(heap.pop());
  return topNotifications;
};

module.exports = { getPriorityInbox };

class MinHeap {
  constructor() { this.heap = []; }
  size() { return this.heap.length; }
  peek() { return this.heap[0]; }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) { this.heap[0] = last; this._sinkDown(0); }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.heap[p].score <= this.heap[i].score) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
      i = p;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let s = i, l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].score < this.heap[s].score) s = l;
      if (r < n && this.heap[r].score < this.heap[s].score) s = r;
      if (s === i) break;
      [this.heap[s], this.heap[i]] = [this.heap[i], this.heap[s]];
      i = s;
    }
  }
}

module.exports = MinHeap;

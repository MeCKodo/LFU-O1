class Node {
  constructor(key, value, currentFBlock) {
    this.key = key;
    this.value = value;
    this.next = null;
    this.pre = null;
    this.currentFBlock = currentFBlock;
  }
}

class FrequencyBlock {
  constructor(frequency) {
    this.frequency = frequency;
    this.head = null;
    this.tail = null;
    this.next = null;
    this.pre = null;
    
    this.nodeMap = new Map();
    this.length = 0;
  }
  
  addNode(node) {
    node.pre = node.next = null;
    
    if (this.length === 0) { // 该频率下还没有node
      this.head = this.tail = node;
    } else {
      const preNode = this.head;
      this.head = node;
      node.pre = preNode;
      preNode.next = node;
      if (!preNode.pre) {
        this.tail = preNode;
      }
    }
    
    this.nodeMap.set(node.key, node);
    this.length += 1;
  }
  
  removeNode(node) {
    const { pre, next, key } = node;
    
    if (pre) {
      pre.next = next;
    }
    if (next) {
      next.pre = pre;
    }
    if (this.tail === node) { // 当前tail会被删掉，tail指向下一个node
      this.tail = next;
    }
    // 删除得是头节点，并且该Block不止1个节点，head前移
    if (this.head === node && this.head !== this.tail) {
      this.head = pre;
    }
    
    this.nodeMap.delete(key);
    this.length -= 1;
  }
  
}

class LFUCache {
  constructor(capacity) {
    if (!(Object.prototype.toString.call(capacity) === '[object Number]')) {
      throw TypeError('capacity must be number');
    }
    if (capacity <= 0) {
      console.error('please input capacity > 0');
    }
    this.capacity = capacity;
    this.head = null;
    this.tail = null;
    this.cache = new Map();
    this.length = 0;
  }
  
  put(key, value) {
    let node = this.cache.get(key);
    
    if (this.capacity <= 0) {
      return;
    }
    
    if (node) {
      node.value = value;
      this.access(node);
      return;
    }
    
    if (this.length === this.capacity) {
      this.evict();
    }
    
    // 有tail且是最后一个
    if (this.tail && this.tail.frequency === 0) {
      node = new Node(key, value, this.tail);
      this.tail.addNode(node);
    } else {
      const FBlock = new FrequencyBlock(0);
      node = new Node(key, value, FBlock);
      FBlock.addNode(node);
      if (this.length === 0) { // 没有tail
        this.head = FBlock;
      } else { // 有tail, 但是频率不等于0
        FBlock.next = this.tail;
        this.tail.pre = FBlock;
      }
      this.tail = FBlock;
    }
    
    this.cache.set(key, node);
    this.length += 1;
  }
  
  get(key) {
    if (this.capacity <= 0) return -1;
    
    const node = this.cache.get(key);
    if (!node) return -1;
    
    this.access(node);
    return node.value;
  }
  
  access(node) {
    let FBlock;
    let nodeCurrentFBlock = node.currentFBlock;
    const { next, frequency: currentFrequency } = nodeCurrentFBlock;
  
    // Block 是否连续，连续直接取next，否则新建下一个Block
    if (next && (next.frequency <= currentFrequency + 1)) {
      FBlock = next;
    } else {
      FBlock = new FrequencyBlock(currentFrequency + 1);
    }
    
    nodeCurrentFBlock.removeNode(node); // 上一个Block 删除 node
    this.removeFBlock(nodeCurrentFBlock, FBlock);
    
    if (this.head.frequency < FBlock.frequency) { // head指向最高频率的Block
      this.head = FBlock;
    } else {
      if (FBlock.frequency > (this.head.pre && this.head.pre.frequency + 1)) {
        this.head.pre = FBlock;
      }
    }
    
    node.currentFBlock = FBlock; // node重新引用新的Block
    node.currentFBlock.addNode(node);
    
    if (this.tail === this.head) {
      this.tail.pre = this.tail.next = this.head.pre = this.head.next = null;
    }
  }
  
  removeFBlock(nodeCurrentFBlock, FBlock) {
    const { next, pre, length } = nodeCurrentFBlock;
    if (length !== 0) {
      if (next === FBlock) return; // 下一个就是要插入的，不用修改pre和next
      
      if (next) {
        FBlock.next = next;
        next.pre = FBlock;
      }
      // nodeCurrentFBlock = pre
      nodeCurrentFBlock.next = FBlock;
      FBlock.pre = nodeCurrentFBlock;
      return;
    }
    
    if (FBlock.length === 0) { // 新创建的Block
      if (next) {
        FBlock.next = next;
        next.pre = FBlock;
      }
      if (pre) {
        pre.next = FBlock;
        FBlock.pre = pre;
      }
    } else {
      if (pre) {
        pre.next = FBlock;
      }
      FBlock.pre = pre;
    }
    
    if (this.tail === nodeCurrentFBlock) {
      this.tail = FBlock;
    }
    
  }
  
  evict() {
    this.cache.delete(this.tail.tail.key);
    this.tail.removeNode(this.tail.tail);
    if (this.tail.length === 0) {
      this.tail = this.tail.next;
    }
    
    this.length -= 1;
  }
}

module.exports = LFUCache;

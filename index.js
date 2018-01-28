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
    
    this.nodeMap = {};
    this.length = 0;
  }
  
  addNode(Node) {
    if (this.length === 0) { // 该频率下还没有node
      this.nodeMap[Node.key] = Node;
      this.head = this.tail = Node;
    } else {
      const preNode = this.head;
      this.head = Node;
      Node.pre = preNode;
      preNode.next = Node;
      if (!preNode.pre) {
        this.tail = preNode;
      }
      this.nodeMap[Node.key] = Node;
    }
    this.length += 1;
  }
  
  removeNode(Node) {
    const { pre, next, key } = Node;
    if (pre) {
      pre.next = next;
    }
    if (next) {
      next.pre = pre;
    }
    if (this.tail === Node) { // 当前会被删掉，tail指向下一个Node
      this.tail = next;
    }
    // 删除得是头节点，并且该Block不止1个节点，head前移
    if (this.head === Node && this.head !== this.tail) {
      this.head = pre;
    }
    Reflect.deleteProperty(this.nodeMap, key);
    this.length -= 1;
  }
  
  destroy() {
    this.frequency = null;
    this.head = null;
    this.tail = null;
    this.next = null;
    this.pre = null;
    
    this.nodeMap = null;
    this.length = null;
  }
}

class LFUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.head = null;
    this.tail = null;
    this.cache = {};
    this.length = 0;
  }
  
  put(key, value) {
    let node;
    if (this.cache[key]) {
      this.cache[key].value = value;
      return;
    }
    // 满了
    if (this.length === this.capacity) {
      this.evict();
    }
    
    // put第一个
    if (this.length === 0) {
      const FBlock = new FrequencyBlock(0);
      node = new Node(key, value, FBlock);
      FBlock.addNode(node);
      this.head = this.tail = FBlock;
    } else { // 已经有了
      if (this.tail.frequency === 0) {
        node = new Node(key, value, this.tail);
        this.tail.addNode(node);
      } else {
        const FBlock = new FrequencyBlock(0);
        node = new Node(key, value, FBlock);
        FBlock.addNode(node);
        if (this.tail === this.head) {
          this.head.pre = FBlock;
          FBlock.next = this.head;
        } else { // Block1 -> Block2 -> Block3 -> Block4
          FBlock.next = this.tail;
          this.tail.pre = FBlock;
        }
        this.tail = FBlock;
      }
    }
    
    this.cache[key] = node;
    this.length += 1;
  }
  
  get(key) {
    let FBlock;
    const node = this.cache[key];
    if (!node) return -1;
    
    let nodeCurrentFBlock = node.currentFBlock;
    const { next, frequency: currentFrequency } = nodeCurrentFBlock;
    
    if (next) {
      // Block 是否连续，连续直接取next，否则新建下一个Block
      FBlock = (next.frequency > currentFrequency + 1) ?
        new FrequencyBlock(currentFrequency + 1) :
        next;
    } else {
      FBlock = new FrequencyBlock(currentFrequency + 1);
    }
    
    nodeCurrentFBlock.removeNode(node); // 上一个Block 删除 node
    this.removeFBlock(nodeCurrentFBlock, FBlock);
    
    node.currentFBlock = FBlock; // node重新引用新的Block
    node.currentFBlock.addNode(node);
    if (this.head.frequency < node.currentFBlock.frequency) { // head指向最高频率的Block
      this.head = node.currentFBlock;
    } else {
      if (node.currentFBlock.frequency > this.head.pre.frequency) {
        this.head.pre = node.currentFBlock;
      }
    }
    
    if (this.tail === this.head) {
      this.tail.pre = this.tail.next = this.head.pre = this.head.next = null;
    }
    
    return node.value;
  }
  
  removeFBlock(nodeCurrentFBlock, FBlock) {
    const { next, pre, length } = nodeCurrentFBlock;
    if (next) {
      FBlock.next = next;
      next.pre = FBlock;
    }
    if (length === 0) {
      if (this.tail.frequency === nodeCurrentFBlock.frequency) {
        this.tail = FBlock;
      }
      
      if (pre) {
        FBlock.pre = pre;
        pre.next = FBlock;
      }
      
      nodeCurrentFBlock.destroy();
    } else {
      nodeCurrentFBlock.next = FBlock;
      FBlock.pre = nodeCurrentFBlock;
    }
  }
  
  evict() {
    Reflect.deleteProperty(this.cache, this.tail.tail.key);
    this.tail.removeNode(this.tail.tail);
    if (this.tail.length === 0) {
      const next = this.tail.next;
      this.tail.destroy();
      this.tail = next;
    }
    this.length -= 1;
  }
}

module.exports = LFUCache;

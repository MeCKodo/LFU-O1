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
  
  addNode(Node) {
    Node.pre = Node.next = null;
    if (this.length === 0) { // 该频率下还没有node
      // this.nodeMap[Node.key] = Node;
      this.nodeMap.set(Node.key, Node);
      this.head = this.tail = Node;
    } else {
      const preNode = this.head;
      this.head = Node;
      Node.pre = preNode;
      preNode.next = Node;
      if (!preNode.pre) {
        this.tail = preNode;
      }
      // this.nodeMap[Node.key] = Node;
      this.nodeMap.set(Node.key, Node);
    }
    this.length += 1;
  }
  
  removeNode(Node) {
    const {pre, next, key} = Node;
    if (pre) {
      pre.next = next;
    }
    if (next) {
      next.pre = pre;
    }
    if (this.tail === Node) { // 当前tail会被删掉，tail指向下一个Node
      this.tail = next;
    }
    // 删除得是头节点，并且该Block不止1个节点，head前移
    if (this.head === Node && this.head !== this.tail) {
      this.head = pre;
    }
    // Reflect.deleteProperty(this.nodeMap, key);
    this.nodeMap.delete(key);
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
    if (!(Object.prototype.toString.call(capacity) === '[object Number]')) {
      throw TypeError('capacity must be number');
    }
    if (capacity === 0) {
      console.error('please input capacity > 0');
    }
    this.capacity = capacity;
    this.head = null;
    this.tail = null;
    this.cache = new Map();
    this.length = 0;
  }
  
  put(key, value) {
    let node;
    if (this.capacity <= 0) {
      return;
    }
    if (this.cache.get(key)) {
      this.resetKey(key, value);
      return;
    }
    
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
    
    // this.cache[key] = node;
    this.cache.set(key, node);
    this.length += 1;
  }
  
  get(key) {
    let FBlock;
    if (!this.capacity) {
      return -1;
    }
    const node = this.cache.get(key);
    if (!node) return -1;
    
    let nodeCurrentFBlock = node.currentFBlock;
    const {next, frequency: currentFrequency} = nodeCurrentFBlock;
    
    if (next) {
      // Block 是否连续，连续直接取next，否则新建下一个Block
      // console.log((next.frequency > currentFrequency + 1), '---(next.frequency > currentFrequency + 1)');
      FBlock = (next.frequency > currentFrequency + 1) ?
        new FrequencyBlock(currentFrequency + 1) :
        next;
    } else {
      FBlock = new FrequencyBlock(currentFrequency + 1);
    }
    // console.log(nodeCurrentFBlock, '------current', FBlock, '---------FBlock', key, '------ key');
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
    node.pre = node.next = null;
    node.currentFBlock.addNode(node);
    
    if (this.tail === this.head) {
      this.tail.pre = this.tail.next = this.head.pre = this.head.next = null;
    }
    
    return node.value;
  }
  
  // 重置Key的时候，当前key在该频率下需要变为head
  resetKey(key, value) {
    const cacheNode = this.cache.get(key);
    cacheNode.value = value;
    let {currentFBlock, pre, next} = cacheNode;
    if (currentFBlock.length <= 1 || cacheNode === currentFBlock.head) {
      return;
    }
    if (cacheNode === currentFBlock.tail) {
      currentFBlock.tail = next;
    }
    if (pre) {
      pre.next = next;
    }
    if (next) {
      next.pre = pre;
    }
    currentFBlock.head.next = cacheNode;
    cacheNode.pre = currentFBlock.head;
    cacheNode.next = null;
    currentFBlock.head = cacheNode;
  }
  
  removeFBlock(nodeCurrentFBlock, FBlock) {
    const {next, pre, length} = nodeCurrentFBlock;
    if (length === 0) {
      if (this.tail.frequency === nodeCurrentFBlock.frequency) {
        this.tail = FBlock;
      }
      if (pre) {
        FBlock.pre = pre;
        pre.next = FBlock;
      }
      if (next) {
        FBlock.next = next;
        next.pre = FBlock;
      }
      nodeCurrentFBlock.destroy();
    } else {
      if (next === FBlock) return; // 下一个就是要插入的，不用修改pre和next
      
      if (next && next !== FBlock) {
        FBlock.next = next;
        next.pre = FBlock;
      }
      nodeCurrentFBlock.next = FBlock;
      FBlock.pre = nodeCurrentFBlock;
    }
  }
  
  evict() {
    // Reflect.deleteProperty(this.cache, this.tail.tail.key);
    this.cache.delete(this.tail.tail.key);
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
/*

var cache = new LFUCache(10);

cache.put(3, 17);
cache.put(6, 11);
cache.put(10, 5);

cache.put(2, 19);
cache.get(2);
cache.get(3);
cache.put(5, 5);
cache.put(1, 30);
cache.put(9, 12);
// cache.get(7);

cache.get(5);
cache.get(8);
cache.get(9);
cache.put(4, 30);
cache.put(9, 3);
cache.get(9); // error
cache.get(10);
cache.get(10);
cache.put(6, 14);
cache.put(3, 1); // ok

cache.get(3);
cache.put(10, 11);
cache.get(8);
cache.put(2, 14);
cache.get(1);
cache.get(5);
cache.get(4);
cache.put(11, 4);
cache.put(12, 24);
cache.put(5, 18);
cache.get(13);
cache.put(7, 23);
cache.get(8);
cache.get(12);

cache.put(3, 27);
cache.put(2, 12);
cache.get(5);
cache.put(2, 9);
cache.put(13, 4);
cache.put(8, 18);
cache.put(1, 7);
cache.get(6);
cache.put(9, 29);
cache.put(8, 21);
cache.get(5);
cache.put(6, 30);
cache.put(1, 12);

cache.get(10);
cache.put(4, 15);
cache.put(7, 22);
cache.put(11, 26);
cache.put(8, 17);
cache.put(9, 29);
cache.get(5);
cache.put(3, 4);
cache.put(11, 30);
cache.get(12);
cache.put(4, 29);
cache.get(3);
cache.get(9);

cache.get(6);
cache.put(3, 4);
cache.get(1);
cache.get(10);
cache.put(3, 29);
cache.put(10, 28);
cache.put(1, 20);
cache.put(11, 13);
cache.get(3);
cache.put(3, 12);
cache.put(3, 8);
cache.put(10, 9);
cache.put(3, 26);

cache.get(8);
cache.get(7);
cache.get(5);
cache.put(13, 17);
cache.put(2, 27);
cache.put(11, 15);
cache.get(12);
cache.put(9, 19);
cache.put(2, 15);
cache.put(3, 16);
cache.get(1);
cache.put(12, 17);
cache.put(9, 1);
*/

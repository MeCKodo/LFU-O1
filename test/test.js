'use strict';
const assert = require('assert');
const LFUCache = require('../');

const keyValueFixtures = {
  'a': '1',
  'b': '2',
  'c': '3',
  'd': '4',
  'e': '5',
  'f': '6',
  'g': '7',
  'h': '8',
  'i': '9',
  'j': '10'
};

function putFixturesIntoCache(cache, size) {
  Object.keys(keyValueFixtures).forEach(function (key) {
    cache.put(key, keyValueFixtures[key]);
    if (keyValueFixtures[key] >= size) {
      return false;
    }
  });
}

describe('LFUCache-O(1) time', function () {
  
  it('should return cached value', function () {
    const cache = new LFUCache(2);
    cache.put('a', '1');
    assert.equal(cache.get('a'), '1');
    assert.equal(cache.get('a'), '1');
  });
  
  it('should keep frequency but change cached value', function () {
    const cache = new LFUCache(3);
    cache.put('a', '1');
    cache.put('b', '2');
    cache.put('c', '3');
  
    cache.get('a'); cache.get('a'); cache.get('a');
    cache.put('a', '11');
    cache.put('d', '4');
    
    assert.equal(cache.get('a'), '11');
    assert.equal(cache.get('b'), -1);
    assert.equal(cache.get('c'), '3');
    assert.equal(cache.get('d'), '4');
    
  });
  
  it('should not keep more than maxItems', function () {
    const cache = new LFUCache(2);
    cache.put('a', '1');
    cache.put('b', '2');
    cache.put('c', '3');
    assert.equal(cache.get('a'), -1);
    assert.equal(cache.get('b'), '2');
    assert.equal(cache.get('c'), '3');
  });
  
  it('should keep first value if second is never accessed', function () {
    const cache = new LFUCache(2);
    cache.put('a', '1');
    cache.put('b', '2');
    cache.get('a');
    cache.put('c', '3');
    
    assert.equal(cache.get('a'), '1');
    assert.equal(cache.get('b'), -1);
    assert.equal(cache.get('c'), '3');
  });
  
  it('should keep first value if accessed more than second', function () {
    const cache = new LFUCache(2);
    cache.put('a', '1');
    cache.put('b', '2');
    cache.get('a');
    cache.get('a');
    cache.get('b');
    cache.put('c', '3');
    
    assert.equal(cache.get('a'), '1');
    assert.equal(cache.get('b'), -1);
    assert.equal(cache.get('c'), '3');
  });
  
  it('should evict oldest if frequencies match', function () {
    const cache = new LFUCache(2);
    cache.put('a', '1');
    cache.put('b', '2');
    cache.get('a'); cache.get('a');
    cache.get('b'); cache.get('b');
    cache.put('c', '3');
    
    assert.equal(cache.get('a'), -1);
    assert.equal(cache.get('b'), '2');
    assert.equal(cache.get('c'), '3');
  });
  
  it('should correctly evict > 0 frequencies', function () {
    const cache = new LFUCache(2);
    cache.put('a', '1');
    cache.put('b', '2');
    cache.get('a'); cache.get('a'); cache.get('a');
    cache.get('b'); cache.get('b');
    cache.put('c', '3');
    
    assert.equal(cache.get('a'), '1');
    assert.equal(cache.get('b'), -1);
    assert.equal(cache.get('c'), '3');
  });
  
  it('should evict LFU after oldest of equal evicted', function () {
    const cache = new LFUCache(2);
    cache.put('a', '1');
    cache.put('b', '2');
    cache.get('a'); cache.get('a');
    cache.get('b'); cache.get('b');
    cache.put('c', '3');
    
    assert.equal(cache.get('a'), -1);
    
    cache.get('b');
    cache.get('c');
    
    cache.put('d', '4');
    
    assert.equal(cache.get('c'), -1);
    
    assert.equal(cache.get('a'), -1);
    assert.equal(cache.get('b'), '2');
    assert.equal(cache.get('c'), -1);
    assert.equal(cache.get('d'), '4');
  });
  
  it('should check FrequencyBlock prototype', function() {
    const cache = new LFUCache(4);
    cache.put('a', '1');
    cache.put('b', '2');
    cache.put('c', '3');
    cache.put('d', '4');
    
    cache.get('a'); cache.get('a'); cache.get('a');
    cache.get('b'); cache.get('b');
    cache.get('c');
  
    assert.equal(cache.tail.frequency, 0);
    assert.equal(cache.head.frequency, 3);
  
    assert.equal(cache.tail.next.frequency, 1);
    assert.equal(cache.tail.next.next.frequency, 2);
    assert.equal(cache.tail.next.next.next.frequency, 3);
  
    assert.equal(cache.head.pre.frequency, 2);
    assert.equal(cache.head.pre.pre.frequency, 1);
    assert.equal(cache.head.pre.pre.pre.frequency, 0);
  
  });
  
  it('should remove LFU of ten', function () {
    const cache = new LFUCache(10);
    putFixturesIntoCache(cache, 10);
    
    cache.get('a');
    cache.get('b');
    cache.get('c');
    cache.get('d');
    // e is missing!
    cache.get('f');
    cache.get('g');
    cache.get('h');
    cache.get('i');
    cache.get('j');
    
    cache.put('k', '11');
    assert.equal(cache.get('a'), '1');
    assert.equal(cache.get('e'), -1);
    assert.equal(cache.get('j'), '10');
  });
  
});

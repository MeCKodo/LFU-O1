# LFU-O1
> Implement LFU O(1) time

## How to use

```javascript
const cache = new LFUCache(2);

cache.put(1, 1);
cache.put(2, 2);

cache.get(1); // 1
cache.get(2); // 2
cache.get(2); // 2

cache.put(3, 3); // remove 1

cache.get(1); // -1
cache.get(3); // 3
```

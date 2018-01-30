# LFU-O1
[![CircleCI](https://img.shields.io/circleci/project/github/MeCKodo/LFU-O1.svg)](https://circleci.com/gh/MeCKodo/wechat-colorpicker) [![npm](https://img.shields.io/npm/dt/lfu-o1.svg)](https://www.npmjs.com/package/lfu-o1) [![npm](https://img.shields.io/npm/v/lfu-o1.svg)](https://www.npmjs.com/package/lfu-o1)
> Implement LFU O(1) time

## Install

> npm install lfu-o1 -S

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

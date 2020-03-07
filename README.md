# ts-promise
Promise/A+ typescript realize

## 有趣的可探讨点
1. queueMicrotask的使用位置:
    考虑以下两种情况：
    1. resovle
    2. then
2. 透传
3. Koa middleware怎么实现的异步错误捕获

可以看看ts-promise是怎么解决的

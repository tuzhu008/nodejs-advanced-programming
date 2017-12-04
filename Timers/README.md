# 使用定时器制定函数执行计划

**本章提要：**

* 推迟函数的执行

* 取消执行计划

* 制定函数的周期性执行计划

* 将函数执行推迟到下一轮事件循环

如果你已习惯千 JavaScript 编程，也许会用到 `setTimeout` 和 `setlnterval` 函数，这两个函数可以将某个函数推迟一段时间执行。举个例子，如果下面这段代码载入网页， 会在1秒后将字符串 “Hello there" 附加到页面文档：

```js
var oneSecond = 1000 * 1; // 1s = 1000ms
setTimeout(function () {
    document.write('<p>Hello there.</p>');
}, oneSecond);
```

而 `setInterval` 允许一个函数以指定的时间间隔重复执行，如果将下面这段代码加入网页， 那么它将会每隔1秒在页面文档后附加一次短语 ''Hello there":

```js
var oneSecond = 1000 * 1; // 1s = 1000ms
setInterval(function () {
    document.write('<p>Hello there.</p>');
}, oneSecond);
```

之所以出现对这些函数的需求，是因为网络早已变成了一个构建应用程序的平台， 而不仅仅用于创建静态网页。这些任务计划函数辅助开发人员构建周期性的表单验证、延迟远程数据同步以及各种各样需要延时响应的用户界面交互。Node 全面实现了这样一组函数，它们被用来在服务器端辅助很多不同进程的周期性或者推迟执行， 这些进程包括缓存过期、连接池清理、会话超时、轮询等。

现在介绍将这些函数，然后讨论它们的一些局限性。

## 使用 `setTimeout` 推迟函数执行

`setTimeout` 可以让你制定一个在将来某个时刻让指定函数执行一次的执行计划，下面是一个示例：

```js
var timeout_ms = 2000; // 2秒
var timeout = setTimeout(function () {
    console.log('time out!');
}, timeout_ms);
```

与浏览器端的 JavaScript 完全一样，`setTimeout` 接受要被推迟执行的函数作为第一个参数，接受推迟执行的时间（以毫秒为单位）作为第二个参数。

调用 `setTimeout` 会返回一个超时句柄，该句柄是一个内部对象，除了将它作为参数调用 `clearTimeout` 取消函数执行外， 不能用于它途。

## 使用 `clearTimeout` 取消函数执行

一旦获得了一个超时句柄，就可以用它调用 `clearTimeout` 函数，来取消函数的执行，如下所示：

```js
var timeout_ms = 1000; // 2秒
var timeout = setTimeout(function () {
    console.log('time out!');
}, timeout_ms);
clearTimeout(timeout);
```

在上面的代码中，超时永远不会被触发，'time out!' 永远不会被打印到控制台。此外也可以将来的某一时刻取消已计划好的函数执行，下面的代码展示了发生的这种情况：

```js
var timeout = setTimeout(function A () {
    console.log('time out!');
}, 2000);

setTimeout(function B () {
    clearTimeout(timeout);
}, 1000);
```

本例中，安排了两个要在将来执行的函数—— A 和 B，A 函数被安排在 2秒后执行，B 函数被安排在 1秒后执行。因为在本例中，B 函数执行时取消 A 函数的执行，所以 A 函数永远不会执行。

## 指定和取消函数的重复执行计划

`setInterval` 与 `setTimeout` 类似，但不同的是它会安排一个函数每隔一个指定的时间间隔重复执行一次， 也许你想用它周期性地触发一段程序， 用来完成一些类似清理、收集、登录、获取数据、轮询等需要重复执行的任务。

下面这段代码会每隔1秒向控制台输出一个 "tick" 字符串：

```js
var period = 1000; // 1秒
setInterval(function () {
    console.log('tick');
}, period);
```

如果不想让这个过程无限期地进行下去，或者不想让其自行结束，可以调用 `clearlnteival()` 来取消它的执行。

`setlnterval` 返回一个执行计划句柄，可以将该句柄用作 `clearInterval` 的参数来取消执行计划。

```js
var interval = setInterval(function () {
    console.log('tick');
}, 1000);
clearInterval(interval);
```

## 使用`process.nextTick` 将函数执行推迟到下一轮事件循环

有时， 浏览器端的 JavaScript 程序员会用 `setTimout(callback, 0)` 将任务推迟一段很短的时间， 第二个参数是 0 毫秒， 它告诉  JavaScript 运行时在所有被挂起的事件处理完毕后立刻执行这个回调函数，有时候这种技术被用来执行一些并不需要立刻执行的操作。例如有时这种技术用于在用户事件处理完毕后开始播放动画或者做一些计算。

顾名思义，Node 中的事件循环在一个_处理事件队列_的循环里运行，事件循环每执行一次就被称为一个 "tick"。

可以安排在事件循环开始下一轮（下一个 tick \)时调用回调函数一次， 然而，`setTimeout` 使用的是 JavaScript 运行时的内部执行队列， 而不是使用事件循环。

通过用 `process.nextTick(callback)` 来取代 `setTimeout(callback, 0)` ，回调函数会在事件队列内的所有事件处理完毕后立刻执行，它要比激活 JavaScript 的超时队列快得多（以CPU时间来衡量）。

> **\[info\]「编者注：」**
>
> 超时队列是将事件添加到下一轮事件循环的事件队列中，而 nextTick 是将回调安排在下一轮时间循环的事件队列的最前面。

你把函数延迟到下一轮事件循环再执行，如下所示：

```js
process.nextTick(function () {
    my_expensive_computation_function();
});
```

> **\[info\] 注意：**
>
> process 对象是 Node 中为数不多的全局对象之一。

## 阻塞事件循环

Node 和 JavaScript 的运行时采用的是**单线程事件循环**。每次循环，运行时通过调用相关回调函数来处理队列内的下个事件。当事件处理完毕，事件循环获取处理的结果并开始处理下个事件，如此反复，直到事件队列为空。如果其中某个回调函数占用了很长时间，事件循环在此期间就不能处理其他挂起的事件，这会让应用程序或服务变得非常缓慢。

在处理事件时， 如果使用了内存敏感或者处理器敏感的函数， 会导致事件循环变得缓慢，而且造成大量事件堆积，不能得到及时处理，甚至堵塞队列。

下面是一个阻塞事件循环的例子：

```js
process.nextTick(function () {
    var a = 0;
    while (true) {
        a ++;
    }
});

process.nextTick(function () {
    console.log('next tick');
});

setTimeout(function () {
    console.log('time out');
}, 1000);
```

在上面的例子中，nextTick2 和 timeout 函数无论等待多久都没机会运行， 因为事件循环被 nextTick 函数里的无限循环阻塞了，即使 timeout 函数被计划在1秒钟后执行也不可能。

在使用 setTimeout 时，回调函数会被添加到执行计划队列，而在这个例子里它们甚至不会被添加到队列。虽然这是一个极端的例子，但是可以看到，执行一个处理器敏感的任务时，可能会堵塞或者拖慢事件循环。

## 退出事件循环

通过使用 `process.nextTick`， 可以将一个非关键性的任务推迟到事件循环的下一轮再执行，这样可以释放事件循环，让它可以继续执行其他挂起的事件。

查看下面的例子，如果需要删除一个之前创建的临时文件， 但又不想在对客户端做出响应之前进行该操作， 就可以延迟删除操作， 如下所示：

```js
stream.on('data', function (data) {
    stream.end('my response');
    process.nextTick(function () {
        fs.unlink('/path/to/file/');
    });
});
```

## 使用 `setTimeout` 代替 `setInterval` 强制函数串行执行

假如希望函数 my\_async\_function 重复执行一些 I/O 操作（比如解析日志文件），可以使用 `setInterval ` 函数，如下所示：

```js
var interval = 1000;
setInterval(function () {
    my_sync_function(function () {
        console.log('my_async_function finished');
    });
}, interval);
```

不过， 你必须确保这些函数不会同时执行， 但是使用 `setlnterval` 就无法保证这一点。假如 my\_async\_function 函数的执行时间比 interval 变量多了1毫秒，它们就会被同时执行，而不是按顺序串行执行。

因此， 需要强制指定 my\_async \_function 函数执行结束与下个 my\_async function 函数开始执行之间的时间间隔， 这个时间间隔应该由 interval 指定，可以这样做：

```js
var interval = 1000; // 1s
(function schedule () {
    setTimeout(function () {
        my_sync_function(function () {
            console.log('async is done');
            schedule();
        });
    }, interval);
}());
```




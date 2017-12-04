# 使用事件发射器模式简化事件绑定

**本章提要：**

* 事件发射器模式简介

* 绑定和解绑定事件监听器

* 创建自定义的事件发射器

在 Node 中，很多对象都能够发射事件，例如，每当有新客户端连接时，TCP 服务器就会发射 "connect" 事件，又比如每读取一整块数据，文件流就会发射 ''data" 事件， 这些对象在 Node 中被称为事件发射器， 它可以让程序员订阅感兴趣的事件，并将回调函数绑定到相关的事件上，每当事件发射器发射事件时， 对应的回调函数就会被调用。 这种发布/订阅模式非常类似于传统的图形用户界面\(Graphic User Interface, GUI\)模式， 比如按钮被单击时， 应用程序就会得到通知。 通过这种模式， 服务器端的程序就会对某些事件的发生做出响应， 比如有客户端连接、 套接字上有可用数据或者是文件关闭。

还可以创建自定义的事件发射器，实际上 Node 提供了一个伪类 EventEmitter，可以将其作为基类来创建自定义的事件发射器。

## 理解标准回调模式

异步编程并不使用函数返回值表示函数调用的结束，而是采用后继传递 \(continuation-passing style, CPS\)取而代之。

> 后继传递风格是一种程序的流程控制权以后继的形式被显式传递的编程风格。\(...\)
>
> 按后继传递风格编写的函数以一个显式的”后继” 作为额外参数，”后继” 实际是一个函数，当CPS函数计算出返回值时，它就会调用后继函数，并将CPS函数的返回值作为其参数。

在后继传递风格中，每个函数在执行完毕后都会调用一个回调函数， 以使程序能够继续运行下去。正如将看到的那样，JavaScript 很适合这种编程风格， 下面是一个在 Node 将文件加载到内存的例子：

```js
var fs = require("fs");
fs.readFile('/etc/passwd', function (err, fileContent) {
    if {err) {
        throw err;
    }
    console.log('file content', fileContent.toString());
});
```

在这个例子中， 将一个内联匿名函数传递给 `fs.readFile` 函数作为其第二个参数，其实这就是在使用 CPS，因为在这个内联匿名函数内将函数执行继续了下去。

如你所见，回调函数的第一个参数是一个错误对象，如果有错误发生，这个参数将会是 Error 类的一个实例，这是 Node 中应用 CPS 编程的一般模式。当没有错误发生时，这个参数为 `NULL`。

## 理解事件发射器模式

在标准回调模式中，将一个回调函数作为参数传递给将被执行的函数，这种模式在函数执行结束后需要通知客户端的情况下工作得很好。但是如果在函数执行过程中发生了多个事件或者事件反复发生了多次，那这种模式就工作得不是那么好了。例如，如果有兴趣在套接字（socket）上每当有可用数据时都能够得到通知，标准回调模式就帮不上什么忙了， 此时正是事件发射器模式派上用场的时候，并且可以用标准的接口清楚地区分事件发射器和事件监听器。

在使用事件发生器模式时，会涉及两个或更多的对象，这些对象包括一个或者多个事件监听器。

顾名思义， 事件发射器就是可以发射事件的对象，而事件监听器则是绑定到事件发射器上的代码，负责监听特定类型的事件， 如下面的例子所示：

```js
var req = http.request(options, function (response) {
    response.on("data", function (data) {
        console.log("some data from the response ", data);
    });

    response.on("end", function () {
       console.log("response ended");
    });
   req.end();
}
```

在上面的例子中， 可以看到几个必要的步骤， 在这几个步骤中， Node 的 `http.request` API\(后面将介绍）创建了一个 HTTP 请求，并将其发送到远程服务器。第一行用到了后继传递风格， 传递了一个当 HTTP 服务器响应时就会被调用的内联函数。HTTP 请求API 在此处应用 CPS 是因为 `http.request` 函数执行完毕之后，程序还要继续运行。

`http.request` 函数执行完毕后， 就会将响应对象传递给那个回调函数并调用它。响应对象是一个事件发射器，根据 Node 文档，响应对象能够发射包括 data、end 在内的很多事件，每当这些事件发生时， 你注册的那些回调函数都会被调用。

一般而言，当需要在请求的操作完成后重新获取控制权时就使用 CPS 模式， 当事件可能发生多次时就使用事件发射器模式。

## 理解事件类型

请注意发射的事件具有类型，类型用一个字符串表示，前面的例子中有 "data" 和 "end'' 两种事件类型，它们都是由事件发射器定义的任意字符串， 不过约定俗成的是，事件类型通常都是由不包含空格的小写单词组成的。

你无法通过编程来判断事件发射器到底能够发射哪些类型的事件， 因为事件发射器 API 没有提供内省机制， 因此你用到的 API 应该有文档来记录它能够发射的事件类型。

一旦有相关事件发生， 事件发射器就会调用相应的事件监听器， 并将相关数据作为参数传递给事件监听器。在前面的 `http.request` 示例中，"data" 事件的回调函数接收一个 `data` 对象，作为其第一个也是唯一的一个参数， 而 "end" 事件回调函数则不接收任何参数。这些参数是 API 协议的一部分，也是随机指定的， 这些回调函数的参数签名也会在每个事个发射器的 API 规范里有所说明。

虽然事件发射器是服务任意类型事件的通用接口，但在 Node 的实现中有一个特例，即 "error" 事件，Node 中的大多数事件发射器实现在程序发生错误时都会发射 “error” 事件。 如果程序员选择不监听 "error" 事件， 则当 "error" 事件发生时，事件发射器会注意到它， 并向上抛出一个未捕获的异常。

可以在 Node REPL 里运行下面的代码来测试一下效果，这段代码模拟了一个能发射两种类型事件的事件发射器：

```js
var em = new (require('events').EventEmitter)();

em.emit('event1');

em.emit('error', new Error('My mistake'));
```

然后会看到如下所示的输出信息：

```bash
events.js:183
      throw er; // Unhandled 'error' event
      ^

Error: My mistake
    at Object.<anonymous> (/Users/WAHAHA/Projects/Node/event/app.js:3:18)
    at Module._compile (module.js:635:30)
    at Object.Module._extensions..js (module.js:646:10)
    at Module.load (module.js:554:32)
    at tryModuleLoad (module.js:497:12)
    at Function.Module._load (module.js:489:3)
    at Function.Module.runMain (module.js:676:10)
    at startup (bootstrap_node.js:187:16)
    at bootstrap_node.js:608:3
```

随便发射一个 “event1” 的事件没有任何效果，但是在发射 “error” 事件时，错误就会被抛出到堆栈。如果程序不是运行在 REPL 命令行环境中里，就会因为这个未捕获到的错误而挂起。

一般而言，应该总是监听错误事件，并对其进行恰当的处理。

## 应用事件发生器 API

任何实现了事件发射器模式的对象（比如 TCP 套接字、HTTP 请求等），都实现了如下一组方法：

* `.addListener`和 `.on` —— 为指定类型的事件添加事件监听器。

* `.once` —— 为指定类型的事件绑定一个仅会被调用一次的事件监听器。

* `.removerEventListener` —— 删除绑定到指定事件上的某个指定的事件监听器。

* `.removeAllEventListener` —— 删除绑定到指定事件上的所有事件监听器。

下面将详细介绍它们。

### 使用 `.addListener()` 和 `.on()` 绑定回调函数

通过指定事件类型和回调函数，就可以注册当事件发生时所要调用的操作。例如，当有可用的数据块时，文件可读流就会发射 “data” 事件，下面的代码展示了如何通过传入一个回调函数来通知发生了 “data” 事件：

```js
function receiveData (data) {
    console.log('Got data from file read stream :%j', data);
}

readStream.addListener('data', receiveData);
```

还可以用函数 `.on`来代替 `.addListener` ，它只是 `.addListener`的简写形式，下面这段代码和上面那段代码是等效的：

```js
function receiveData (data) {
    console.log('Got data from file read stream :%j', data);
}

readStream.on('data', receiveData);
```

在上面的代码中用一个事先声明的命名函数作为回调函数， 当然也可以使用内联匿名函数代替命名函数以简化代码：

```js
readStream.on('data', function (data) {
    console.log('Got data from file read stream :%j', data);
});
```

正如前面所指出的那样，传递给回调函数的参数取决于特定的事件发射器对象与事件类型，它并没有被标准化， "data" 事件可能会传递数据缓冲区，"error" 事件可能会传递一个错误对象， 而流的 "end'' 事件则不会向事件监听器传递任何参数。

### 绑定多个事件监听器

事件发射器模式允许多个事件监听器监听同一事件发射器发射的同一类型的事件，例如：

```js
readStream.on("data", function (data} {
    console.log('I have some data here.');
});

readStream.on('data', function (data) {
    console.log('I have some data here too.');
});
```

在上面的代码中，readStream 对象的 “data” 类型事件上绑定了两个函数，每当 readStream 对象发射 “data” 事件时，就会看到如下所示的输出信息：

```bash
I have some data here.
I have some data here too
```

根据事件类型，事件发射器负责按照事件所绑定的监听器的_注册顺序_依次调用事件监听器， 这意味着以下两件事：

* 某个事件监听器也许并不会在事件发射之后立即被调用，也许在它之前会有别的事件监听器被调片。

* 异常被抛出到堆栈并不正常，它通常是由代码中的错误引起的。当事件被发射时，如果其中某个事件监听器在被调用时抛出错误，可能会导致一些事件监听器永远都不会被调用， 在这种情况下，事件发射器将会捕捉到错误，也许还会处理它。

考虑下面这个例子：

```js
readStream.on('data', function (data) {
    throw new Error("Something wrong has happened");
});

readStream.on('data', function (data) {
    throw new Error("I have some data too.");
});
```

本例中由于第一个事件监听器抛出了一个错误， 所以第二个事件监听器也就不会被调用。

### 使用 `.removeListener()` 从事件发射器中删除一个事件监听器

如果希望当一个对象发射了某个特定事件时不再收到通知的话， 可以通过指定事件类型和回调函数来取消注册的事件监听器， 示例代码如下所示：

```js
function  receiveData(data) {
    console.log("got data from file read stream: %j", data);
}
readStream.on("data", receiveData);
// ...
readStream.removeListener("data", receiveData);
```

在上面的例子中， 最后一行把一个可能在将来被随时调用的事件监听器从事件发射器对象中删除。

为了删除指定的事件监听器，就必须为回调函数命名， 因为回调函数名至少要在两处用到 —— 注册和删除事件监听器时。

### 使用 `.once()` 使回调函数最多执行一次

如果想监听最多只发生一次的事件， 或者只是对某个类型的事件第一次发生时感兴趣， 则可以使用 `.once()` 函数。

该方法增加了一个事件监听器，并在第一个事件发生后删除它。

```js
function receiveData (data) {
    console.log("got data from file read stream: %j", data);
}
readStream.once("data", receiveData);
```

在上面的代码中，`receiveData` 函数只会被调用一次，如果在 `readStream` 对象上发射  "data" 事件， `receiveData` 回调函数仅会被触发一次。

这是个方便的方法， 因为可以很容易就实现它， 如下所示：

```js
var EventEmitter = require("events").EventEmitter;
EventEmitter.prototype.once = function (type, callback) {
    var that = this;
    this.on(type, function listener () {
        that.removeListener(type, listener);
        callback.apply(that, arguments);
    });
};
```

在上面的代码中，重新定义了 `EventEmitter.prototype.once` 函数，这相当于重新定义了继承自 `EventEmitter` 所有对象的 `once` 方法，并在获取事件后使用 `.removeListener()` 方法取消了回调函数的注册，同时调用原来的回调函数。

> **\[info\]** 注意：
>
> 在上面的代码中用到了如 [`function.apply()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/apply) 方法，该方法接受一个对象以及一个参数数组，并将接受的对象作为一个隐含的 this 变量。在上面的例子中，向回调函数传入了一个未经修改的参数数组，也即允许事件发射器将所有参数原封不动且透明地传送给回调函数。

### 使用 `.removeAlIListeners()` 从事件发射器删除所有事件监听器

可以从事件发射器中删除所有针对某一指定类型的事件而注册的事件监听器， 如下所示：

```js
emitter.removeAllListeners(type);
```

例如， 如果想删除进程中断事件的所有事件监听器， 那么可以这样做， 如下所示：

```js
process.removeAllListener("SIGTERM")
```

> **\[info\]** 注意：
>
> 一般而言，本书建议你仅在确实知道要删除的对象时才使用该函数，否则就应该让应用程序的其他部分删除事件监听器集合，或者也可以让应用程序的那些部分自己负责删除事件监听器集合。但不管怎样，在一些罕见的情况下，该函数还是很有用的，例如在按顺序关闭事件发射器甚至关闭整个进程时。

## 创建事件发射器

事件发射器提供了一种很好的方法来构建更为通用的编程接口。在一个常见易懂的编程模式中，客户端用绑定事件来代替回调函数，这会使程序更加灵活。

此外， 通过使用事件发射器， 还可以免费获得一些特性，比如在一个事件上绑定多个独立的事件监听器。

### 从 Node 事件发射器继承

如果有兴趣在自己的应用程序中自始至终都使用 Node 事件发射器， 那么可以创建一个继承自 EventEmitter 的伪类， 示例代码如下所示：

```js
var util = require('util');
var EventEmitter = require('events').EventEmitter;
// MyClass的构造函数
var MyClass = function () {
}
util.inherits(MyClass, EventEmitter);
```

> **\[info\]** 注意：
>
> `util.inherits` 建立了一条原型链，使 MyClass 类实例能够使用 EventEmitter 类的原型方法。

### 发射事件

通过创建继承自 EventEmitter 的类，MyClass 的类实例就可以发射事件了：

```js
MyClass.prototype.someMethod = function () {
    this.emit("custom event", "argument 1", "argument 2");
};
```

此处当 someMethod 方法被 MyClass 的实例调用时，就会发射一个名为 custom event 的事件，该事件还会发射若干数据，本例中是：“argument 1” 和 “argument 2”，他们将作为参数传递给事件监听器。

MyClass 类实例的客户端可以监听 custom event 事件，示例代码如下：

```js
var myInstance = new MyClass();
myInstance.on('custom event', function(str1, str2) {
    console.log('Got a custom event with the str1 %s and str2 %s', str1, str2);
});
```

例如，可以创建一个名为 Ticker 的伪类，让它每秒发射一个 “tick” 事件：

```js
var util = require('util');
EventEmitter = require('events').EventEmitter;

var Ticker = function () {
    var self = this;
    setInterval(function () {
        self.emit('tick');
    }, 1000);
};
util.inherits(Ticker, EventEmitter);
```

Ticker 类的客户端可以实例化该类，并监听 “tick” 事件，如下所示：

```js
var ticker = new Ticker();
ticker.on('tick', function () {
    console.log('tick');
});
```

## 本章小结

事件监听器是 Node 中的一种可重入模式，可以用它将事件发射器对象与关注一组特定的代码解耦。

可以使用 `event_emitter.on()` 为特定类型的事件注册事件监听器， 还可以使用 `event_emitter.removeListener()` 取消注册。

此外，还可以通过继承 EventEmitter 类以及简单地使用 `.emit` 函数来创建自定义的事件发射器。




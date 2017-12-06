# 读写数据流

**本章提要：**

* 流接口简介

* 从可读流获取数据

* 控制可读流的流动

* 向可写流写入数据

* 解决慢速客户端问题

* 使用管道将两种流混合在一起

Node 中有一个抽象概念：**『流』**。更为特别的是两个非常有用的抽象概念：**『可读流』**和『可写流。它们是通过几个 Node 对象来实现的，代表数据的向内流动（可读流）与向外流动（可写流）。流的一个例子是 TCP 套接字，可以在其上进行读写操作，流的另一个例子是文件，可以对其按顺序进行追加和读取。你已经和它们中的一些成员见过面了， 但本章将以一种更为正式和抽象的方式介绍它们， 为一些更具体的例子做好准备。

> **\[info\] 注意：**
>
> 流是由几个 Node 对象实现的抽象概念，创建或者获取流的方式取决于使用流的类型。例如， 可以基于文件显式地创建一个可读流或者可写流。但是，服务器端的TCP 套接字流只有在客户端连接时才能为你所用。
>
> 除了可读流或可写流的特性外， 一个对象还可以具有其他一些特殊的属性或行为。例如， 文件可读流还包含“路径” 属性， 而这一属性在其他类型的流中也许并不存在。

## 使用可读流

可读流就好像是个数据阀门。在创建或者获取个可读流之后（创建或者获取可读流的方法取决于流的类型）可以对其进行控制。可以通过暂停和恢复来控制数据流动， 可以在数据可用时得到通知，并且在流终止时你也会得到通知并能够关闭它。

### 等待数据

流能够以「块」为单位发送数据。通过监听 `"data"` 事件，在流每次提交块数据时，你都会得到通知。可以以「缓冲区」或「字符串」的形式获取数据，这取决于流的编码设置。

通过绑定到 `"data"` 事件上的事件处理程序可以传送数据。 根据流的编码格式，也许会用字节缓冲区以原始形式传送数据，或者，如果用 `stream.setEncoding()` 函数定义了流的编码格式， 数据就会以某种编码格式的字符串形式进行传送， 如下面两个例子所示：

```js
// 可读流1
var readable_stream1 = ... 
readable_streaml.on('data', function (data) {
    // 数据是缓冲区
    console.log('got this data: ', data);
});

// 可读流2
var readable_stream2 = ...
// 设置编码格式为 utf8 
readable_stream2.setEncoding('uft8');
readable_stream2.on('data', function (data) {
    // 数据是 utf-8 编码的字符串
    console.log('got this data: ', data);
});
```

在第一个例子中，因为没有指定编码格式，所以数据是作为缓冲区传送的。在第二个例子中，数据是作为 utf-8 编码格式的字符串传送的。

> **\[info\] 注意**
>
> 因为 UTF-8 字符可能是多字节的，所以当你希望获取 UTF-8 字符时，也许需要在两个独立的 “data” 事件发生之后才能获得一个字符，当你将编码格式设置为 utf8 时，流仅会在一个字符完整的情况下传送它。

### 暂停与恢复流

可读流就像一个阀门，可以通过暂停来阻止数据流动。如下所示：

```js
stream.pause();
```

执行上面的代码之后， 就再也不会接收到 `"data"` 事件了。 正如读者将在后面看到的那样，这个特性可以帮你规避隐含缓冲区。

> **\[info\] 注意：**
>
> 暂停流在不同的情况下会被解释成不同的行为。例如，如果是个文件流，Node 就会停止从该文件中读取数据。如果流是一个TCP 套接宇，Node 就不再会读取新的数据包，这会终止从其他终端来的数据包流。 其他对象对 pause 的实现各不相同。

当想恢复被暂停的流时，只需要调用 `stream.resume()` 方法，就会重新打开阀门，数据也就再次被传送出来，直到再次暂停流或者流终止为止。

### 了解流何时终止

流会终止。例如，如果用一个可读流来传送文件的内容，当到达文件结束位置时，流会发送 `"end"` 事件。类似的，如果用一个 HTTP 流传送请求主体，流也会发送 `"end"` 事件。可以像下面这样监听 `"end"` 事件：

```js
var readable_stream = .. .. 
readable_stream.on('end', function() {
    console.log('the stream has ended'); 
}) , 
```

可读流终止后， 你就再也接收不到 `"data"` 事件了。

## 使用可写流

可写流是一个抽象概念，可以向其发送数据。它可能是一个文件，或则是一个 TCP 网络连接，甚至可能是一个对象，用来输出被转换的数据。例如，压缩文件。本节将学习向可写流写入数据和清空事件。

### 将数据写入可写流

通过向可写流传入缓冲区或者字符串，可以将字符串写入其中，如下所示：

```js
var writeable_stream = ...;
writeable_stream.write('this is an UTF-8 string');
```

如果将一个字符串传递给 `write` 函数，作为第一个参数，就可以将字符串的编码格式也传递给该函数，作为第二个参数。否则，流会假定字符串采用的是 UTF-8 编码。

下面是一个向 `write` 函数传入另一种编码格式的例子：

```js

var writable_stream. = ... ; 
writable_stream.write('7e3e4acde5ad240a8ef5e7 31e644fbdl', 'base64');
```

如前所述，也可以向 `write` 函数传入缓冲区来写入数据：

```js
var writeable_stream = ...;
var buffer = new Buffer('this is a Buffer with some string');
writeable_stream.write(buffer);
```

一旦向流写入数据，Node 可以立即将数据传递到内核缓冲区（ kernel buffer ）中，如果此时没有内核缓冲区，Node 就会将数据存储到一个队列中，这个队列位于内存中。可以通过观察调用 `writeable_stream.write()` 函数的返回值确定发生了何种事件。`write` 命令将返回一个布尔值，如果数据被传递到内核缓冲区中，该值为true，如果数据被存入队列中，则该值为false。在本节的后面将看到该信息有何帮助。

### 等待流被清空

因为 Node 不会在 I/O 操作上产生阻塞，所以它也不会在读或写命令上产生阻塞。正如已经看到的那样，在调用写命令时你会知道缓冲区是否被立即刷新， 如果没有被刷新，将其存储在进程内存中。

稍后当流成功刷新挂起的缓冲区时，就会发射 `"drain"` 事件，可以监听该事件：

```js
var writeable_strem = ...;
writeable_strem.on('drain', function () {
    console.log('drain emitted');
});
```

在本章的后面你将看到具有暂停和恢复功能的清空通知如何限制 Node 进程的内存增长。

## 考虑几个流的例子

到目前为止，已经介绍了抽象的流接口。下面来看看几个 Node 实现流接口的例子。

### 创建文件系统流

可以用文件路径创建一个可读流，如下所示：

```js
var fs = require('fs');

// 返回一个新建的 ReadStream 对象
var rs = fs.createReadStream('/path/to/file');
// ...
```

可以向 `fs.createReadStream()` 函数传递第二个参数，这个参数具有几个选项，在这个参数中，可以指定文件的起始位置和结束位置、编码格式、标志位以及缓冲区大小。options 参数如下所示：

* `flags` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)  与[第 7 章](/fs/README.md) 打开文件的 `flag` 相同。

* `encoding` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) `"data"` 事件发送的字符串的编码格式，如果想使用未经处理的缓冲区，该值为 null。
* `fd` [&lt;integer&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) 如果有一个已经打开的文件描述符，则可以使用此选项传递给函数。默认为null。如果指定了`fd`，则`ReadStream`会忽略`path`参数并且会使用指定的文件描述符。这意味着不会触发`'open'`事件。
* `mode` [&lt;integer&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)  用于设置文件模式（权限和粘结位），但仅限创建文件时。
* `autoClose` [&lt;boolean&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) 如果`autoClose`为`false`，则文件描述符不会被关闭，即使有错误。 应用程序需要负责关闭它，并且确保没有文件描述符泄漏。 如果`autoClose`被设置为`true`（默认），则在`error`或`end`时，文件描述符会被自动关闭。
* `start` [&lt;integer&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) 文件中第一个被读取的字节的位置，用来读取一定范围内的数据，而不是读取文件的全部数据。
* `end` [&lt;integer&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) 文件中最后一个被读取的字节的位置，用来读取一定范围内的数据，而不是读取文件的全部数据。

> **\[info\] 注意：**
>
> 如果已经有了一个打开的文件，可以用fd选项从文件中创建可读流：
>
> ```js
> var fs = require('fs');
>
> fs.open('/path/to/my/file', function (err, fd) {
>     if (err) {
>         throw err;
>     }
>     var rs =  fs.createReadStream(null, {fd: fd, encoding: 'utf8'});
>     rs.on('data', function (data) {
>         console.log('data: ', data);
>     });
> });
> ```

此外，如果指向读取文件中的一部分，可以使用 `start `和 `end` 选项：

```js
var fs = require('fs');
var path = '/path/to/my/file';

// 从第 10 个字节开始读取
var options = {
    start: 10
}
var rs = fs.createReadStream(path, options);
```

还可以设置读取结束位置：

```js
var fs = require('fs');
var path = '/path/to/my/file';

// 从第 10 个字节开始读取, 读完第 20 个字节后结束
var options = {
    start: 10,
    end: 20
}
var rs = fs.createReadStream(path, options);
```

开始位置和结束位置不一定要成对出现。

还可以创建一个文件可写流：

```js
var fs = require('fs');

// 返回一个新建的 WriteStream 对象
var ws = fs.createWriteStream(path, options);
```

`fs.createWriteStream()` 也可以接收一个选项对象作为其第二个参数，选项对象有以下可选属性：

* `flags` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)

* `encoding` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)

* `fd` [&lt;integer&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)

* `mode` [&lt;integer&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)

* `autoClose` [&lt;boolean&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)

* `start` [&lt;integer&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)

从上数选项可以看到，与`fs.createReadStream()` 几乎无异，只是少了一个`end` 选项。它们所代表的含义也相似。

### 理解网络流

Node 中网络 API 上有集中类型的流。例如，客户端的 TCP 连接即是可写流，又是可读流，服务器连接也是如此。

HTTP 的请求对象是一个可读流。HTTP 响应对象是一个可写流。

在本章后面将介绍每一种类型的流。现在只要记住这些流都有一个通用的接口，也就是说可以交替使用这些对象。还可以一次性抽象出一些问题并解决这些问题。慢客户端问题就是问题之一。

## 避免慢客户端问题以及挽救服务器

当有进程读取数据，并将数据（或者数据的变换形式）发送给另一个进程时，一般就会有慢客户端问题。

### 理解慢客户端问题

Node 在处理 I/O 操作时不会产生阻塞，也就是说 Node 不会阻塞数据的读写操作——如果用 `write` 无法将数据写入内核缓冲区，就会缓存数据。想象一下这样的场景：将数据传入一个可写流中（比如到浏览器的 TCP 连接），而数据源是一个可读流（比如文件可读流）。

```js
var fs = require('fs');

require('http').createServer(function (req, res) {
    var rs = fs.createReadStream('/path/to/big/file');

    rs.on('data', function (data) {
        res.write(data);
    });

    rs.on('end', function () {
        res.end();
    });
}).listen(3000);
``` 
如果是本地文件，可读流的速度应该是快的。然而，如果客户端的连接是慢速的，可写流也就是慢速的。刻度流会快速产生 `"data"` 事件，同时数据将被发送到可写流。然而，Node 最红不得不缓存数据，因为内核缓冲区被填满。

实际上，对于每个 write 命令而言，文件都会在内存中被缓存。随着请求成倍的增长，要不了多一会儿就会产生内存增长的问题。一般而言，如果既有数据产生者，又有数据消费者，并且数据产生比数据消费要快，就要缓存数据。因此需要暂停数据产生这，知道数据消费者赶上来为止。

### 避免慢客户端问题

在大多数情况下， 可以通过暂停数据生产者来避免填满具有未刷新缓冲区的内存——可读流——以便让消费者的数据——可写流——不会被传入内核缓冲区中。幸好，Node 的可读流有一些可以满足需求的功能：可以暂停和恢复可读流。下面是一个控制数据流的例子：

```js
var fs = require('fs');

require('http').createServer(function (req, res) {
    var rs = fs.createReadStream('/path/to/big/file');

    rs.on('data', function (data) {
        // 前面的章节已经讲到，write函数会返回一个布尔值
        // 当数据存入内核缓冲区的时候返回true
        // 当数据存入缓存的时候的返回false
        // 这里检测数据是否被缓存，被缓存说明前面的数据有积压。
       if (! res.write(data)) {
           rs.pause();
       }
    });

    // 当流成功刷新挂起的缓冲区时，就会发射 "drain" 事件
    rs.on('drain', function () {
        rs.resume();
    });

    rs.on('end', function () {
        res.end();
    })
}).listen(3000); 
```

在上面的例子中，创建了一个服务器在 3000 端口，并将文件 `/path/to/big/file`的内容提交给所有 HTTP 请求。

如果 write 命令无法将可读流传入内核缓冲区，可读流就会被暂停。当可写流完成接收数据时，会触发 `"drain"` 事件，这时再恢复可读流。

### 应用 `stream.pipe()`避免慢客户端问题与使用 `pipe()` 集成可读流和可写流

暂停可读流知道可写流赶上之后恢复可读流是一种循环模式，Node 提供一个函数 `stream.pipe()` 来简单实现这个模式。

`stream.pipe()` 命令是可读流接口的一部分——由传输源调用——并接受目标可写流作为第一个参数。

如果在上面的例子中使用 `pipe()`方法，可以极大的简化代码：

```js
fs = require('fs');

require('http').createServer(function (req, res) {
    rs.createReadStream('/path/to/big/file');
    rs.pipe(res);
}).listen(3000);
```

默认情况下，`end()` 会在可读流结束时，在可写流上被调用。 为了避免这种情况，可以将 `end: false` 传入 `pipe()` 函数，作为其第二个参数，这个参数是一个选项对象，如下所示：

```js
fs = require('fs');

require('http').createServer(function (req, res) {
    rs.createReadStream('/path/to/big/file');

    // 传入选项对象
    rs.pipe(res, {end: false});

    rs.on('end', function () {
        res.write("And that's all, folks.!");
        res end () ; 
    });
}).listen(3000);

```

在上面的代码中，在文件结束时写入字符串 "And that's all, folks.!" ， 然后结束请求，而不是让 `stream.pipe()` 方法进行这项工作。

## 本章小结

流是一种极好的抽象，允许利用 Node 的架构来轻松实现任意对象的流，这些对象实现了流 API。

流接口可以让你控制数据流动，以缓解慢客户端问题，即可以停止和恢复可读流。通过使用 `stream.pipe()` 方法可以实现该过程的自动化，这**对于任何可读流实例都适用**。
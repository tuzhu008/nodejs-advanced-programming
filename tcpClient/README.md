# 构建 TCP 客户端

**本章提要：**

* 连接 TCP 服务器

* 从 TCP 服务器收发数据

* 重启已断开的连接

TCP 位于 IP 的上一层，是应用最广泛的互联网传输协议之一，在其之上就是类似 HTTP 这样的应用层协议。TCP 是一种面向连接的协议，这意味着一个终端需要和另一个终造建立专门的连接，该连接是双向数据流，两个终端可以同时通过该数据流收发数据。TCP 可以保证所收到的消息是有序的，它有一套内置的数据流控制机制， 使它成为一个良好的平台，可以支持计算机到计算机以及人到计算机的协议。

如你将看到的那样，Node 可以非常容易地构建一个 TCP 客户端来建立到另一个终端的连接，该终端通常被称作 TCP 服务器。建立的连接形成了两个数据流，允许你和远程终端进行交互： 一个是接收数据的可读流，另一个是写入数据的可写流。

> **[info] 注意：**
>
> 应该牢记在心的一点是：在往TCP数据流中写入数据时，不会收到对方收到数据的确认信号。更糟糕的是，因为底层的网络实现也许会随机地切分和路由数据包，所以接收方也许只能收到一部分发送的信息（即使 TCP 内部尝试重发丢失或损坏的数据包）。请记住 TCP 只能保证数据包被应用程序按顺序接收，却不能保证它们被全部接收。
>
> 而且，TCP 并不是面向消息的，它只提供了一个连续数据流。如果需要识别单独的消息，就必须实现一个帧协议，指定每个消息的起始位置和结束位置。
>
> 例如，HTTP 凭借应用程序解决了上述问题，该应用程序需要一个来自服务器的请求—－响应工作流，并且请求和响应消息都被明确定界。

## 连接服务器

可以使用 `net` 模块来连接 TCP 服务器。如下所示：

```js
var net = require('net');
var port = 3000;
var conn = net.createConnection(port);
```

注意此处省略了 `net.createConnection` 函数的第二个参数，它表示想连接的主机名。在缺省该参数的情况下， 主机名默认是 `"localhost"`。

```js
var net = require('net');
var port = 3000;
var host = 'www.baidu.com';
var conn = net.createConnection(port, host);
```

可以传递一个回调函数作为 `net.createConnection` 函数的最后一个参数， 这样在连接建立之后就可以得到通知， 如下所示：

```js
function connectionListener (conn) {
    console.log('We have a new connection') ;
}

var conn = require('net').createConnection(port, host, connectionListener);
```

如果尝试连接本地主机，就可以省略 `host` 参数，而是传递连接监听器回调函数作为 `net.createConnection` 的第二个参数。

```js
var conn = net.createConnection(port, connectionListener);
```

还可以监听 `conn` 对象发射的 `connect` 事件：

```js
conn.once('connect', connectionListener) ,
```

## 发送和接收数据

调用 `net.createConnection()` 函数的返回值是 `net.Socket` 类的一个实例，它表示与服务器的连接，它**既是可读流也是可写流**，允许你发送某些数据：

```js
conn.write('here is a string for you!') ;
```

还可以传递一个字符串，并指定字符串的编码格式：

```js
conn.write('SGVsbG8gV29ybGQh', 'base64');
```

还可以向服务器写入一个未经处理的缓冲区：

```js
var buffer == new Buffer('Hello World!'); 
conn.write(buffer);
```

在上述变量之后还可以传递一个回调函数：

```js
conn.write('Hey!', function () { 
    console.log('data was written out');
}
```

注意这个回调函数并不会在服务器接收数据时被调用，而只会在数据被写入网络时被调用。

当数据可用时，连接都会发射 `data` 事件，可以通过监听该事件接收来自服务器的数据：

```js
conn.on('data', function (data) { 
    console.log('some data has arrived:', data); 
});
```

如果没有指定流的编码格式，那么传入的数据就是一个缓冲区，如果想要这个缓冲区在发送之前被编码，就需要使用 `setEncoding` 为其指定编码格式：

```js
conn.setEncoding('base64');
```

正如在第4章“使用缓冲区处理、编码和解码二进制数据”中介绍的那样，可以使用 `ascii`、`utf8`或者 `base64` 作为编码标识符。

## 终止连接

可以使用 `end` 方法关闭来自终端的连接：

```js
conn.end();
```

这将安排连接在**所有数据都被都传送完之后被关闭**，在终止连接的同时，也可以发送数据（缓冲区或字符串）：

```js
conn.end('Bye bye !', 'utf8');
```

这等效于：

```js
conn.write('Bye bye !', 'utf8');
conn.end();
```

> **[warning] 警告：**
>
> 当终止连接时，实际上是将该操作放入队列中，这意味着连接不会立刻被关闭。 同样，当连接收到 `"ended"` 通知时，会发送一个 `FIN` 数据包，这意味着服务器仍旧可以发送部分数据。
>
> 基于以上两点原因，在终止连接之后，依然可以接收 `“data”` 数据。

## 处理错误

在建立连接时，可能会发生错误——在DNS上没有找到主机名、目标主机无法访问或者连接被拒绝——在连接已经建立起来之后，也可能会发生网络错误。可以通过监听 `error` 事件来捕捉错误，如下所示：

```js
conn.on('error', function (err) {
    conso上e.error{'this error happened:' + err.message + ', code: ' + err.code);
});
```

除了 `message` 属性外，与网络相关的错误还有一个 `code` 属性，它是一个字符串，可以查看和测试他。例如，如果请求的连接被拒绝，你会得到一个 `ECONNREFUSED` 代码。

```js
var net = require('net');
var conn = net.createConnection('82837');
conn.on('error', function (err) {
    console.log('I got this error code: ', err.code);
});
```

最后一段代码应该会输出如下信息：

```bash
I got this error code: ECONNREFUSED
```

## 创建命令行 TCP 客户端示例

下面将要创建一个简单的TCP客户端，该客户端尝试连接到服务器上，然后将从其中收发数据。你将用到在第10章“构建TCP服务器”中构建的 TCP 服务器，并实现连接到其上的客户端。

首先需要在后台启动这个 TCP 服务器，并让其在 4001 号端上监听，为客户端进行连接做好准备。

### 连接服务器

在下面的例子中，将连接到本地的 4001 号服务端口，同时监听任哥可能发生的错误。

```js
var net =  require('net');
var port = 4001;

var conn = net.createConnection(port);

conn.on('connect', function () {
    console.log('connected to server');
});

conn.on('error', function (err) {
    console.log('Error in connection:', err);
});
```

### 向服务器发送命令行

当 Node 进程启动时，就准备好了 `process.stdin` 流来接受用户的键盘输入。这个可读流初始化时处于暂停状态，只有在恢复它之后，才会发射 `"data"` 事件，可以调用流上的 `resume` 方法来恢复流：

```js
process.resume();
```

现在已经有了到服务器的可写流，也有了来自用户输入的可读流，可以使用 `pipe()` 方法将它们一体化，如下所示：

```js
process.stdin.pipe(conn)
```

现在， 当 `process.stdin` 流被清空——这通常发生在用户输入一行新字符之后——数据就会就会通过 `conn` 可写流传送到服务器。

### 打印服务器信息

可以将服务器发送给进程标准输出流的每条消息都打印出来，最简单的方法是传送连接输出，如下所示：

```js
conn.pipe(process.stdout);
```

然而，上一行命令有一个问题，在默认情况下， `sourceStream.pipe(targetStream)` 会在源流结束时终止目标流，这意味着进程的标准输出流会在连接关闭之后关闭，这不是你希望的结果。幸好，`.pipe()` 方法可以接受一个 `end` 选项，当将该选项设置为 `false` 时可以避免这种情况的发生。

```js
conn.pipe(process.stdout, {end: false});
```

### 在连接终止时重新连接

TCP 连接也许会远程服务器关闭，一旦网络出现问题，它也有可能被关闭。甚至连接处于空闲状态的事件过长也可能被关闭。在任何情况下，只要应用程序需要，很容易就可以和服务器重新建立连接，如下：

```js
var net = require('net');
var port = 4001;
var conn;

// 恢复进程的标准输入流
process.stdin.resume();

// 自执行的连接函数
(function connect () {
    conn = net.createConnection(port);
    
    conn.on('connect', function () {
        console.log('connected to server');
    });

    conn.on('error', function (err) {
        console.log('Error in connection:', err);
    });

    conn.on('close', function () {
        console.log('connection got close, will ry to reconnect');
        // 重连
        connect();
    });

    // 将进程的标准输入流对接到 conn
    process.stdin.pipe(conn);

    // 将conn 的输出对接到进程的标准输出流
    conn.pipe(process.stdout, {end: false});
}());
```

在上面的代码中，通过立即调用本地函数 `connect` 来进行连接。

当连接上发生错误时，你会得到一个 `error` 事件，然后连接会关闭并触发 `close` 事件。当 `close` 事件发生时，上述代码尝试通过调用本地函数 `connect()` 立即进行重新连接（在后面
你会到这是个糟糕的主意），`connect` 函数会将全部连接逻辑再次执行一次。

可以尝试一下上述过程，当连接成功后，关闭服务器后再重启它， 然后应该可以看到客户端重新连接成功。

然而，并不推荐你在连接断开后立即重新进行连接，也不推荐你不断重试连接，这样做会产生一种循环，使网络上充斥着连接请求，这样一来，服务器在断开连接一段时间后也许无法访问。取而代之的方式是等一小会儿，等待网络的状态有所改善，或者是等待服务回到在线状态。在几次重新连接失败后，应该停止尝试重新连接————此时的问题也许就可能不是通过重新连接所能解决的了：它也许是永久性的网络问题或者服务器问题。此时用户应该得到通知，并且程序应该至少在相当一段时间内自动停止尝试重新连接。

在本例中，我们将重试的事件间隔变量 `retryInterval` 设置为 3 秒，并且将最多重试次数 `maxRetries` 限制为 10 次，这两个数值都是随意的，可以基于一定的应用程序进行自定义。

```js
var net = require('net');
var port = 4001;
var conn;

// 重新连接相关变量
var retryInterval = 3000; // 3秒
var retriedTimes = 0;
var maxRetries = 10;

process.stdin.resume();

(function connect () {
    // 重连函数
    function reconnect () {
        if (retriedTimes > maxRetries) {
            throw new Error('Max retries have been exceeded, I give up.');
        }
        retriedTimes ++;
        setTimeout(connect, retryInterval);
    }
    conn = net.createConnection(port);
    
    conn.on('connect', function () {
        console.log('connected to server');
        // 连接成功时重置重连计数器
        retriedTimes = 0;
    });

    conn.on('error', function (err) {
        console.log('Error in connection:', err);
    });

    conn.on('close', function () {
        console.log('connection got close, will ry to reconnect');
        // 调用重连函数
        reconnect();
    });

    process.stdin.pipe(conn);
    conn.pipe(process.stdout, {end: false});
}());

```

在上面的代码中，通过在变量 `retriedTimes` 中存储一个计数器，来跟踪尝试重新连接的次数，一旦连接成功，`retriedTimes` 的值就被重置为 0。

### 关闭连接

只需需要调用 `conn.end` 就可以关闭连接，如下：

```js
conn.end()
```

在上面这个简单的应用程序中，你知道用户在控制台中输入 `"quit"`时希望断开连接，可以检测这个事件并进行相应的操作：

```js
process.stdin.on('data', function (data) {
    if (data.toString().trim().toLowerCase() === 'quit') {
        conn.end();
        process.stdin.pause();
    }
})
```

注意同时还结束了标准输入流，让 Node 知道你不再对它感兴趣。

这段代码运行得并不是很好，因为你仍然尝试向服务器传送所有数据，而不管这些数据是不是 `"quit"`，这意味着你也许会向一个已被关闭的连接发送数据。替代的办法是删除下面的传送命令：

```js
process.stdin.pipe(conn);
```

你必须在用户没有退出之前发送数据：

```js
process.stdin.on('data', function (data) {
    if (data.toString().trim().toLowerCase() === 'quit') {
        console.log('quitting...');
        conn.end();
        process.stdin.end();
    } else {
        conn.write(data);
    }
});
```
当连接关闭时，客户端会尝试重新连接，这样就改写了用户指令， 因此，必须维户一个变量来说明用户是否想退出，这样就会避免重新连接的出现。

```js
var quitting = false;
```

```js
process.stdin.on('data', function (data) {
    if (data.toString().trim().toLowerCase() === 'quit') {
        console.log('quitting...');
        quitting = true;
        conn.end();
        process.stdin.end();
    } else {
        conn.write(data);
    }
});
```

```js
 conn.on('close', function () {
    if (! quitting) {
        console.log('connection got close, will ry to reconnect');
        // 调用重连函数
        reconnect();
    }
});
```

### 前述内容综合

下面是上面的示例的完整代码，展示了一个具有重新连接和退出功能的 TCP 客户端。

[include](./chatClient.js)


## 本章小结

TCP是面向连接的协议，可以为你按序处理消息和控制数据流，TCP 是一个很好的传输层协议，在其上能够创建客户端－服务器协议。

在 Node 中构建 TCP 客户端很容易，当尝试与 TCP 服务器建立连接时，`net.createConnection()` 会返回一个 `net.Socket` 实例，它既是可读流，又是可写流，也可以用该实例传输数据。然后可以从连接发送和接收数据，这些数据既可以是未经处理的缓冲区，也可以是进行了编码的字符串。

应该监听来自连接的错误事件，并且当连接关闭时也应该检测到。可以使用 `close` 事件尝试重新建立连接，但是此时必须十分小心。在尝试两次重建连接之间等上片刻，同时设置允许连接失败的最大次数，以避免应用程序陷入无限循环。
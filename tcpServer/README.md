# 构建 TCP 服务器

**本章提要：**

* 创建 TCP 服务器

* 关闭服务器端的 TCP 连接

* 处理网络错误

* 通过管道从 TCP 连接读写数据

* 构建一个 TCP 聊天服务

传输控制协议\(Transmission Control Protocol，TCP\)是 Internet 的基础协议之一， 它位于网际协议\(Internet Ptotocol, IP\)之上，为应用层提供了一种传输机制。例如， HTTP 工作在 TCP 之上， 其他很多面向连接的应用（诸如iRC、SMTP 和 IMAP\)也工作在 TCP 之上。

Node 以 `http.Server` 中伪类的形式一流地实现了HTTP 服务器，该伪类继承自 `net.Server` 中的 TCP 服务器伪类，这意味着本章中叙述的所有内容同样能应用到 Node HTTP 服务器中。

## 创建 TCP 服务器

可以 `net` 模块创建 TCP 服务器，如下所示：

```js
require('net').createServer(function (socket) {
    // 新链接
    socket.on('data', function (data) {
        // 获取数据
    });

    socket.on('end', function () {
        // 关闭链接
    });

    socket.write('Some string');
}).listen(3000);
```

在第 1 行中用到了 `net` 包中的 `createServer()` 方法，并在最后将服务器绑定到 3000 端口上。可以向 `createServer()` 传递一个回调函数，每当有新的 `"connection"` 事件发生时都会调用该回调函数。在回调函数内部会提交一个套接字对象，可以应用该对象从客户端获取数据或者向客户端发送数据。

因为服务器对象也是一个事件发射器，所以也可以在其生命周期内监听事件，`net Server`发射以下事件：

* `'listening'` 事件 —— 当服务器在指定端口和地址监听时。

* `'connection'` 事件 —— 当有新的连接创建时。回调函数会接收到对应的套接字对象，可以通过向 `createServer()` 函数传递一个回调函数绑定到该对象上，就像在上个例子中做的那样。也可以单独监听该事件。

* `'close'` 事件 —— 当服务器关闭时，即不再绑定到改端口时。

* `'error'` 事件 —— 当在服务器层面出现错误时。例如当你尝试绑定一个已被占用的端口或者没有权限绑定的端口，就会发生错误。

下面是一个输出服务器的完整生命周期的例子：

```js
var server = require('net').createServer();

var port = 3000;

server.on('listening', function () {
    console.log('Server is listening on port ', port);
});

server.on('connection', function (socket) {
    console.log('Server has a new connection');
    socket.end();
    server.close();
});

server.on('close', function () {
    console.log('Server is now closed');
});

server.on('error', function (err) {
    close.log('Error occurred: ', err.message);
});

server.listen(port);
```

启动这个例子，当服务器运行时可以应用 `telnet` 或者 `nc` 命令来连接它，如下所示：

```bash
$ telnet localhost 3000
```

或者

```bash
$ nc localhost 3000
```

一旦连接成功，服务器就会监听到`'connection'` 事件，继而它会断开你的连接并关闭服务器。应该会在服务器控制台看到如下信息：

```bash
Server is listening on port  3000
Server has a new connection
Server is now closed
```

> **\[info\] 「编者注」:**
>
> 当在本地环境使用命令行进行测试时，请使用与服务器不同的命令行窗口进行连接。

### 应用套接字对象

当获取 `'connection'` 事件时也获得了一个套接字对象作为回调函数的第一个参数，套接字对象既是可读流也可写流， 这意味着当它获得数据包时会发射`'data'` 事件， 当连接关闭时会发射 `'end'` 事件。

因为套接字对象也是一个可写流，这意味着可以应用 `socket.write()` 函数向套接字写入缓冲区或者字符串。可以通过调用 `socket.end()` 函数告诉套接字当所有数据都被写入之后应该终止连接。下面是一个示例：

```js
var server = require('net').createServer(function (socket) {
    console.log('new connection');

    socket.setEncoding('urf8);

    socket.write('Hello! You can start typing. Type "quit" to exit!.\n');

    socket.on('data', function (data) {
        console.log('got: ', data.toString());
        if (data.trim().toLowerCase() === 'quit') {
            socket.write('Bye Bye!');
            return socket.end();
        }
        socket.write(data);
    });

    socket.on('end', function () {
        console.log('Clietnt connection ended');
    });
}).listen(3000);
```

可以像以前那样，再次启动服务器，并使用 telnet 或 nc 进行连接。然后，可以输入 'quit' + 回车来终止连接。

因为 `socket` 对象是一个可读流，可以通过调用 `socket.pause()` 和 `socket.resume()` 函数来控制流。甚至可以用管道将套接字写入一个可写流中。如下所示：

```js
var ws = require('fs').createWriteStream('mysocketdump.txt');

require('net').createServer(function (socket) {
    socket.pipe(ws);
}).listen(3000);
```

和前面一样，可以使用telnet 或 nc 进行连接。

```bash
$ nc localhost 3000
```

你想输入多少就输入多少，但至少要按一次 &lt;回车键&gt; 将输入输入。然后你就可以打开文件 mysocketdump.txt 找到你输入的文本。

可以反其道而行之，将一个可读流输入到套接字中，如下面的代码所示。为了达到这一目的，必须在本地创建一个 Hello.txt 的文件，在其中填入一些随机文本，然后运行程序。

```js
require('net').createServer(function (socket) {
    var rs = require('fs').createReadStream('Hello.txt');
    rs.pipe(socket);
}).listen(3000);
```

如果尝试连接服务器，会看到插入了文件 Hello.txt 中的文本。同样连接也会被立即关闭， 这是因为正如第9章“读写数据流” 中所解释的那样，在默认情况下，`pipe` 操作会在「源终端」终止之后终止「目的终端」。如果希望连接一直保持为运行状态， 应该将 `{end: false}` 传递给 `pipe()` 方法作为第二参数。

### 理解空闲套接字

默认情况下，当一条连接在两个对等终端建立起来之后，就会一直保持为活动状态，直到其中一个终端关闭它或者其下层链路丢失为止。然而，在 Node 终中因为非活动性可以为 TCP 连接设置超时时间。当一段时间后没有发出或者收到流量信息，就可以自动关闭连接。可以通过在连接上调用 `setTimeout(millsecond)` 函数激活和定义超时时间，还可以监听套接字对象上的 `timout` 事件。

```js
var timeout = 60000; // 1分钟

socket.setTimeout(timeout);
socket.on('timeout', function () {
    socket.write('idle timeout, disconnecting, bye!');
    socket.end();
});
```

或者也可以使用一种较为简约的方式，即传递事件监听器作为 `socket.setTimeout()` 函数的第二个参数。\]

```js
var timeout = 60000; // 1分钟

socket.setTimeout(timeout, function () {
    socket.write('idle timeout, disconnecting, bye!');
    socket.end();
});
```

### 设置保持运行

在 Node 中 `net.Socket` 实现了一种保持运行的机制避免网络或者终端上出现超时，Node 通过发送带有被打开的确认（Acknowledgement,ACK）标志的空 TCP 包触发另一终端的空应答来达到这一目的。这一操作会保持两个终端之间的连接处于运行状态。

可以通过一下代码激活保持运行的功能：

```js
Socket.setKeepAlive(true);
```

还可以指定最后接收到的包与下一个保持运行包之间的延时时间，为此，可以设置 `socket.keepAlive()` 函数的第二个参数，示例代码如下：

```js
socket.keepAlive(true, 10000); // 10秒
```

> **\[info\] 注意：**
>
> 保持运行设置和前面讨论的套接字超时设置没有关系，`socket.setKeepAlive()` 设置周期性地发送空数据包以保持连接运行，而 `socket.setTimeout()` 则用来定义本地休眠状态的超时时间。
>
> 「编者注」： `socket.setKeepAlive()` 是用来避免 Node 将一个连接判定为非活动连接而执行断开操作，隔指定的时间就发送一个空包。`socket.setTimeout()` 是为连接设置的一个超时时间，从接收到的最后一个包算起，超过这个时间连接就会断开。

### 应用延时和非延时

在发送 TCP 数据包之前，内核会缓冲数据，它使用 [Nagle 算法](https://baike.baidu.com/item/Nagle算法/5645172?fr=aladdin)决定何时实际发送数据。在应用程序发送小块数据时，该算法被用来减少通过网络发送的包的数量。取决于应用程序，该特性会变得十分有用，但它会导致延时发送数据， 这会增加应用程序的反应时间。

如果要使延时失效，在 write 命令之后强制数据立即被发送出去，可以调用如下所示的函数：

```js
socket.setNoDelay(true);
```

当然，可以常常恢复该设置，如下所示：

```js
socket.setNoDelay(false);
```

### 监听连接

正如已经看到那样，在服务器被创建之后，可以将其绑定到特定的端口上，如下所示：

```js
var port 3000;
var host = '0.0.0.0';
server.listen(port, host);
```

第二个参数\(host\)是可选的，如果忽略该参数，则服务器将会接受指向任意IP地址的连接：

```js
server.listen(port);
```

### 关闭服务器

如下所示的方法会关闭服务器，不让其再接受新的连接，关闭服务器的函数是**异步的**， 服务器在被关闭时会发射 `'close'`事件：

```js
var server = ...;
server.close();
server.on('close', function () {
    console.log('server closed');
});
```

> **\[info\] 「编者注」：**
>
> 使用 `server.close()` 函数关闭服务器之后，服务器只是不再接受新的连接，而之前的已经建立的连接仍然有效，仍然可以与服务器正常通信。

### 错误处理

在处理客户端上的套接字或者服务器时，可以（也应该）通过监听 `'error'` 事件来处理错误，如下所示：

```js
require('net').createServer(function (socket) {
    socket.on('error', function (err) {
        // do something
    });
}).listen(3000);
```

当出现错误时，如果未能捕获错误，那么 Node 会处理一个未捕获异常，并终止当前进程。

> **\[info\] 注意：**
>
> 未捕获的异常会触发 `'uncaughtException'`事件，因此可以通过`process`监听此事件来进行处理：
>
> ```js
> process.on('uncaughtException', function (err) {
>     // do something
> });
> ```
>
> 但是，这样做通常不是一个好主意，因为当出现异常而你又未能对其进行适当地处理时，应用程序就会陷入一种未知状态，这种未知状态也许在后面会l导致更多更危险的错误此外，错误本身也会引起更多错误，导致难以理解错I 误根源。如果按照上述方法处理，可能还会泄露内存或资源（例如文件描述符），因为错误在该被处理时却没有得到处理。

## 构建一个简单的 TCP 聊天服务器

现在准备开始构建一个基于 TCP 的聊天服务器，可以从实例化服务器、记录一些重要事件以及将服务器绑定到端口 4001 着手。

首先创建一个 chatServer.js 文件。

**第一步：**

```js
var net = require('net');

var server = net.createServer();

server.on('error', function (err) {
    console.log('Server error: ', err.message);
});

server.on('close', function () {
    console.log('Server closed');
});

server.listen(4001);
```

### 接受连接

下一步需要接受新的客户端连接。

**第二步：**

```js
var net = require('net');

var server = net.createServer();

// 监听 connection 事件，有新连接时触发
server.on('connection', function (socket) {
    console.log('got a new connection');    
});

server.on('error', function (err) {
    console.log('Server error: ', err.message);
});

server.on('close', function () {
    console.log('Server closed');
});

server.listen(4001);
```

### 从连接中读取数据

每当服务器获得新的连接时，需要通过绑定data事件，让其监听传入的数据。

**第三步：**

```js
var net = require('net');

var server = net.createServer();

server.on('connection', function (socket) {
    console.log('got a new connection');
    // socket 监听 data 事件
    socket.on('data', function (data) {
        console.log('got data:', data); 
    });    
});

server.on('error', function (err) {
    console.log('Server error: ', err.message);
});

server.on('close', function () {
    console.log('Server closed');
});

server.listen(4001);
```

### 聚合所有客户端

因为创建了一个聊天服务器，在其中需要向所有客户端广播用户数据，所以第一步是将所有连接存入某个位置。

**第四步：**

```js
var net = require('net');

var server = net.createServer();

// 创建客户端容器
var sockets = [];

server.on('connection', function (socket) {
    console.log('got a new connection');
    // 存储新连接
    sockets.push(socket);

    socket.on('data', function (data) {
        console.log('got data:', data); 
    });    
});

server.on('error', function (err) {
    console.log('Server error: ', err.message);
});

server.on('close', function () {
    console.log('Server closed');
});

server.listen(4001);
```

### 广播数据

每当一个已连接的用户输入数据， 就应该将数据广播给所有其他已连接的用户，如下所示：

**第五步：**

```js
var net = require('net');

var server = net.createServer();

var sockets = [];

server.on('connection', function (socket) {
    console.log('got a new connection');

    sockets.push(socket);

    socket.on('data', function (data) {
        console.log('got data:', data); 

        // 向其他客户端发送数据
        sockets.forEach(function (otherSocket) {
            if (socket !== otherSocket) {
                otherSocket.write(data);
            }
        });
    });    
});

server.on('error', function (err) {
    console.log('Server error: ', err.message);
});

server.on('close', function () {
    console.log('Server closed');
});

server.listen(4001);
```

### 删除被关闭的连接

现在至少还缺少一步——还要在连接被关闭时将其删除， 如下所示：

**最后一步：**

```js
var net = require('net');

var server = net.createServer();

var sockets = [];

server.on('connection', function (socket) {
    console.log('got a new connection');

    sockets.push(socket);

    socket.on('data', function (data) {
        console.log('got data:', data); 

        sockets.forEach(function (otherSocket) {
            if (socket !== otherSocket) {
                otherSocket.write(data);
            }
        });
    });

    // 监听 socket 的关闭事件
    socket.on('close', function () {
        console.log('coonection closed');
        var index = sockets.indexOf(socket);
        sockets.splice(index, 1);
    });    
});

server.on('error', function (err) {
    console.log('Server error: ', err.message);
});

server.on('close', function () {
    console.log('Server closed');
});

server.listen(4001);
```

### 使用TCP聊天服务器

现在应该准备对服务器进行测试，使用下面的代码：

```bash
$ node chatServer.js
```

现在可以用 nc 或者 telnet 连接服务器：

```js
$ nc localhost 4001 
```

如果可以，请试着启动几个单独的客户端窗口，可以看到聊天服务器在运行中。

## 本章小结

TCP服务器会在其生命周期内发射一些事件， 即在被绑定到某个端口上时会发射  “监听” 事件，被关闭时会发射 “关闭 ” 事件，而出现错误时会发射 “错误 ” 事件。 还可以监听 “连接 ” 事件， 该事件会在新客户端连接时出现。连接事件会向你提交一个socket对象，socket 对象既是可读流又是可写流， 可以用该对象来监听数据、 发送数据、 终止连接， 甚至可以将连接数据传入另一个流中， 反过来也可以将一个可读流传入连接。

socket 对象允许你使用 `socket.pause()`和 `socket.resume()` 控制它的流程，还允许你对它的一些参数进行微调。例如，可以在连接空闲一段时间后关闭它、频繁发送保持活跃的空数据包，或者打开或关闭 Nagle 算法。

此外，还可以创建处理大量连接的TCP服务器，客户端使用这个服务器按照某种方式彼此之间进行通信， 例如本章创建的聊天服务器示例。



## 附：示例代码

[include](./chatServer.js)


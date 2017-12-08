# 使用用户数据包

**本章提要：**

* 何时使用用户数据报？为什么要使用它？

* 接收用户数据报消息

* 发送用户数据报消息

* 多点传送用户数据报消息

* 理解用户数据报的限制

TCP 是一个面向连接的协议，它在网络节点之间提供可靠有序的数据流。然而，用户数据报（User Datagram Protocol, UDP）是一种无连接的协议，不具备 TCP 的传输特性。当发送 UFP 数据包时，无法保证数据包的到达顺序，甚至无法保证它能够到达。

除了这些缺陷之外，UDP 十分有用，例如在需要广播消息时并不需要严格地传输保证或者消息顺序，此外 UDP 也可用于不知道网络节点地址的场合。

## 理解用户数据报

与 TCP 一样，UDP也位于传输层，在 IP 层之上，它允许你向其他主机发送消息（此处的消息是指数据报），而不需要事先的通信来建立必要的传输信道或者数据路径。与 TCP不一样的是，UDP 不是面向连接的，不具有可靠性、消息排序甚至数据完整性等语义。UDP  
提供的是一种不可靠的服务，数据报可能不会按顺序到达、重复出现甚至在无察觉的情况下发生丢失。UDP 假定错误检测要不没有必要，要不就将其放在应用层进行。

## 理解用户数据报的使用

对时间敏感的应用程序通常使用 UDP，因为此时丢失数据包比等待延时的数据包更适合，后者并不是实时系统的选择。

UDP 的无状态特性对于服务器响应来自大量客户端的小查询同样有用。与 TCP 不同，UDP 支持数据包的广播和多播（将数据包发送给所有订阅者）。

使用 UDP 的常见网络应用程序包括 DNS\(Domain Name System 域名系统\)、流媒体用用程序，例如交互式网络电视（Internet Protocal Television, IPTV）、网络语音（Vioce over IP, VOIP）以及 IP 隧道、简单文件传输（Trivial File Transfer Protocal, TFTP）、简单网络管理协议（Simple Network Management Protocal, SNMP）、动态主机配置协议（Dynamic Host Coniguration Protocal, DHCP）等。其他常见的应用程序包括强可靠性不必要时的消息记录以及清理分布式缓存。

## 构建数据包服务器

Node 使用 `dgram` 模块来支持数据包，所以首先必须要导入该模块：

```js
var dgram  = require('dgram');
```

然后必须创建服务器：

```js
var server = dgram.createSocket('udp4');
```

`dgram.createSocket` 函数接受套接字类型作为第一个参数，改参数或者是 `udp4`\(IPv4 上的 UDP\)，或者是 `udp6`\(IPv6 上的 UDP\)，上面的例子中指定的是 `udp4`。

> **\[info\] 注意：**
>
> 此外还要注意在 UDP 中不存在真正的服务器，它只是在套接字上监听消息的终端，服务器一般要对收到的消息提供某种类型的反馈，在本章的后面你将看到如何响应 UDP 消息。
>
> 为了简化问题和消除歧义，我仍然将你创建的这种软件称作“服务器”。

### 监听消息

当有新消息传入时，UDP 服务器会发射 `message` 事件，所以必须为该事件注册一个回调函数：

```js
server.on('message', function (msg) {
    console.log('server got message:'+ msg);
});
```

现在应该将服务器绑定到一个特定的 UDP 端口上，如下所示：

```js
var port = 3000;
server.on('listening', function () {
    var address = server.address;
    console.log('server listening on ' + address.address + ':' + address.port);
})

server.bind(port);
```

同样也可以监听 `listening` 事件，该事件会在服务器开始监听消息之后被触发。

### 测试服务器

下面是一个简单的 UDP 服务器：

```js
var dgram = require('dgram');
var port = 3000;

var server = dgram.createSocket('udp4');

server.on('message', function (msg) {
     console.log('server got message:'+ msg);
});

server.on('listening', function () {
    var address = server.address();
    console.log(address)
    console.log('server listening on ' + address.address + ':' + address.port);
})

server.bind(port);
```

保存上面的代码到 udp\_server\_1.js 并运行：

```js
$ node udp_server_1
```

上述脚本应该输出服务器地址和端口，然后只是等待消息：

```bash
server listening on 0.0.0.0:3000
```

可以通过使用类似 nc 这样的工具发送数据来测试上述脚本：

```bash
$ nc -u 0.0.0.0 3000
```

然后在命令行输入 "hello" 回车，就会在服务器窗口看到：

```bash
server got message:hello
```

### 查看附加的消息信息

由于 UDP 服务器可以获取来自大量发送端的消息，因此根据应用程序获取消息的源地址就十分令人关注。除了发送消息本身外，`message` 事件还会将远程发送端的一些基本信息传入回调函数，作为其第二个参数，可以查看这些消息。如下所示：

```js
server.on('message', function  (msg, rinfo) {
    console.log('server got message: %s from %s:%d', msg, rinfo.address, rinfo.port)
});
```

正如在本章后面将要看到的那样，可以用这些源信息响应远程服务器。

## 创建简单的数据报回送服务器

既然已经在 `message` 事件上获得了源地址，也许你想发回一跳消息。例如，也许你想告知源服务器消息已收到，或者将某些状态反馈给源服务器。

接下来将创建一个简单的 UDP 服务器作为示例，将收到的消息发送回其发送端。

### 等待消息

可以从创建一个 UDP 套接字并把它绑定到指定端口开始：

```js
var dgram = require('dgram');
var port = 3000;

var server = dgram.createSocket('udp4', function (msg, rinfo) {
    console.log('server got message: %s from %s:%d', msg, rinfo.address, rinfo.port)
});

server.bind(port);
```

### 向发送端发回消息

  
然后当服务器接收到一跳消息时，将它发回发送端：

```js
server.on('message', function(msg, rinfo) {
    server.send('Postback data: ' + msg,
                0,
                msg.length + 15,
                rinfo.port,
                rinfo.adress);
});
```

上面的例子中用到了服务器的 `send` 函数，该函数会向指定的地址和端口发送消息。

前面三个参数对将要发送的消息进行了描述——第一个是一个缓冲区，然后是缓冲区的初始位置偏移（本例中该值为 0, 因为消息是从缓冲区的起始位置开始的），再然后是消息的长度（即缓冲区的实际长度），单位为字节。  
剩下的两个参数描述了消息的目的地，即端口和地址。 在上面的例子中，得到了包含在 `rinfo` 参数中的远程发送端信息—— 它包含了远程服务器的地址信息——并且使用该信息指定接收者的地址。

### 前述内容综合

现在 UDP 回送服务器应该如下所示：

```js
var dgram = require('dgram');
var port = 3000;

var server = dgram.createSocket('udp4', function (msg, rinfo) {
    console.log('server got message: %s from %s:%d', msg, rinfo.address, rinfo.port)
});

server.on('message', function(msg, rinfo) {
    server.send('Postback data: ' + msg,
                0,
                msg.length + 15,
                rinfo.port,
                rinfo.adress);
});

server.bind(port);
```

可以在 shell 命令行中用 nc 实用工具来测试该服务器：

```bash
$ nc -u 0.0.0.0 3000
```

然后开始输入字符串并按下回车键，应该看到字符串被送回。

> **\[info\] 注意**
>
> 在消息被复制到内核之前，注意不要修改传递给 `client.send` 函数的缓冲区。如果想知道消息在何时被输入到内核中，以及何时能够安全地重用缓冲区，就必须将一个回调函数作为最后一个参数传递给 `client.send` 函数：

```js
var message = new Buffer('blah blah');
client.send(message, 0, message.length, rinfo.port, rinfo.address, function () {
    // 可以重用缓冲区了
});
```

## 构建数据报客户端

根据应用程序，你也许只想发送一条或多条 UDP 消息，而并不关心监听消息的响应或者任何其他 UDP 消息，在这种情况下， 可以创建一个只发 UDP 客户端。

### 创建客户端

要创建一个 UDP 客户端来发送 UDP 数据包，只需要创建一个 UDP 套接字，并用它来发送消息，如下所示：

```js
var dgram = require('dgram');
var client = dgram.createSocket('udp4')
```

上面的代码中，除了没有绑定端口外，使用的是和服务器上一样的 `dgram.createSocket` 函数。由于没有绑定到特定的端口，因此消息会从一个随机的 UDP 端口发出。如果想从特定的端口发送消息，可以使用 `client.bind(port)` 函数。

### 发送消息

下面可以创建一个包含消息的缓冲区，并通过客户端套接字将该缓冲区发送给服务器。

```js
var message = new Buffer('this is a message');
client.send(message, 0, message.length, 3000, 'localhost');
```

### 关闭套接字

当不再需要发送消息时，可以关闭数据报套接字，在上面的例子中，套接字会在消息被全部送到网络中时被关闭。幸好， `client.send()` 函数会在套接字被关闭时接受一个回调函数，在本例中用到了这个回调函数：

```js
client.send(message, 0, message.length, 3000, 'localhost', function (err, bytes) {
    if (err) {
        throw err;
    }
    client.close();
});
```

如你所见，传入 `client.send` 函数的回调函数有两个参数：一个是发生错误时的错误对象，另一个是发送的字节数。

## 创建一个简单的数据报命令行客户端

现在准备用一个基于 Node 的命令行 UDP 客户端来代替 nc 客户端，这个客户端程序应该接受目标主机名和端口作为命令行参数，然后从标准输入数据流中读取数据， 并将数据流作为消息传送给 UDP 目标。

先创建一个 udp\_client.js 文件，在其顶部输入如下代码：

```bash
#!/usr/bin/env node
```

在命令行中运行如下代码，将上面的文件变为可执行文件：

```bash
$ chmod +x udp_client.js
```

然后就可以从 shell 命令行调用客户端，如下所示：

```bash
$ udp_client.js <host> <port>
```

然后解析命令行参数，这些参数是 [`process.argv`](http://nodejs.cn/api/process.html#process_process_argv) 中的变量， 它是一个包含所有命令行参数的数组，第一个参数是 Node 可执行文件的路径，第二个参数是脚本文件的路径，第三个参数是主机名，第四个参数是端口。

因此，在 udp\_client.js 如下所示来获取主机名和端口：

```js
var host = process.argv[2];
var port = paseInt(process.argv[3], 10);
```

### 读取命令行

为了在 Node 进程启动之后读取命令行，必须使用`process.stdin` 可读流。然而 `process.stdin` 流启动时处于暂停状态，这意味着在使用之前必须恢复它，如下所示：

```js
process.stdin.resume();
```

然后就可以用这个标准输入流来获取命令行：

```
process.stdin.on('data', function (data) {
    console.log('user typed: ', data);
});
```

### 像服务器发送数据

现在可以将用户输入传给目标 UDP 服务器：

```js
var dgram = require('dgram');

var client = dgram.createSocket('udp4');

var host = process.argv[2];
var port = paseInt(process.argv[3], 10);

process.stdin.resume();

process.stdin.on('data', function (data) {
    client.send(data, 0, data.length, port, host)
});
```

### 从服务器接收数据

要接收来自服务器的数据，需要订阅 `message` 事件：

```js
clien.on('message', function (msg) {
    console.log('Got message back: ', msg.toString());
});
```

### 签署内容综合

下面是上述 UDP 客户端的完整代码：

```js
var dgram = require('dgram');

var client = dgram.createSocket('udp4');

var host = process.argv[2];
var port = parseInt(process.argv[3], 10);

process.stdin.resume();

process.stdin.on('data', function (data) {
    client.send(data, 0, data.length, port, host)
});

client.on('message', function (msg) {
    console.log('Got message back: ', msg.toString());
});

console.log('Start typing to send messages to %s:%d', host, port);
```

现在，可以使用 shell 命令行来启动客户端：

```bash
$ ./udp_client.js 0.0.0.0 3000
```

应该看到如下所示的消息：

```bash
Start typing to send messages to 0.0.0.0:3000
```

如果输入一些字符，然后按下回车键，应该看到发送的消息被当做响应返回，并显示出来。

## 理解和使用数据报多报

UDP 最令人感兴趣的应用之一是能够将一条消息发不给几个网络节点，可以利用这一点来记录日志和清理缓存，在两种情况下可能会丢失一些信息。

> **\[info\] 注意：**
>
> 消息多播在不需要知道所有终端地址时可能会很有用，终端只需要转入接收状态并监听信道即可。
>
> 例如，可以让一个事件记录服务器监听多个 “信道”，当另一个进程需要登录一个 “信道”  时，它将会向该通道多播包含该事件细节的消息。
>
> 还可以让多个服务器监听同一通道，例如，一个服务器负责存储事件，另一个服务器负责向分析引擎发送事件。
>
> 节点可以通过转入一个信道公布它对监听该多播信道的兴趣， 在分配 IP 地址时，有一个地址范围是被保留用来作为多播地址的， 在IPv4中， 该范围在 224.0.0.0 和 239.255.255.255 之间， 但其中的某些地址被保留。
>
> 从 224.0.0.0 到 224.0.0.255 之间的地址被保留用于本地用途（比如管理和维护任务），从 239.0.0.0 到239. 255.255.255 之间的地址同样也是被保留用于管理任务。

### 接受多播消息

要连接像 230.1.2.3 这样的多播地址，可以编写如下所示的代码：

```js
var server = require('dgram').createSocket('udp4');

server.on('message', function (msg, rinfo) {
    console.log('server got message: '+ msg +' from '+ rinfo.address + ':' + rinfo.port);
});

server.bind(3000, function () {
    server.addMembership('230.1.2.3')
});
```

上面的代码告诉内核UDP套接字应该接收来自多播地址 230.1.2.3 的多播消息，当在服务器上调用 `addMembership` 方法时，可以将监听接口作为可选的第二个参数传递给该方法，如果这个参数被忽略，Node 就会尝试在每个网络接口上进行监听。

然后可以用新创建的 UDP 客户端来测试这个服务器，如下所示：

```
$ ./udp_client.js 230.1.2.3 3000
```

输入的每一行文本都会出现在服务器的控制台日志中。

> **\[info\] 「编者注」：**
>
> 原书中的同步模式会出现错误：
>
> ```js
> server.bind(3000);
> server.addMembership('230.1.2.3');
> ```
>
> ```
> events.js:183
>       throw er; // Unhandled 'error' event
>       ^
>
> Error: bind EINVAL 0.0.0.0:3000
>     at Object._errnoException (util.js:1024:11)
>     at _exceptionWithHostPort (util.js:1046:20)
>     at _handle.lookup (dgram.js:266:18)
>     at _combinedTickCallback (internal/process/next_tick.js:141:11)
>     at process._tickCallback (internal/process/next_tick.js:180:9)
>     at Function.Module.runMain (module.js:678:11)
>     at startup (bootstrap_node.js:187:16)
>     at bootstrap_node.js:608:3
> ```
>
> 查阅很多资料，最后在 [stackoverflow](https://stackoverflow.com/) 上找到回答，[这个问题（issue）](https://github.com/nodejs/node-v0.x-archive/issues/4944) 也已经在 github 上提交并得到了回复。
>
> 大意是说，`dgram.Socket#bind()` 函数现在始终是异步的，因此需要以回调的方式设置。
>
> ```js
> server.bind(3000, function () {
>     server.addMembership('230.1.2.3')
> });
> ```








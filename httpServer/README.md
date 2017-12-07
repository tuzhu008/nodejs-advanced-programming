# 构建 HTTP 服务器

**本章提要：**

* 创建 HTTP 服务器

* 让 HTTP 服务器在某个端口上监听

* 处理 HTTP 请求

* 观察请求头

* 监听和传送请求数据

* 用状态码和头数据进行响应

* 用主体数据进行响应

* 使用 HTTP 分块响应流式传送响应主体

HTTP 是一个用来进行传送内容和应用程序的应用层协议，它将TCP 用作传输协议，并且是万维网进行数据通信的基础。首选的应用程序部署方案之一就是在互联网上提供 HTTP 服务，来响应HTTP客户端的请求。

在 Node 中可以轻松地创建 HTTP 服务器，下面是著名的"Hello World!" HTTP 服务器示例：

[include](./hello_world.js)

在第 1 行获得了一个 `http` 模块，从中可以可以通过调用 `http.createServer()` 函数创建 `server` 对象。

然后监听 `request` 事件，该事件会在有新客户端连接时发生，所提供的事件回调函数有两个参数：`request` 对象和 `response` 对象。然后可以使用 `request` 对象了解请求的细节，还可以用 `response` 对象向客户端回写数据。

在第 6 行写入了头（`{‘Content-Type’: 'text/plain'}`）和 HTTP 状态码 200，200是表示请求成功的状态码。

在第 7 行用字符串 `Hello World!` 进行响应，并在第 8 行结束请求。

在第 11 行将服务器绑定到 TCP 端口 4000。

然后将上述脚本保存为文件 hello_world.js 并运行，如下所示：

```bash
$ node hello_world.js
```

接着将浏览器转向 http1://localhost:4000，此时应该能够看到 "HelloWorld!" 字符串显示在浏览器上。

上面这个完整的示例可以被简写，如下所示：

```js
require('http').createServer(function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end('Hello World!');
}).listen(4000);
```

在上面的例子中省去了存储 `http` 模块的中间变量（因为只需要调用一次该模块），也舍弃了存储服务器的变量（因为只需要它在 4000 上监听，而不做其他事情）。此外，作为一种快捷方式，`http.createServer()` 函数接受了一个回调函数，该回调函数会在每个请求上被调用。

上面的代码中还有最后一个快捷方式：`response.end()` 函数，该函数接受一个字符串或者缓冲区，它会在结束请求之前将这个字符串或者缓冲区写入响应。

当客户端发出一个请求时，HTTP 就会发射一个 `request` 事件， 该事件传入 HTTP 请求和  HTTP 响应对象。HTTP 请求对象允许你查询请求的一些属性，而 HTTP 响应对象允许你创建一个 HTTP 响应，这个响应会被发送到客户端。

## 理解 `http.ServerRequest` 对象

在监听 `request` 事件时，回调函数会得到一个 `http.ServerRequest` 对象作为第一个参数，这个对象包含一些属性，可以查看这些属性，这些属性包括 `ulr`、`method` 以及 `headers`等等:

- **req.url**: 该属性包含一个字符串形式的请求 URL。它不包含模式、主机名、或者端口，但包括 URL 中在上述内容之后的所有剩余部分，试着运行如下所示的服务器来分析request属性： 

```js
require('http').createServer(function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end(req.url);
}).listen(4000);
```

用浏览器打开 http://127.0.0.1:4000/abc ， 修改 URL 中的路径看看会发生什么。

- **req.method**: 该属性包含在请求上用到的HTTP方法，例如，它有可能是GET、POST DELETE或者HEAD。

- **req.headers**: 该属性包含一个对象，这个对象拥有请求上所有的 HTTP 头，为了分析该属性，可以运行如下所示的服务器：

```js
var util = require('util');

require('http').createServer(function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end(util.inspect(req.headers));
}).listen(4000);
```

将浏览器连接到 http://127.0.0.1:4000 来查看请求头，服务器应该输出如下所示的信息：

```
{ host: 'localhost:3000',
  connection: 'keep-alive',
  'cache-control': 'max-age=0',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
  'upgrade-insecure-requests': '1',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8' }  
```

在上面的代码中用到了 `util.inspect()`，它是一个可以分析任意对象属性的实用函数。

headers 对象的键是小写的，例如，如果浏览器发送了一个请求头 `'Cache-Control: max-age=0'` ，则 `req.headers` 就会有一个属性 "cache-control "，该属性的值是"max-age=O "，直不会受到影响。

当在服务器上得到 `request` 事件时，并不会立即获得请求体，这只是因为请求体还没了到达。但因为 `request` 对象是可读流，所以只要你想，就可以监听 `data` 事件，或者将请求体传送
一个可写流中，比如一个文件或者一个 TCP 连接。

```js
var writeStream = ...;

require('http').createServer(function (req, res) {
    req.on('data', function (data) {
        writeStream.pipe(data);
    })
}).listen(4000);
```

## 理解 http.ServerResponse 对象

响应对象（`request` 事件回调函数的第二个参数）用来响应客户端，可以用它写入响应头和响应主体。

### 写入响应头

为了写入响应头，可以使用 `response.writeHead(stauts, headers)` 函数，其中 `headers` 是一个可选参数，它是一个包含所有想要发送的响应头属性的对象。考虑下面这个示例：

```js
require('http').createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'max-age=3600'
    });
    res.end('Hello World!');
}).listen(4000);
```

上面的示例设置了两个响应头属性。

如果将前面的源代码保存为 http_server.js 并运行它：

```bash
$ node http_server.js
```

可以使用浏览器或者像 `curl` 这样的命令行 HTTP 客户端对响应头进行查询：

```bash
$ curl -i http://localhost:3000
HTTP/1.1 200 OK
Content-Type: text/plain
Cache-Control: max-age=3600
Date: Thu, 07 Dec 2017 01:05:01 GMT
Connection: keep-alive
Transfer-Encoding: chunked

Hello World!%
```

### 修改或设置响应头

通过下面的语句，可以修改已经设置的响应头或者设置一个新响应头。

```js
res.setHeader(name, value);
```

上面的语句只有在还没有用 `res.write()` 或者 `res.end()` 发送响应主体时才会起作用，如果已经在响应对象上使用 `res.writeHead()`，上述语句也不会起作用，这是因为响应头已经被发送出去了。

### 删除响应头

通过调用 `res.removeHead()` 并提供响应头名称，可以删除已经设置的响应头：

```js
res.removeHeader('Cache-Control');
```

再次提醒，上面的语句只会在响应头还未被发送出去时起作用。

### 写入一块响应主体

HTTP 服务器会在发送响应头之后发送响应主体，有两种写入响应主体的方法，一是写入一个字符串：

```js
res.write('Hello World');
```

另一种是使用已经存在的缓冲区：

```js
var buffer = new Buffer('Hello World');
res.write(buffer);
```

## 以流的形式发送 HTTP 分块响应

Node 的一个极好的特性是能够很容易地从不同的源中消耗和产生流，因为 HTTP 是 Node 中的第一类协议，所以对于 HTTP 响应而言也是如此。

HITP 分块编码允许服务器持续向客户端发送数据，而不需要发送数据大小。除非指定了 `Content-Length` 响应头，否则 Node HTTP 服务器会向客户端发送如下所示的响应头：

```js
{ 'Transfer-Encoding': 'chunked' }
```

根据 HTTP 规范，上面的响应头可以让客户端接受若干块数据作为响应主体，并在客户端结束响应之前发送一个具有 `0` 长度的结束块。 这对于向 HTTP 客户端流式传送文本、音频或者视频数据非常有用。

### 传送数据

可以将任意的可读流传送到响应当中，下面是一个将文件传送到响应中的例子，首先在当前目录下有一个 .mp4文件（电影）test.mp4，然后运行服务器。如下所示：

**向 HTTP 响应传递一部电影**

```js
var fs = require('fs');

require('http').createServer(function (req, res) {
    var rs = fs.createReadStream('./test.mp4');

    res.writeHead(200, {'Content-Type': 'video/mp4'});
    rs.pipe(res);
}).listen(4000);
```

针对上面的代码的每个请求，都写入了响应状态并设置了内容类型头，以便让浏览器能够正确识别传送给他的流类型。然后将电影文件作为一个可读流打开并将其传入响应的可写流中。

如果打开任意一个现代浏览器，并转向 http://127.0.0.1:4000 ,电影都会立即开始播放。即使它还没有完全被加载。

### 传递其他进程的输出

下面的示例展示了向客户端传送子进程输出：

```js
var spawn = require('child_process').spawn;

require('http').createServer(function (req, res) {
    var child = spawn('tail', ['-f', 'var/log/system.log']);
    child.stdout.pipe(res);
    res.on('end', function () {
        child.kill();
    });
}).listen(4000);
```

在上面的代码中，当出现一个新的请求时，就通过 `tail -f var/log/system.log` 命令启动一个新的子进程，然后将子进程的输出传入响应主体当中。

当响应结束时（例如，因为浏览器窗口被关闭或者网络连接被切断），就需要结束子进程，使它不会在之后被无限期地挂起。

所以上面的例子中创建了一个能够生成子进程并传输子进程的输出的流服务器，并根据需要结束子进程，通过这些工作向你展示了 Node 的能力。

## 关闭服务器

可以通过解除 HTTP 服务器与端口的绑定来终止服务器，使其不再接受新的连接，如下所示：

```js
server.close();
```

如果希望它能够重新开始监听，就必须再次执行以下代码：

```js
server.listen(port[, hostname]);
```

后面是 HTTP 服务器的一些简单示例，在这些例子中构建 HTTP 服务器时不需要任何第三方模块。

## 示例 1：构建提交静态文件的服务器

在本例中将要构建一个提交静态文件的服务器，文件路径是通过一个 URL 提供的。如下所示：

http://localhost:4000/path/to/my/file.text

> **[info] 「编者注」：**
>
> 这段 URL 的意思是说，在服务器的跟录下存在这样 `path/to/my/file.text` 一个文件路径。

```js
var path = require('path'),
    fs = require('fs');

require('http').createServer(function (req, res) {
    var file = path.normalize('./' + req.url);
    console.log('Trying to server', file);
    // 错误处理函数
    function reportError (err) {
        switch(err.code) {
            // 是一个目录
            case 'EISDIR':
                res.writeHead(403);
                res.end('Forbidden 文件夹');
                break;
            // 无此文件或目录
            case 'ENOENT':
                res.writeHead(404);
                res.end('Not found 没有找到');
                break;
            // 其他错误                     
            default:
                res.writeHead(500);
                res.end('Internal Server Error');
        }
    }

    fs.open(file, 'r', function (err, fd) {
        function notifyError (error) {
            fs.close(fd, function () {
              reportError(error);
            });
        }
        // 打开文件发生错误
        if (err) {
            reportError(err);
            return;
        }
        var rs = fs.createReadStream(file, {fd: fd});
        // 读取数据出现错误
        rs.on('error', notifyError);
        res.writeHead(200);
        rs.pipe(res);
    });
}).listen(3000);
```

> **[info] 「编者注」：**
>
> 原书中的例子所用的函数有些已经废弃掉，个人重新编写的示例。

## 示例 2：使用 HTTP 分块响应和定时器

在本例中要创建一个输出纯文本的 HTTP 服务器，输出的纯文本每隔 1 秒会新增 100 个用换行符分隔的时间戳。如下所示：

```js
require('http').createServer(function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    var left = 10;
    
    // 设置循环
    var interval = setInterval(function () {
        for (var i = 0; i < 100; i ++) {
            res.write(Date.now() + ' ');
        }
        if (-- left === 0) {
            // 停止循环
            clearInterval(interval);
            // 该方法会通知服务器，所有响应头和响应主体都已被发送，即服务器将其视为已完成。
            res.end();
        }
    }, 1000);
}).listen(3000);
```

## 本章小结

Node 的 `http` 模块允许你创建 HTTP 服务器，并让其在某个特定的端口和主机上监听。然后可以监听新的 `request` 事件， 其中，针对每个请求都有一个回调函数会获得对应的 ServerRequest 对象和 ServerResponse 对象。

可以观察请求对象的某些属性，例如请求的 URL 和请求头，ServerRequest 对象也是一个可读流，这就意味着除了别的之外，还可以监听包含流式主体数据部分的 `data` 事件 甚至可以将数据传送到另一个流当中。

还可以用 ServerResponse 对象通过设置 HTTP 响应状态和发送响应头对客户端做出响应。还可以向响应主体写入数据，或者将任意可读流传入其中。如果不知道内容长度或者希望有一个连续的响应流，可以使用 HTTP 分块响应协议以流式方式传送内容主体，在内容主体中服务器会发送多块响应主体。
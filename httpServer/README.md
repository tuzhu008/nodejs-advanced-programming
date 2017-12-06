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
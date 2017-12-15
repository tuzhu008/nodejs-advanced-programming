# 构建和使用 HTTP 中间件

**本章提要**

- 理解 Connect 框架如何工作

- 创建与 Connect 框架兼容的中间件

- 创建处理错误的中间件组件

- 使用捆绑在 Connect 框架中的几个内置中间件组件

- 使用 Connect 中间件提交静态文件

- 解析查询字符串、请求主体和 cookie

- 操作会话


Node 特别适用于 HTTP 服务器，它具有极佳的 HTTP 解析器，能够在单个进程中有效地处理大量的并发连接。

在构建 HTTP 应用服务器时，通常需要它执行一些常规任务，诸如解析 cookies 头部、解析请求 URL 上的查询字符串、维护与关联会话、持久化会话数据、提交静态文件、解析请求主体、记录请求与响应以及其他等等。当对应用程序的核心逻辑进行编码时，不必显式地执行这些任务，它们应该由 HTTP 服务器应用程序逻辑进行处理。

一些任务涉及检查请求——请求头或请求主体——另一些涉及检查和修改响应，还有一些任务以上两者都涉及了。两者都需要执行的这类任务的一个例子是：想在记录每个到达请求细节的同时，也记录其对应响应的 HTTP 状态码，在这种情况下既需要检查请求对象，也需要检查响应对象。你也许还希望能够设置或修改响应头，比如在使用浏览器 cookies 维护会话 ID 时。

在类似于 Django、 Cake、Rails 或者 Sinatra 等典型的 HTTP 应用程序框架中，执行这些任务的组件通常被称作中间件（middleware)。 这些中间件组件对请求－响应循环进行了包装，在到达应用程序代码之前扩展请求对象或者在响应前后对其进行修改。

## 理解 Connect HTTP 中间件框架

Node 还包含几个框架，这些框架可以简化基于 HTTP 的应用程序开发，其中最流行的框架之一就是 Connect。Connect 针对中间件组件定义了一个模型，同时还定义了一个引擎来运行中间件组件。

一般而言，程序员能够以堆栈的形式将中间件组件组织到一起，当 Connect 接收到 HTTP 请求时，中间件引擎就会按顺序调用每一个组件。任何组件都有权利访问请求对象，这意味着组件可以解析请求头、进行缓冲以及解析请求主体，它们也能修改响应头、向响应主体写入部分数据或者结束响应。

Connect 是和一套中间件组件捆绑在一起，但是可以很容易地创建自定义中间件。

## 构建自定义中间件

正如将要看到的那样，中间件只是一个接收请求和响应对象的函数，他与标准的 Node HTTP 服务器的 `request` 监听器非常相似。为了运行一个简单的中间件组件示例，首先需要在所选择的工作目录中安装 [connect 模块](https://github.com/senchalabs/connect)。

```bash
$ npm install connect
```

下面的代码展示了一个简单的中间件组件，该组件用 “Hello world!” 进行响应并结束响应。如下所示：

```js
function helloWorld (req, res) {
    res.end('Hello World!   ');
}

module.exports = helloWorld;
```

将上述代码保存为 helle_world.js，以备后用。

该中间件导出了一个函数，该函数会被 Connect 调用来处理新的请求，它将字符串 “Hello World” 写入响应主体并结束请求。

可以创建一个 Connect 服务器来测试一下这个中间件组件，如下所示：

```js
var connect = require('connect');
var app = connect();

// 导入中间件
var helloWorld = require('./hello_world');
app.use(helloWorld);

app.listen(8080);
```

上面的代码中创建了一个 Connect HTTP 服务器，并用 Hello World 中间件组件对其进行了初始化。将上述代码保存为 hello_world_app.js 并运行：

```js
$ node hello_world_app
```

将浏览器转向 http://localhost:8080，将会看到显示出 “Hello World!” 响应。

还可以创建一个更为通用的组件，用任意可选文本进行响应，如下所示：

```js
function replyText (text) {
    return function (req, res) {
        res.end(text);
    }
}

module.exports = replyText;
```

`reply_text` 中间件不是直接导出一个处理请求的函数，而是导出了这样一个函数：它在被调用时会返回一个函数，这个函数会用定制文本字符串响应请求。

可以修改服务器代码，使用这个更为通用的组件输出字符"Hello World!", 如下所示：

```js
var connect = require('connect');
var app = connect();

// 导入中间件
var replyText = require('./reply_text');
app.use(replyText('Hello World!'));

app.listen(8080);
```

将上面的代码保存为 hello_world_app_v2.js 并运行：

```bash
$ node hello_world_app_v2
```

将浏览器转向 http://localhost:8080，将会看到再次显示出响应“Hello World!”。

### 创建异步中间件

中间件函数可以是异步的：当工作结束时，它需要调用一个回调函数，以便让中间件引擎继续工作。前面的例子没有用到这个特性是因为它结束了响应，而没有按顺序将控制权移交给下一个中间件。

为了实践一下，可以创建一个中间件组件，将头部数据引入响应头中，如下所示：

```js
function writeHeader (name, value) {
    return function (req, res, next) {
        res.setHeader(name, value);
        next();
    };
}

module.exports = writeHeader;
```

这个中间件组件用到了第三个参数，该参数是一个在组件结束时被调用的回调函数，用来调用下一个中间件。

将上面的代码保存为 write_header.js。

现在将这个中间件组件添加到中间件堆栈中，并将其放置在 replyText 中间件之前，使其称为 Hello World 应用程序的一部分。如下所示：

```js
var connect = require('connect');
var app = connect();

var writeHeader = require('./write_header');
app.use(writeHeader('X-Powered-By','Node'))

var replyText = require('./reply_text');
app.use(replyText('Hello World!'));

app.listen(8080);
```

将上面的代码保存为 hello_world_app_v3.js，并运行：

```bash
$ node hello_world_app_v3
```

然后运行命令行实用工具，创建一个HTTP请求，在请求中可以查看响应头，比如可以使用curl实用工具：

```bash
HTTP/1.1 200 OK
X-Powered-By: Node
Date: Fri, 15 Dec 2017 06:24:32 GMT
Connection: keep-alive
Content-Length: 11

Hello World!
```

通过以上信息，可以看出响应头被写入响应。

将写入头部数据的中间件(write_header)插入到写入和结束响应的中间件(reply_text)之前十分重要，如果将 replyText 中间件放到了前面，第二个中间件就永远不会调用，因为 replyText 没有调用 `next` 回调函数。

### 在中间件内部注册回调函数

除了检查请求和修改响应外，中间件组件还可以注册一些回调函数，这些回调函数随后会被执行。例如，可以创建一个中间件将每个请求的所有数据存入文件。如下所示：

```js
var fs = require('fs'),
    path = require('path'),
    util = require('util');

function saveRequest (dir) {
    return function (req, res, next) {
        var fileName = path.join(dir, Data.now().toString() + '_' + Math.floor(Math.random() * 100000) + '.txt');

        var file = fs.createWriteStream(fileName);
        file.write(req.method + ' ' + req.url + '\n');
        file.write(util.inspect(req.headers) + '\n');
        req.pipe(file);
        next();
    };
}

module.exports = saveRequest;
```

该中间件对于获得的每个请求，都会在指定的目录中创建一个新文件并将请求方法和所有请求头存入该文件，然后它将请求传入该文件，此时还没有任何请求主体被写入。设置数据和其他事件监听器，当将来有数据到达，就会被送入文件可写流。

现在，可以修改服务器来加入中间件组件，如下所示：

```js
var connect = require('connect');
var app = connect();

var saveRequest = require('./save_request');
app.use(saveRequest(__dirname + '/requests'));

var writeHeader = require('./write_header');
app.use(writeHeader('X-Powered-By','Node'))

var replyText = require('./reply_text');
app.use(replyText('Hello World!'));

app.listen(8080);
```

上面的程序会让 saveRequest 中间件将所有请求存入本地目录下的 request 目录中，可以将上面的代码保存到 hello_world_app_v4.js，同时在命令行下创建目录：

```bash
$ mkdir requests
```

现在可以启动服务器：

```bash
$ node hello_world_app_v4
```

可以用 curl 向服务器提供一个本地文件：

```bash
$ curl -T hello_world_app_v4.js http://localhost:8080
```

该命令告诉 curl 将文件上传到指定的 URL 中。该命令执行完毕后，可以查看一下 requests 目录，应该会有一个类似 “1513321476969_21973.txt” 的文件，它包含如下所示的内容：

```
PUT /hello_world_app.js
{ host: 'localhost:8080',
  'user-agent': 'curl/7.54.0',
  accept: '*/*',
  'content-length': '334',
  expect: '100-continue' }
var connect = require('connect');
var app = connect();

var saveRequest = require('./save_request');
app.use(saveRequest(__dirname + '/requests'));

var writeHeader = require('./write_header');
app.use(writeHeader('X-Powered-By','Node'))

var replyText = require('./reply_text');
app.use(replyText('Hello World!'));

app.listen(8080);
```

如预料的那样，该文件包含 HTTP 方法、URL、请求头以及请求主体。

### 在中间件内处理错误

中间件也可以处理错误，为了测试它的这种能力，首先必须创建一个“有错误的” 中间件组件，该组件将抛出异常，如下所示：

```js
function errorCreator () {
    return function (req, res, next) {
        throw new Error('This is an error');
    }
}

module.exports = errorCreator;
```

该中间件将一个异常抛回堆栈，之所以能够这样做是因为 Connect 会捕获到异常并将其交给紧接其后的中间件错误处理程序。但如果在一个回调函数中捕获到错误，就应该将该错误作为第一个参数来调用 `next` 回调函数，如下所示：

```js
function errorCreator () {
    return function (req, res, next) {
        next(new Error('This is an error'));
    };
}

module.exports = errorCreator;
```

默认情况下，如果没有中间件被设置用来处理错误，Connect 就会以明文的形式显示错误结果，为了试验一下，修改服务器代码：

```js
var connect = require('connect');
var app = connect();

var errorCreator = require('./error_creator');
app.use(errorCreator());

var saveRequest = require('./save_request');
app.use(saveRequest(__dirname + '/requests'));

var writeHeader = require('./write_header');
app.use(writeHeader('X-Powered-By','Node'))

var replyText = require('./reply_text');
app.use(replyText('Hello World!'));

app.listen(8080);

```

将上面的代码保存为 hello_world_app_v5.js，并运行

```bash
$ node hello_world_app_v5
```

刷新浏览器，应该看到类似如下所示的错误信息：

```
Error: This is an error
    at /Users/WAHAHA/Projects/Node/middleware/chapter1/error_creator.js:3:15
    at call (/Users/WAHAHA/Projects/Node/middleware/chapter1/node_modules/connect/index.js:239:7)
    at next (/Users/WAHAHA/Projects/Node/middleware/chapter1/node_modules/connect/index.js:183:5)
    at Function.handle (/Users/WAHAHA/Projects/Node/middleware/chapter1/node_modules/connect/index.js:186:3)
    at Server.app (/Users/WAHAHA/Projects/Node/middleware/chapter1/node_modules/connect/index.js:51:37)
    at emitTwo (events.js:126:13)
    at Server.emit (events.js:214:7)
    at parserOnIncoming (_http_server.js:602:12)
    at HTTPParser.parserOnHeadersComplete (_http_common.js:117:23)
```

现在可以创建自定义的错误处理程序，Connect 中的错误处理程序必须带有四个参数——错误、请求、响应、以及 `next` 回调函数。

```js
function errorHandler () {
    return function (err, req, res, next) {
        if (err) {
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.end('<h1>Oh no! We have an error! </h1>\n<pre>' + err.stack + '</pre>');
        } else {
            next();
        }
    };
}

module.exports = errorHandler;
```

将上面的代码保存为 error_handler.js。

该错误处理程序对错误进行格式化处理并将其以HTML 格式输出，现在可以通过让该中间件作为服务器构造函数的最后一个参数来将其整合到服务器中，如下所示：

```js
var connect = require('connect');
var app = connect();

var errorCreator = require('./error_creator');
app.use(errorCreator());

var saveRequest = require('./save_request');
app.use(saveRequest(__dirname + '/requests'));

var writeHeader = require('./write_header');
app.use(writeHeader('X-Powered-By','Node'))

var replyText = require('./reply_text');
app.use(replyText('Hello World!'));

var errorHandler = require('./error_handler');
app.use(errorHandler());

app.listen(8080);

```

将上面的代码保存为 hello_world_app_v6.js 并运行：

```bash
$ node hello_world_app_v6
```

如果舒心浏览器，会得到一个 HTML 格式的错误输出，也可以使用 curl 命令行实用工具来检查响应：

```bash
<h1>Oh no! We have an error! </h1>
<pre>Error: This is an error
    at /Users/WAHAHA/Projects/Node/middleware/chapter1/error_creator.js:3:15
    at call (/Users/WAHAHA/Projects/Node/middleware/chapter1/node_modules/connect/index.js:239:7)
    at next (/Users/WAHAHA/Projects/Node/middleware/chapter1/node_modules/connect/index.js:183:5)
    at Function.handle (/Users/WAHAHA/Projects/Node/middleware/chapter1/node_modules/connect/index.js:186:3)
    at Server.app (/Users/WAHAHA/Projects/Node/middleware/chapter1/node_modules/connect/index.js:51:37)
    at emitTwo (events.js:126:13)
    at Server.emit (events.js:214:7)
    at parserOnIncoming (_http_server.js:602:12)
    at HTTPParser.parserOnHeadersComplete (_http_common.js:117:23)</pre>%
```

可以看到请求头不包含定制的 "X-Powered-By" 条目，这是因为当错误发生时，Connect 会执行 errorCreator 后面所有中间件组件中的第一个错误处理中间件，而跳过所有其他中间件。

实际上，当出现错误时，Connect 只会执行错误处理中间件，这意味着可以减少错误处理中间件的代码，如下所示：

```js
function errorHandler () {
    return function (err, req, res, next) {
      res.writeHead(500, {'Content-Type': 'text/html'});
      res.end('<h1>Oh no! We have a error! </h1>\n<pre>' + err.stack + '</pre>');
    };
}

module.exports = errorHandler;
```

### 使用捆绑在 Connect 中的 HTTP 中间件

Connect 不仅可以创建和使用 HTTP 中间件组件，而且它原本就带有一组常用的中间件组件。可以选择这样的一些中间件来满足应用程序的需求，即定制中间件堆栈，也许还可以将自定义的中间件和和这些通用中间件组件混合使用。

### 记录请求

> **[error] 「编者注」：**  
>
> 原书中所提到的 connect.logger 中间件在现版本已移除。现作为独立的 npm 包被提供 —— [morgan](https://github.com/expressjs/morgan)
>
> 『受到官方支持』

### 处理错误

> **[error] 「编者注」：**  
>
> 原书中所提到的 connect.errorHandler 中间件在现版本已移除。现作为独立的 npm 包被提供 —— [errorhandler](https://github.com/expressjs/errorhandler)
>
> 『受到官方支持』

### 提交静态文件


> **[error] 「编者注」：**  
> 
> 原书中所提到的 connect.static 中间件在现版本已移除。现作为独立的 npm 包被提供 —— [serve-static](https://github.com/expressjs/serve-static)
>
> 『受到官方支持』


### 解析查询字符串

> **[error] 「编者注」：**  
>
> 原书中所提到的 connect.query 中间件在现版本已移除。现作为独立的 npm 包被提供 —— [qs](https://github.com/ljharb/qs)
>
> 『不受官方支持』

### 解析请求主体

> **[error] 「编者注」：**  
>
> 原书中所提到的 connect.bodyParser 中间件在现版本已移除。现作为独立的 npm 包被提供 —— [body-parser](https://github.com/expressjs/body-parser)
>
> 『受到官方支持』


### 解析 Cookies

> **[error] 「编者注」：**  
>
> 原书中所提到的 connect.cookiePaser 中间件在现版本已移除。现作为独立的 npm 包被提供 —— [cookies](https://github.com/pillarjs/cookies) 和 [keygrip](https://github.com/crypto-utils/keygrip)
>
> 『不受官方支持』

### 使用会话

> **[error] 「编者注」：**  
>
> 原书中所提到的 connect.session 中间件在现版本已移除。现作为独立的 npm 包被提供 —— [session](https://github.com/expressjs/session)
>
> 『受到官方支持』

### 其他可用的中间件

本章描述了 Connect 的一些最为流行和使用的中间件组件，但是其他一些中间件组件还能提供另外一些功能，像跨站请求伪造（cross-site request forgery, CSRF）保护，Gzip 压缩、静态文件缓存、虚拟主机支待、请求主体大小限制寺。

你已经看到了使用 Redis 或者 Memcache 的会话存储器，但是还其他一些会话存储器使用诸如 MongoDB、CouchDB 以及 MySQL 等不同的数据库。

而且很多第三方中间件组件和 Connect 兼容，允许提供 JSONP 支持、显示模板、支持请求超时、整合不同的认证方法、支持动态样式语言（LESS、CSS DSL）以及其他等等。在 [Connect wiki](https://github.com/senchalabs/connect/wiki) 上有一个第三方中间件列表，该列表由 Connect 项目的赞助人维护。 

## 本章小结

Connect 已经成为定义和运行中间件组件的标准，可以很容易地创建组件来进行响应、记录数据、传输请求主体、处理错误以及以可重用的方式做些其他的事情。


> **[info] 「编者注」：**
>
> 由于原书成熟较早，内用与现在的情况有些出入，Connect 库也发生了很多变化。但本章还是非常有意义的，了解中间件是如何运行的以及怎样编写中间件。更多的关于 Connect 的文档和中间件请参考 [官方文档](https://github.com/senchalabs/connect) 或者 [中文文档](https://tuzhu008.github.io/gitbook-Node_cn/Labrary/connect/)。
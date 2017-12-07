# 创建 HTTP 请求

**本章提要：**

* 向 HTTP 服务器发送 GET 请求

* 在 HTTP 请求上使用不同的 HTTP 协议

* 查看请求响应状态和头部的属性

* 使用第三方请求模块

HTTP 已经成为互联网上许多私有和公有服务的底层基础的核心部分，HTTP不仅被用来提供静态数据，而且也成为提供和使用公共API 的首选方式。

由于 Node 擅长处理 I/O 操作，所以它不仅适合提供 HTTP 服务，也适合使用这些服务。在接下来的几节里，你将学习使用核心 `http` 模块和实用的第三方请求模块执行和控制 HTTP 请求。

在 HTTP 协议中，请求有两个重要的属性：URL 和方法。最常见的方法是 GET 方法。它主要用来请求内容，同时还有其他方法，如POST \(主要被用来提交 Web 表单）、PUT、DELETE 和 HEAD, 每一种方法都会从服务器获得不同的结果。

## 创建 GET 请求

下面这个例子使用 `http.get` 方法针对 URL www.google.com:80/index.html 创建了一个 HTTP 请求。

```
var http = require('http');

var options = {
    host: 'www.google.com',
    port: 80,
    path: '/index.html'
};

http.get(options, function (res) {
    console.log('Got response: ' + res.statusCode);
});
```

在上面的这个例子中，使用 TCP 端口 80 向主机名 www.google.com 和路径 /index.html 执行 GET 请求。回调函数会在响应到达时被调用来处理响应对象。在本章后面你将学习可以对响应对象进行的操作。

## 使用其他 HTTP 动词

`http.get` 是通用的 `http.request` 的快捷方式，其选项如下：

* `protocol` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) 使用的协议。默认为 `http:`。

* `host` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) 请求发送至的服务器的域名或 IP 地址。默认为 `localhost`。
* `hostname` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) `host`的别名。为了支持 [`url.parse()`](http://nodejs.cn/api/url.html#url_url_parse_urlstring_parsequerystring_slashesdenotehost) ， `hostname `优先于 `host`。
* `family` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) 当解析`host`和`hostname`时使用的 IP 地址族。 有效值是`4`或`6`。当未指定时，则同时使用 IP v4 和 v6。
* `port` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) 远程服务器的端口。默认为`80`。
* `localAddress`[&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)为网络连接绑定的本地接口。
* `socketPath` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) Unix 域 Socket（使用 host:port 或 socketPath）。
* `method `[&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) 指定 HTTP 请求方法的字符串。默认为`'GET'`。
* `path` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) 请求的路径。默认为`'/'`。 应包括查询字符串（如有的话）。如`'/index.html?page=12'`。 当请求的路径中包含非法字符时，会抛出异常。 目前只有空字符会被拒绝，但未来可能会变化。
* `headers` [&lt;Object&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) 包含请求头的对象。下面是headers 对象的一个例子：

    ```js
    ｛
        "Accept": "text/plain",
        "If-Modified-Sincen": "Sat, 28 Jan 2012 00:00:52 GMT"
    ｝
    ```

* `auth` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) 基本身份验证，如 `'user:password'` 用来计算 `Authorization`请求头。
* `agent`[&lt;http.Agent&gt;](http://nodejs.cn/api/http.html#http_class_http_agent) [&lt;boolean&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)控制  [`Agent`](http://nodejs.cn/api/http.html#http_class_http_agent) 的行为。 可能的值有：
  * `undefined`\(默认\): 对该主机和端口使用 [`http.globalAgent`](http://nodejs.cn/api/http.html#http_http_globalagent) 。
  * `Agent `对象：显式地使用传入的 `Agent`。
  * `false`: 创建一个新的使用默认值的`Agent`。
* `createConnection`[&lt;Function&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function) 当不使用`agent`选项时，为请求创建一个 socket 或流。 这可以用于避免仅仅创建一个自定义的
  `Agent`类来覆盖默认的`createConnection`函数。详见 [`agent.createConnection()`](http://nodejs.cn/api/http.html#http_agent_createconnection_options_callback) 。

* `timeout`[&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type): 指定 socket 超时的毫秒数。 它设置了 socket 等待连接的超时时间。

`http.request` 函数会返回一个 `http.ClientRequest` 对象，它是一个可写流，可以使用这个流发送数据，所发送的数据是请求主体数据的一部分，当完成向请求主体中写入数据时，要结束数据流来终止请求。

下面这个例子中将一些请求主体内容写入到  http://my.server.com/upload 中：

```js
var http = require('http');
var options = {
    host: 'www.google.com',
    port: '80',
    path: '/upload',
    method: 'POST'
};

var request = http.request(options, function (response) {
    console.log ('STATUS:', response.statusCode),
    console.log ('HEADERS:', response.headers),
    response.setEncoding('utf8');
    response.on('data', function (data) {
        console.log('BODY:', chunk);
    });
    request.write('this is a piece of data.\n');
    request.write('this is another piece of data.\n');
    request.end();
});
```

`http.request` 函数返回 `ClientRequest` 对象，可以通过调用 `request.write()` 函数将请求主体部分写入该对象。可以传入一个经过编码的字符串——通过使用 `request.write(str, encoding)` 函数——一个 UTF-8 编码的字符串，或者甚至一个未经处理的缓冲区。必须用 `request.end()` 函数来结束请求，如果没有结束请求，服务器会认为请求不完整，也就不会对其进行响应。

如果服务器可访问并且正在运行，会获得一个响应，这个响应将触发`response` 事件。可以将 `response` 事件绑定到 `request` 对象上，如下所示：

```js
function responseHandler (res) {
    console.log('I got a response:', res); 
}

request.on('response', responseHandler);
```

也可以传递一个回调函数给 `http.request()` 调用，作为其第二个参数，当出现来自服务器的响应时，这个回调函数就会被调用。

回调函数会将响应对象作为其第一个也是唯一的参数，通过查看该对象，可以发现服务器分配给请求的响应状态码以及服务器发送的响应头。

### 查看响应对象

当 HTTP 服务器的响应返回时，响应事件就起作用了，它会触发所有为其注册的回调函数，并将响应对象传递给这些回调函数，响应对象是 `http.ClientResponse` 的一个实例，可以立即查看该对象的属性。

* response.statusCode —— 一个整数，表示 HTTP 响应状态码。

* response.httpVersion —— 服务器在响应上实现的 HTTP 版本号，可能是 1.1 或者 1.0.

* response.headers —— 表示响应头名称-值对的普通对象，对象名是小写的，下面是响应头对象的一个示例：

### 获取响应主体

前面提到过，响应主体并不会在请求的 `response` 事件发生时出现，如果对响应主体感兴趣，就可以在 `response` 上注册 `"data"` 事件，如下所示：

```js
http.request(options, function (response) {
    response.setEnCoding('utf8);
    response.on('data', function (data) {
        console.log('I hava a piece of the body here', data);
    });
});
```

在上面的例子中，一旦获取 `response` 事件，就在响应上注册 `data` 事件，当有响应主体到达时，会收到通知。响应主体可以是一个缓冲区，如果在响应对象上指定了编码格式（就如同在上面的例子中所做的那样），他就是一个编码字符串。

### 以流的方式传送响应主体

HTTP 响应是一个可读流，表示响应主体数据流。与任何可读流一样，可以将它传送到任意可写流中，例如一个 HTTP 请求或者一个文件。例如：下面的例子展示了如何将响应主体传送到一个打开的文件中：

```js
var http = require('http');
var fs = require('fs');
var options = {
    host: 'www.google.com',
    port: '80',
    path: '/upload',
    method: 'POST'
};

var ws = fs.createWriteStream('/tmp/test.text');

http,request(options, function (response) {
    response.pipe(ws);
}).end();
```

上面的例子中创建了一个文件可写流，并将响应主体传送到其中，当来自服务器响应的主体数据到达时，响应主体就被写入文件。在响应主体结束时，文件流也会结束，然后就会关闭文件。

## 使用 HTTP.Agent 维护套接字池

在创建 HTTP 请求时，Node 在内部使用了一个代理。代理是 Node 中的一种实体，该实体被用来为你创建请求，它负责维护一个活动套接字池，对指定的主机名和端口对，套接字池中包含已被打开但是未被使用的连接。当出现新的 HTTP 请求时，代理要求连接保持活动状态。当请求结束时，并且在套接字上没有额外的请求等待释放时，套接字就会被关闭。这意味着不必手动关闭 HTTP 客户端，并且 TCP 连接在 Node 负载较轻时易于重用。

当创建了一个请求并选择了一个可用的套接字，或者为该请求创建了一个新的连接时，`http.ClientRequest` 会发射 `socket` 事件。在请求结束之后，套接字会在发射 `close`事件或
`agentRemove` 事件时从代理的套接字池中被删除。如果想让 HTTP 请求打开一段较长时间，可以将其从套接字池中删除，如下所示：

```js
function handleResponseCallback (res) {
    console.log('got response:', res);
}

var req = http.request(options, handleResponseCallback);

req.on('socket', function (socket) {
    socket.emit('agentRemove');
});
```

Node 允许在一个给定线程上的每个主机-端口对上最多可以有 5 个打开的套接字，这意味着在负载较重的情况下，Node 会将请求串行排列到同一个主机-端口对以便重用套接字。如果这种处理对你的应用模式来说并不是最优，可以通过想 `options` 对象传递 `agent: false` 来使代理的套接字池失效：

```js
var options = {
    host: 'www.google.com',
    port: '80',
    path: '/upload',
    method: 'POST',
    agent: false
};

var req = http.request(options, handleResponseCallback);
```

还可以通过修改 `http.Agent.defaultMaxSockets` 来改变套接字池中每个主机－端口对所允许打开的套接字的最大数目，如下所示：

```js
var http = require('http');
http.Agent.defaultMaxSockets = 10;
```

对这个默认值的修改是全局性的，这意味当有新的 HTTP 代理被创建时，它依然会使用修改后的默认值。注意，如果已经针对给定的主机名和端口创建了请求，对应的 HTTP 代理实例也会被创建，所以此时对默认值进行修改不会有任何作用。

当创建请求时也可以指定 HTTP 代理， 如下所示：

```js
var http = require('http');
var agentOptions = {
    maxSockets: 10
};

var gent = new Agent(options);

// 使用该请求的代理
var requestOtions = {
    host: 'www.google.com',
    port: 80,
    agent: agent
};

var req = http.request('requestOptions');
//...
res.end();
```

上述代码用给定的代理创建 HTTP 请求，该代理会将套接字池存储在其中，可以共享创建的代理，并将其应用到其他 HTTP 请求中以重用套接字池。

## 应用第三方请求模块简化 HTTP 请求

Node 的 HTTP 客户端非常强大，但用起来有点麻烦。首先，必须提供个对象，该对象要具有所有选项，包括被分割成几个部分的 URL,之后如果希望能够处理响应主体，还需要获取响应主体。如果是重定向响应，还必须人工处理该响应。

通过使用 [request](https://github.com/request/request) 第三方模块可以避免上述问题以及很多其他的问题，[request](https://github.com/request/request) 模块的作者是 Mikeal Rogers, 他是 Node 的核心贡献者之一。

### 安装和应用 request 模块

要在当前目录下安装第三方请求模块，可以使用如下所示的命令：

```bash
$ npm install request
```
然后在应用程序或者模块中包含它：

```js
var request = require, ('request') ; 
```

之后需要提供一个 URL 和 一个回调函数就可以创建请求了，如下所示：

```js
request('http://www.acme.com:4001/something?page=2', function (error, response, body) {
    //...
});
```

上述代码会对指定的 URL 执行 HTTP GET 请求，同时接收响应和响应主体缓冲区，并将他们传递给一个简单的回调函数作为参数。

可以使用其他的渐变方法修改 HTTP 动词，如下所示：


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
})
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
    "If-Modified-Sincen": "Sat, 28 Jan 2012 00:00:52 GMT"
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




# 创建 HTTP 请求

**本章提要：**

* 向 HTTP 服务器发送 GET 请求

* 在 HTTP 请求上使用不同的 HTTP 协议

* 查看请求响应状态和头部的属性

* 使用第三方请求模块

HTTP 已经成为互联网上许多私有和公有服务的底层基础的核心部分，HTTP不仅被用来提供静态数据，而且也成为提供和使用公共API 的首选方式。

由于 Node 擅长处理 I/O 操作，所以它不仅适合提供 HTTP 服务，也适合使用这些服务。在接下来的几节里，你将学习使用核心 `http` 模块和实用的第三方请求模块执行和控制 HTTP 请求。

在 HTTP 协议中，请求有两个重要的属性：URL 和方法。最常见的方法是 GET 方法。它主要用来请求内容，同时还有其他方法，如POST (主要被用来提交 Web 表单）、PUT、DELETE 和 HEAD, 每一种方法都会从服务器获得不同的结果。

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

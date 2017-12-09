# 用 HTTPS 保证 HTTP 服务

**本章提要：**

- 创建HTTPS服务器

- 创建面向HTTPS服务器的请求

- 验证客户端和服务器证书

HTTPS 为标准的 HTTP 协议增加了 TLS 的安全性，在 Node 中HTTPS 被实现为一个有别于 HTTP 的独立模块，除了一些细微的差别外，HTTPS API 和 HTTP API 十分相似。

`https` Node 核心模块扩展了核心 `http` 模块，并将 `tls` 模块作为传输机制。例如，`https.Server`
伪类继承自 `http.Server` 伪类，改写了对应的 `Agent` 类中创建连接的方法，它用实例化 TLS 连接来代替实例化普通的 TCP 连接。

## 构建安全的 HTTP 服务器

在本节中你将创建一个 HTTP 服务器， 该服务器通过一个安全加密的信道与客户端交互， 创建的 HTTP 服务器可以向客户端提供自认证，也可以对客户端身份进行认证。

首先，必须创建服务器私钥和自签名证书，这和在第15章中所做的相同：

```bash
# 私钥
$ openssl genrsa -out client_key.pem 1024
# 证书申请文件
$ openssl req -new -key client_key.pem -out client_csr.pem
# 证书
$ openssl x509 -req -in client_csr.pem -signkey client_key.pem -out client_cert.pem
```

生成证书申请文件会提出一些问题——只要愿意就可以回答。

### 设置服务器选项

为了创建服务器，可以这样做，如下所示：

```js
var fs = require('fs');
var https = require('https');

var options = {
    key: fs.readFileSync('server_key.pem'),
    cert: fs.readFileSync('server_cert.pem')
};

var server = https.createServer(options, function (req, res) {
    res.write(200, {"Content-Type": "text/plain"});
    res.end('Hello World!');
});
```

`https.createServer` 的第一个参数是一个选项对象，这个对象和 TLS 模块很相似，也提供私钥和证书字符串。正如在第 15 章所做的那样，要使用 `fs.readFileSync` 函数从文件系统记载私钥和证书，顾名思义，`fs.readFileSync` 函数会同步加载文件。

> **[info] 注意：**
>
> 正如第 15 章所提到的，同步加载私钥和证书不会产生阻塞事件循环的危险，因为它是在模块加载阶段完成的，而模块加载阶段发生在 Node 的事件循环启动之前。

### 监听连接

然后可以和原生的 HTTP 服务器一样注册监听器，让其监听某个特定的端口：

```js
var port = 3000;
server.listen(port);
```

还可以指定希望监听哪个接口：

```js
port = 3000;
var address = '192.168.1.100';
server.listen(port, address);
```
如果没有指定地址，那么服务器就会监听所有网络接口。

`listen` 命令是异步的，这意味着服务器不会在接收该命令后立刻监听连接。但是可以提供一个回调函数，该回调函数在服务器开始监听时就会被调用，可以将这个回调函数传入 `erver.listen` 函数，作为其第二个或者第三个参数（不管是否指定了一个网络接口绑定到其上）：

```js
server.listen(port, address, function () {
    console.log('Server is listening on part', server.address().port). ;
});
```

### 验证 HTTPS 客户端证书

如果正在创建 HTTPS 服务器，你的主要关注点也许是服务器与客户端之间的信道是否被加密。也许需要每个客户端都能用认证的方式来识别服务器。也许需要服务器验证客卢端的真实性。最后一个例子不是最常见的用例，但是它在希望构建具有高安全性的计算机到计算机的通信方案时非常有用，尤其在向客户端发布身份证书时（类似千一些家庭银行服务所做的那样）十分有用。

可以通过指定服务器的一些启动选项来让其验证客户端的真实性：

```js
var options = {
    key: fs.readFileSync('server_key.pem'),
    cert: fs.readFileSync('server_cert.pem'),
    requestCert: true,
    rejectUnauthorized: true
};
```

现在用到了两个新选项: `requestCert` 和`rejectUnauthorized`，两个选项被设置为 `true`。 第一个选项要求客户端发送证书，第二个选项要求服务器拒绝那些未通过认证中心链验证的证书。

> **[info] 注意：**
>
> 要了解更多关于认证中心的信息，请参见笫 15 章 “用TLS/SSL保 证TCP服务器的安全性”

此外，`rejectUnauthorized` 只有在 `requestCert` 为 `true`时可用，并且它的默认值为`true`。当`rejectUnauthorized` 被显式地设置为 `false` 时还可以在监听函数中通过查看客户端流上的 `authoried` 属性来确定客户端是否可信：

```js
var options = {
    key: fs.readFileSync('server_key.pem'),
    cert: fs.readFileSync('server_cert.pem'),
    requestCert: true,
    rejectUnauthorized: false
};

var server = https.createServer(options, function (req, res) {
    console.log('authorized:', req.socket.authoried);
});
```

也可以获取客户端证书，但是注意只能在 `socket.authorized `为 `true` 时才能相信证书信息的真实性。 获取客户端证书信息的方法如下所示：

```js
var server = https.createServer(options, function (req, res) {
    console.log('authorized:', req.socket.authoried);
    console.log('client certificate:', req.socket.getPeerCertificate());
});
```

通过查询流是否可信（`req.socket.authoried`）以及获取网络端点的证书（`req.socket.getPeerCertificate()`），可以识别和证实客户端连接的可信性。

## 创建 HTTP 客户端

在 Node 中，创建 HTTPS 请求与创建 HTTP 请求非常相似，实际上很可能就是相同的。因为并不需要创建客户端私钥和客户端证书，除非服务器需要它们。

### 初始化客户端

可以针对 HTTPS 服务器创建 HTTPS 请求，如下所示：

```js
var fs = require('fs');
var https = require('https');

var options = {
    host: '0.0.0.0',
    port: 3000,
    method: 'GET',
    path: '/'
};
```

同初始化 HTTP 客户端的代码很相似，需要创建一个包含请求选项的对象，该对象应该包含主机、端口和路径的值。如果想要创建一个使用 `GET` 之外的方法的请求，还可以指定方法。

### 创建请求

必须将最后几个指定主机、端口、方法和路径的选项传递到 `https` 模块中的 `request` 函数中，`request` 函数会接受选项对象和一个回调函数，并返回一个 `http.ClientRequest` 的实例。

```js
var request = https.request(optins, function (response) {
    console.log('response.statusCode:', response.statusCode);
    resposne.on('data', function (data) {
        console.log('got some data back from server: ', data);
    })
});

request.write('Hey!\n');
request.end();
```

上面创建的客户端请求是一个可写流，可以向其中写入数据，或者将一个可读流传入其中，然后就应该结束请求以便让服务器做出响应。

一旦接收到来自服务器的响应，就会触发 `request` 对象上的`response`事件，回调函数就会获得 `response` 对象。如果对响应主体的内容感兴趣，因为 `response` 是一个可读流，所以意味着可以将其传入一个可写流或者只是为任意的 `data` 事件注册一个回调函数。

### 验证 HTTPS 服务器证书

除了安全信道外，客户端对服务器证书的验证是在网络上使用 HTTPS 最常见的理由。大多数网络浏览器希望确保与它们交互的服务器与 URL 栏中显示的一致。通过使用内置的 Node HTTPS 客户端就可以执行这种验证。

当执行请求时，在获得了 `response` 事件以及 `response` 对象后，就可以查看 `response` 对象。`response` 对象在其 `socket` 属性内有一个 `stream` 对象，由于它是 TLS 流，因此可以在其上调用 `getPeerCertificate` 函数来获取服务器证书，如下所示：

```js
var fs = require('fs');
var https = require('https');

var options = {
    host: 'baidu.com',
    method: 'Get',
    path: '/'
};

var req = https.request(options, function (res) {
    console.log('res.socket.authorized:' ,res.socket.authorized);
    console.log('peer certificate:'); 
    console.log(res.socket.getPeerCertificate()); 
});

req.end();

```

如果运行上面这个小型 HTTPS 客户端，就会获得与如下所示类似的输出信息： 

```bash
res.socket.authorized: true
peer certificate:
{ subject:
   { C: 'CN',
     ST: 'beijing',
     L: 'beijing',
     O: 'BeiJing Baidu Netcom Science Technology Co., Ltd',
     OU: 'service operation department',
     CN: 'www.baidu.cn' },
  issuer:
   { C: 'US',
     O: 'Symantec Corporation',
     OU: 'Symantec Trust Network',
     CN: 'Symantec Class 3 Secure Server CA - G4' },
  subjectaltname: 'DNS:baidu.cn, DNS:baidu.com, DNS:baidu.com.cn, DNS:w.baidu.com, DNS:ww.baidu.com, DNS:www.baidu.cn, DNS:www.baidu.com.cn, DNS:www.baidu.com.hk, DNS:www.baidu.hk, DNS:www.baidu.net.au, DNS:www.baidu.net.my, DNS:www.baidu.net.ph, DNS:www.baidu.net.pk, DNS:www.baidu.net.tw, DNS:www.baidu.net.vn, DNS:wwww.baidu.com, DNS:wwww.baidu.com.cn',
  infoAccess:
   { 'OCSP - URI': [ 'http://ss.symcd.com' ],
     'CA Issuers - URI': [ 'http://ss.symcb.com/ss.crt' ] },
  modulus: 'B5E65D085FF23C39FBCE58ACDC838FB27307BB85D96CB4DBE2A16513389BF3FB289ED6BEB1DF945CB41A0552CE91DD33A54C8DFE89374EC2D5A9CA3298239A2914E45B1054DF61842D59FC6BE1336B8F3F146B1E7F936EBFBA9959AD3E28B00AABA00970492219E9C944FD948066EDEE3B4DA67F29BCB184F244E45D62079A9E2515BB8436C921CA974200E63F7048B6BAB2E6A93EE06C1E0196A0BF543153F0570197FE5B5486B16DD9F79C65F101EE4018B85C4846767762428409767E875C7A7F64142788DAE372B43C6AC2315FD5CA3879A4EB1C1C7533451A004410E14ED66F0898E5B11BD85288CD0BBAF119C88D141E09DB163CF2DC49280896883217',
  exponent: '0x10001',
  valid_from: 'Feb 26 00:00:00 2017 GMT',
  valid_to: 'Apr 12 23:59:59 2018 GMT',
  fingerprint: '6A:56:84:83:C9:D2:1D:C0:5E:30:6D:EA:32:7D:F2:15:40:4D:5A:81',
  ext_key_usage: [ '1.3.6.1.5.5.7.3.1', '1.3.6.1.5.5.7.3.2' ],
  serialNumber: '4B44D99553328334AB30D9388226613C',
  raw: <Buffer 30 82 07 25 30 82 06 0d a0 03 02 01 02 02 10 4b 44 d9 95 53 32 83 34 ab 30 d9 38 82 26 61 3c 30 0d 06 09 2a 86 48 86 f7 0d 01 01 0b 05 00 30 7e 31 0b ... > }
```

上面这段信息中的验证数据以及 `res.socket.authorized` 为 `true`的事实，让你有把握断定主题与主机名或者作为请求目标的域是否匹配。

## 本章小结

HTTPS 是保证信道安全和在通信节点间提供认证框架的一种方法。可以用 HTTPS 对客户端或服务器进行认证，Node 的 `https` 模块扩展了 HTTP 模块的功能，它使用 TLS 模块提供位于 HTTP 之上的底层传输。

可以通过进入底层的 TLS 套接字以及抽取节点证书识别数据来验证服务器和客户端。
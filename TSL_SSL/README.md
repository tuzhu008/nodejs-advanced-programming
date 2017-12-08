# 用 TLS/SSL 保证服务器的安全

**本章提要：**

* 理解公钥基础结构是如何工作的

* 创建 TLS 服务器

* 连接 TLS 服务器

* 验证服务器和客户端整数

* 安全地收发数据

传输层安全(Transport Layer Security, TLS)和安全套接字层(Secure Socket Layer,SSL)允许客户端／服务器应用程序以阻止窃听（其他人看到你的消息）和篡改（别人修改你的消息）的方式通过网络进行通信。TLS/SSL 会在传输层上对网络连接进行加密，这使得隐私和消息都能得到验证。


TSL 是基于 Netscape 公司开发的早期 SSL 规范， 实际上， TLS 1.0 也被称为 SSL 3.1，而最新版的TLS(TLS 1.2)也被称为SSL 3.3。本章将用 TLS 代替遭轻视的 SSL 命名法。

## 理解私钥和公钥

公钥加密是指需要两个独立密钥的加密系统，一个密钥用来加密明文，另一个密钥解密已加密的消息。其中一个密钥是公有的，另一个是私有的，如果明文使用公钥加密，那么只能用私钥对其进行解密， 这可以使公钥拥有者和私钥拥有者进行私有通信。如果明文是用私钥加密的，那么公钥就可以对其进行解密，在这种情况下，系统会验证私钥拥有者在文档上的签名。

公钥证书（也被称作数字证书）使用数字签名绑定公钥和身份信息—— 个人或者是组织。文档会由认证中心进行签名，认证中心会完成验证匹配公钥的身份信息的过程。认证中心会响应其他证书，无论这个证书是自签名的还是由其他认证中心签名的，这样就会形成一个授权链，这个授权链是公钥基础结构的一部分。

每台计算机都会定义一组根认证中心，在默认情况下用它们来验证认证和认证链。在使用 Node 的 TSL 库时，可以使用这些默认的认证中心或者自定义的认证中心。

### 产生私钥

> **[info] 注意：**
>
> Node 中的 TSL 是基于 OpenSSL 库实现的，可能你已经安装了这个库，为了检查安装与否，需要打开一个终端并尝试使用openssl 命令。 如果 OpenSSL 库没有安装，就要查找 openssl 包并安装。

TLS 依赖于公钥/私钥基础结构，在这个基础结构中，每个客户端和服务器都必须有一个私钥对消息签名。openssl 实用程序可以在命令行上创建私钥，如下所示：

```bash
$ openssl genrsa -out my_key.pem 1024
```

上面的命令创建了一个文件 my_key.pem，也称私钥。

### 产生公钥

设计 TLSS 的服务器和客户端在彼此验证时必须有一个证书，证书是由认证中心签名或者字签名的公钥。获取证书的第一步是创建一个证书签发请求（Certificate Signing Request, CSR）文件，如下所示：

```bash
$ openssl req -new -key my_key.pem -out my_csr.pem
```

上述命令会创建一个 CSR 文件 my_csr.pem，但首先你必须回答几个由 openssl 提出的身份认证问题。

为了用 CSR 创建自签名的证书，可以如下所示：

```bash
$ openssl x509 -req -in my_csr.pem -signkey my_key.pem -out my_cert.pem
```
上述命令会在私钥和认证请求的基础上创建一个自签名文件 my_cert.pem。另一种方法是将 CSR 发送到认证中心进行签名，但是对于研究本章中的示例而言，自签名认证已经足够了。

## 构建 TSL 服务器

TLS 服务器是 `net.Server` 的子集，在第 10 章“构建 TCP 服务器”中我已经介绍过 `net.Server`。能用 `net.Server` 创建什么，就能用 TSL 创建社么。但是，在使用 TSL 服务器时，使用的是安全连接。

### 初始化服务器

初始化 TLS 服务器比初始化普通的 TCP 服务器要稍微复杂一些，因为必须传入服务器的私钥和证书文件。

```js
var tls = require('tls');
var fs = require('fs');

var serverOptions = {
    key: fs.readFileSync('./my_key.pem'),
    cert: fs.readFileSync('./my_cert.pem')
};

var server = tls.createServer(serverOptions);
```

在上面的代码中，用到了同步版本的 fs.readFile，它会将文件全部读入内存，来获取文件系统上的密钥和证书。

> **[info] 注意：**
>
> 在上面的代码中用到了 `fs.readFileSync`，这是一个同步函数。这不会阻塞事件循环吗？不会，它只是在 Node 的初始化阶段执行，此时事件循环还没有开始。只要不是在事件处理程序中使用阻塞函数，就不会阻塞事件循环。
>
> 但是等等，如果这是一个写入数据的模块，而某些人在回调函数中请求该模块会怎么样？不应该在回调函数内部请求模块，这些模块会进行同步的文件系统访问，这样就会阻塞事件循环。

除了 `key` 选项和 `cert` 选项外，`tls.createServer` 还可以接受如下所示的选项：

* `requestCert` —— 如果为true，服务器就会请求连接到其上的客户端的证书，并且会尝试对证书进行验证。默认值是 `false` 

* `rejectUnauthorized` —— 如果为true，服务器会使用一个认证中心的列表来拒绝任何未经授权的连接。该选项只在`requestCert` 为 `true` 时起作用。默认值是 `false`。

### 监听连接

与简单的 TCP 服务器一样，可以将 TLS 服务器绑定到 TCP 端口，如下所示：

```js
var port = 3000;
server.listen(port);
```

当有新的连接到达时，服务器会发射 `secureConnection` 事件，并将其传入套接字来注册回调函数：

```js
function connectionListener (stream) {
    console.log('got a new connection');
}

server.on('secureConnection', connectionListener);
```

### 从客户端读取数据

当有客户端连接时，服务器会发射 `secureConnection` 事件，并将 `tls.CleartextStream` 类的实例传入回调函数。与 `net.Socket` 对象很相似，`tls.CleartextStream` 对象实现了一个双向流接口，这意味着所有可读流，可写流以及流的事件都可为你所用，只需要绑定 `data` 事件来获取客户端发送发送的未加密的数据即可，如下所示：

```js
function connectionListener (stream) {
    console.log('got a new connection');
    // 监听 data 事件
    stream.on('data', function (data) {
        console.log('got some from the client', data);
    });
}

server.on('secureConnection', connectionListener);
```

### 向客户端发送数据

还可以使用 `CleartextStream` 对象向连接到服务器上的客户端发送数据，如下所示：

```js
server.on('secureConnection', function (stream) {
    stream.write('Hey Hello!\n');
});
```

### 终止连接

只要调用客户端流上的 `.end()` 函数就可以终止安全连接，例如，如果客户端输入了 ‘quit’，就可以终止连接，如下所示：

```js
server.on('secureConnection', function (stream) {
    console.log('got a new connection');
    // 监听 data 事件
    stream.on('data', function (data) {
        console.log('got some from the client', data);
        if (data.toString().trim().toLowerCase() === 'quit') {
            stream.end('Bye bye!');
        }
    });
});
```

与 TCP 下的情况一样，可以将一个字符串或者缓冲区传入 `stream.end` 函数，它们将在连接关闭前最后被发送到客户端。

## 构建 TCP 客户端

要创建到服务器的连接，首先必须发布密钥和证书，如果没有，请按照本章开始的讲解创建它们。

### 初始化客户端

必须用几个选项来初始化客户端连接，首先必须获得这些选项。事先应该已经创建了私钥和数字证书，并将它们存入了本地文件，可以用 `fs.readFile` 的本地版本 `fs.readFileSync` 来获取私钥和数字证书。

```js
var fs = require('fs');
var options = {
    key: fs.readFileSync('/path/to/my/private_key.pem'),
    cert: fs.readFileSync('/path/to/my/cert.pem'),
};
```

### 连接服务器

拥有了私钥和数字证书之后，就可以使用 `tls.connect` 函数连接 TLS 服务器：

```js
var tls = require('tls');
var host = 'localhost';
var port = '3000';

var client = tls.connect(port, host, options, function () {
    console.log('connected');
});
```

### 验证服务器证书

私钥和公钥允许你在客户端和服务器之间建立一条安全的信道，也就是说该信道可以免受监听和消息篡改。然而，在建立连接之后，你也许还想确认所连接的确实是所希望连接的服务器，为此可以查看服务器证书。

为了能够查看服务器证书，需要学习一些未曾见过的 TLS 连接选项，其中之一就是 ca，它是授权中心的缩写。如果忽略该选项，会使用默认的一组根证书。

> **[info] 注意：**
>
> 除非内部的认证中心为你的自定义操作颁布了证书，否则就要忽略该选项并使用默认的证书。
>
> 如果想用自定义的证书来改写默认的证书，必须传入一个包含所有认证中心证书的缓冲区或者字符串数组。

默认的证书集合被用来对服务器进行认证，服务器会发送它的身份信息，而 TLS 客户端会检验身份信息的签名，看其是否与可信任的认证中心的签名相符。

如果证书得到认可，`CleartextStream` 实例（将其赋值给client 变量）会将属性 `authorized` 设置为 `true`。如果没有得到认可，流会将 `authorized` 属性设置为 `false`，并且流的 `authorizationError` 属性值会包含出错的原因。如果根据认证中心，服务器证书没有得到授权，就可以拒绝连接，如下所示：

```js
var client = tls.connect(port, host, options, function () {
    console.log('authorized: ' +  client.authorized);
    if ( !client.authorized) {
        console.loh('client denied access: ', client.authorizationError);
    } else {
        // ...
    }
});
```

### 向服务器发送数据

回忆一下，`tls.connect` 函数返回的对象是 `tls.CleartextStream` 的一个实例，它也是一个可写流，这意味着可以使用 `write()` 函数像服务器发送数据：

```js
var client = tls.connect(port, host, options, function () {
    console.log('connected');
    client.write('Hey, hello!');
});
```

### 从服务器读取数据

一旦连接到服务器上，并且服务器已经开始发送数据，就可以得到 `CleartextStream` 对象发射的 `data` 事件。

```js
var client = tls.connect(port, host, options, function () {
    console.log('connected');
    client.on('data', function (data) {
        console.log('got some data from the server:', data);
    });
});
```

### 终止连接

基于应用程序以及服务器与客户端之间达成一致的协议，客户端也许在不再需要连接时关闭它。

由于只是关闭了连接的终端，因此仍然可以继续从服务器获得消息。

```
var client = tls.connect(port, host, options, function () {
    client.end('Bye bye!');
});
```

## 创建几个示例

一时候将前述内容整合一下了，现在需要创建一个 TLS 聊天服务器和客户端。必须为客户端和服务器分别创建目录，以便可以轻松的分开脚本、密钥和证书文件。

### 创建 TLS 聊天服务器

创建一个项目目录 cha_server，并将密钥和证书文件放入其中，首先创建服务器密钥：

```bash
$ openssl genrsa -out server_key.pem 1024
```

然后创建证书请求：

```bash
$ openssl req -new -key server_key.pem -out server_csr.pem
```

为了用 CSR 创建自签名的证书，可以这样做，如下所示：

```bash
$ openssl x509 -req -in server_csr.pem -signkey server_key.pem -out server_cert.pem
```

既然 chat_server 目录中已经有了 server_cert.pem 文件， 那么可以将服务器脚本存入文件 server.js。

**server.js：**

```js
var tls = require('tls');
var fs = require('fs');
var port = 3000;

var clients = [];

var options = {
  key: fs.readFileSync('server_key.pem'),
  cert: fs.readFileSync('server_cert.pem'),
};

function distribute (from, data) {
  clients.forEach(function (client) {
    if (client !== from) {
      client.write(from.remoteAddress + ':' + from.remotePort + ' said: ' + data);
    } 
  });
}

var server = tls.createServer(options, function (client) {
  console.log('client.authorized:', client.authorized); 
  clients.push(client);

  client.on('data', function (data) {
    distribute(client, data);
  });

  client.on('close', function () {
    console.log('closed connection');
    clients.splice(clients.indexOf(client), 1);
  });
});

server.listen(port, function () {
  console.log('listening on port', server.address().port);
});
```

本例中的服务器会在一个模块全局数组中维护一个包含所有连接到其上的客户端列表，这个数组存储在变量 `clients` 中。当有客户端进行连接时，就会被添加到该数组中。当客户端发送数据时，数据都会被发送到所有其他的客户端，并且在所发数据之前会添加源 IP 地址和 TCP 端口号作为前缀。同样，当个客户端断开连接时，就会从列表中删除。

现在只需要运行服务器：

```bash
node server.js
```

### 创建 TLS 命令行聊天客户端

在创建了 chat_client 目录之后，就可以开始创建客户端密钥和证书：

```bash
$ openssl genrsa -out client_key.pem 1024
```

```bash
$ openssl req -new -key client_key.pem -out client_csr.pem 
```

```bash
$ openssl x509 -req -in client_csr.pem -signkey client_key.pem -out client_cert.pem 
```

用客户端密钥和证书文件就可以创建客户端代码，并将代码存入文件client.js

**client.js：**

```js
var tls = require('tls');
var fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

var port = 3000;
var host = '0.0.0.0';

var options = {
  key: fs.readFileSync('client_key.pem'),
  cert: fs.readFileSync('client_cert.pem'),
};

process.stdin.resume();

var client = tls.connect(port, host, options, function () {
  console.log('connected');
  process.stdin.pipe(client, {end: false});
  client.pipe(process.stdout);
});

```

这个客户端非常简单——它连接到本地主机上的 TLS 服务器，然后将进程的标准输入传入服务器，也即将输入的每一行传入服务器。它还会将服务器流传入到一个标准输出，它还会输出服务器发送的所有字符。

可以通过在多个窗口中启动客户端来进行测试：

```bash
$ node client.js 
```

你会看到在某个客户端窗口中输入的内容也会显示在所有其他客户端上。

### 验证客户端证书

服务器还有一件事没做，就是验证客户端证书。如果打开`requestCert` 选项，会看到客户端流上的 `authorized` 选项被设置为 `false`:

```js
var options = {
  key: fs.readFileSync('client_key.pem'),
  cert: fs.readFileSync('client_cert.pem'),
  requestCert: true
};
```
```js
var server = tls.createServer(options, function (client) {
  console.log('client.authorized:', client.authorized); 
  // ...
}
```

如果对服务器进行上述修改并运行客户端，会看到服务器输出如下所示的信息：

```bash
client.authorized: false
```

通过将 `rejectUnauthorized` 设置为 `true`(默认为 `true`) ,还可以决定不接受任何未经授权的客户端:

```js
var options = {
  key: fs.readFileSync('server_key.pem'),
  cert: fs.readFileSync('server_cert.pem'),
  requestCert: true,
  rejectUnauthorized: true 
};
```

> **[info] 「编者注」：**
>
> `rejectUnauthorized` 在 `authorized`设置为 `true` 时可用，其默认值为 `true`。因此想要得到 `client.authorized: false` 这个结果，需要明确地将 `rejectUnauthorized` 设置为 `false`。

上述代码保证未通过认证链的客户端不会得到服务，如果尝试一下， 你会发现这样的客户端无法进入服务器回调函数。

述情况会发生是因为客户端证书是自签名的，而服务器使用的是默认的认证中心、默认的认证中心无法验证客户端上自签名的证书。

可以在服务器上耍点小把戏来测试一下这个特性——复制客户端证书并将其当作认证中心

```bash
$ cd chat_server
$ cp ../chat_client/client_cert.pem fake_ca.pem
```

然后改写服务器上的认证中心选项：

```js
var options = {
  key: fs.readFileSync('server_key.pem'),
  cert: fs.readFileSync('server_cert.pem'),
  ca: [fs.readFileSync('fake_ca.pem')]
  requestCert: true
};
```

此后如果启动服务器并将其与某个客户端进行连接，将会看到客户端已被授权：

```bash
client.authorized: true 
```

## 本章小结

TLS 在 TCP 之上提供了一个加密的通信流，并且使用公钥/私钥对客户端和服务器进行验证。要进行通信，必须要有私钥和签名证书。证书可以是自签名的，如果服务器或者客户端需要的话，也可以由认证中心对证书进行签名。

TLS 服务器和客户端遵循 `net` 模块中已有的模式，但是具有一些扩展，即允许指定重要的私钥和证书，私钥和证书允许你进行一些设置，决定是否进行验证。
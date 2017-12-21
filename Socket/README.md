# 使用 Socket.IO 创建通用的实时 Web 应用程序

**本章提要**

* 理解与实时应用程序相关的 HTTP 历史

* 理解 WebSockets 如何使实时应用程序在网络上变得可行

* 使用 Socket.IO 为 Node.js 编写实时应用程序

* 使用针对 Node.js 的 Socket.IO 编写基于网络的实时聊天应用程序

* 使用名称空间分离 Socket.IO 应用程序

* 使用 Redis 扩展到几个 Node 进样

多年来，HTTP 和实时应用程序无法真正很好地共存，原因在于HTTP 协议的特殊性质，这个特殊性质是指 HTTP 协议是无状态的，并且是基于请求－响应循环的 HTTP 服务器只会响应来自客户端的请求，但是，它与客户端之间不具备有状态的持续连接。

基于 HTML 和 JavaScript 的应用程序可以响应客户端事件，并将这些事件发送到服务器上，但是反其道而行之却并不容易。如果在服务器端发生一个事件，服务器无法将有关该事件的信息实时主动地通知它的客户端。只有在客户端查询服务器的当前状态时，所发生的信息才会从服务器传递到客户端。

基于浏览器的聊天应用程序是基于 web 的实时应用程序的一个很好的示例，它展示了 HTTP 的局限性。多个用户共享一间聊天室，这从技术上意味着任何一个参与聊天的用户所发送的消息都必然会传递给同一聊天室中的其他用户。

为了获得实时性（或至少是近实时性），针对传统网络聊天应用程序中的行为采用一些变通方法十分普遍，形式最简单的变通方法是采用传统的请求-响应流程：每个聊天用户的浏览器会每隔一定时间对HTTP 服务器进行轮询，看是否有新的消息，只要轮询速度足够快，例如每隔 1 秒或更少时间，就会给人造成交互是实时进行的印象。

然而，上述技术极其低效，客户端必须每隔1秒就要进行一次轮询，服务器也必须每隔 1 秒对来自所有连接到其上的聊天用户的请求进行处理，即使没有新消息也是如此。在一个每隔 10 秒钟才会发布新消息的聊天室中，客户端和服务器都必须进行大量计算，而其中90% 的计算都是没有必要的。

现在已经开发出了更为灵活的变通方法，但是这些变通方法仍然是基于请求－响应循还的，只是在使用请求－响应循环的效率方面略微有所提高而已。长轮询是这样一种技术：客户端只向服务器发出一次请求，然后服务器就会将连接保持为打开状态，并且只要有新数据可用就将其发送出去。但是因为 HTTP 不是被设计用于这一目的，所以长轮询的实现仍然会造成一些问题——浏览器在面对连续的请求响应时会表现出不同的行为，此外，将连接保持为打开状态通常会在服务器端导致低效的加载行为。

如今的情况要好得多，WebSocket 协议已被开发出来（已经成为了标准），用于克服与实时应用程序有关的 HTTP 的缺陷，现在它不需要所谓的变通方式，就可以让 HTTP 客户端与浏览器以高效，全双工的方式进行交互。

实时网络应用程序首次能够只使用网络技术，而不需要诸如 Java Applets、Flash 或者 ActiveX 这样的外部技术。

## 理解 WebSockets 如何工作

WebSocket 连接在其核心只不过是 HTTP 服务器和 HTTP 客户端之间传统的 TCP 连接，WebSocket 连接是用一种握手协议创建的，该握手协议和 HTTP 握手十分相似。

客户端会初始化连接，为此，浏览器会向服务器发送—个特殊的 HTTP/1.1 请求，要求服务器将特殊请求的连接转换为 WebSocket 连接：

```
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket 
Connection: Upgrade 
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ== 
Origin: http://example.com 
Sec-WebSocket-Protocol: chat, superchat Sec-WebSocket-Version: 13 
```

虽然是从常规的 HTTP 连接开始，但是客户端要求将这个常规连接“升级”为 Websocket 连接，如果服务器支持 WebSocket 协议，会做出如下所示的响应：

```
HTTP/1.1 101 Switching Protocols Upgrade,: websocket 
Connection: Upgrade 
Sec-WebSocket-Accept: s3pPLMBitxaQ9kYGzzhZRbK+xOo= Sec-WebSocket-Protocol: chat
```

上面的响应标志着握手的结束，并且连接已经切换到数据传输模式。客户端和服务器不需要 HTTP 开销或者额外的握手就可以来回传递消息，也就是说创建了一个双向全双工的通信连接，在这个连接中，客户端和服务器不必互相等待，在任意时刻都可以向对方发送信息。

## 使用 Socket.IO 创建 WebSocket 应用程序

虽然为 Node.js 实现自定义的 WebSocket 服务器是可能的，但是没有必要这样做。在实一个实际的应用程序之前，有很多底层细节需要处理，而应用程序就建立在这些底层细节之上，这样一来使用库就要实用得多。

创建 WebSocket Node.js 应用程序事实上的标准库是Socket.IO，它不仅是一个包装器库，使得创建 WebSocket 服务器十分方便，而且还为不支持 WebSocket 协议的客户端提供了类似长轮询的透明回调机制，此外它还带有一套客户端的库，这套库为开发应用程序的浏览器部分提供了一组方便的 API。

通过使用 Socket.IO，就不需要解决 WebSocket 服务器或客户端的实现细节问题。无论是在服务器端还是在客户端，都能获得一组纯净和富于表现力的 API，这可以让你很轻松地编写出实时应用程序。

### 在服务器上安装和运行 Socket.IO

与很多其他的 Node.js 库相似，Socket.IO 也是一个 NPM 模块，因此，可以按照如下的方式来安装：

```bash
$ npm install socket.io
```

在安装Socket.IO之后， 就可以实现一个非常基本的WebSocket服务器， 如下所示：

```js
var io = require('socket.io').listen(3000);

io.sockets.on('connection', function (socket) {
  socket.on('my event', function (content) {
    console.log(content);
  });
});
```

将上面的代码保存为 server.js

此时需要一个客户端，客户端的代码如下：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sockey.IO example application</title>
  <script src="http://localhost:3000/socket.io/socket.io.js"></script>
  <script>
    var socket = io('http://localhost:3000');
    socket.emit('my event', 'Hello world.');
  </script>
</head>
<body>
  
</body>
</html>
```

将上面的代码保存为文件 index.html，并将其与 server.js 放置在同一目录下。

如你所见，服务器端和客户端用到了相似的词汇表。在服务器上， 第一步是绑定一个端口，本例中是4000。只要服务器运行起来，它就会监听传入的 WebSocket 连接，只要有新客户端连接到其上， 就会触发 `connection` 事件，然后服务器就会监听该连接上传入的消息，并记录收到的消息内容。

> **[info] 注意**
>
> 如你所见，Socket.IO 提供了一种面向消息的通信机制，这是对底层 WebSocket 协议的一个改进，WebSockets 协议不提供消息分帧。
>
> 还可以看到，Socket.IO 对客户端是采用 WebSockets    进行连接还是采用其他类型的机制进行连接并不进行区分：它提供了一组统一的 API，这对实现细节进行了抽象。

事件名 `my event` 是随便取的——它只不过是客户端赋予所发送消息的标签而已，用来在应用程序内部区分不同类型的消息。

在客户端，通过连接到服务器来创建 WebSocket 连接，然后套接字被用来向服务器发射（或发送）`my event`消息，这会触发服务器代码中的监听器，结果是将消息内容输出到上控制台。

现在，如果通过 file:///path/to/index.html, 以本地方式打开 HTML 文件会非常顺利，但是由于打开本地文件时所应用的安全性限制，使得这个操作无法在所有浏览器中都能可靠的你行。

因此，需要通过 Node.js 服务器来提交 HTML 文件，它可以让你请求 http://localhost:3000，这就不会强加任何安全性限制，因为这是一个“真正的" HTTP 请求。

为此，就要将 Socket.IO 服务器架设在常规的 Node.js HTTP 服务器之上，并且通过这个服务器来提交 index.html 文件。听起来复杂吗？不，如下所示：

```js
var server = require('http').createServer(handler);
var io = require('socket.io')(server);
var fs = require('fs');

function handler (req, res) {
  fs.readFile(__dirname + '/index.html', function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.write('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

// 这里可以简写为 io.on
io.sockets.on('connection', function (socket) {
  socket.on('my event', function (content) {
    console.log(content);
  });
});

server.listen(3000, function () {
  console.log('Server is listen on port 3000');
});
```

在上面的代码中， WebSocket 服务器链接到了 HTTP 服务器中，并监听某些请求。当客户端在 `/socket.io` 之下进行任意请求，Socket.IO 都会处理这些请求，并返回 socket.io.js
脚本或者创建 WebSocket 连接，其他请求则会接收到index.html 文件作为响应。

现在可以运行服务器了，如下：

```bash
$ node server.js
```

现在将浏览器转向 http://localhost:3000/ ，字符串"Hello World" 就会输出在服务器的控制台上。

> **[info] 「编者注」**
>
> 我们来厘清一下逻辑：

> 1. `$ node server.js`
> 2. 使用 `http` 模块的 `createSever()` 创建了一个服务器，并为其传入了一个函数。这个函数是服务器 `request` 事件的处理函数。
> 3. 加载 `scoket.io` 模块并使用上一步创建的 HTTP 服务器作为参数创建一个 Sockey.IO 服务器。
> 4. 监听 `connection` 事件，当有新的客户端连接时被触发。
> 5. 启动 HTTP 服务器监听，端口 3000。
> 6. `$ node server.js` && 转到 http://localhost:3000/
> 7. 服务器收到请求，处理函数运行，读取数据，返回给浏览器
> 8. 浏览器渲染收到的 index.html 页面，页面运行，发射 `my event` 事件，消息 `"Hello world."`
> 服务器坚监听到 `my event` 事件，打印 `"Hello world."`

下面将介绍如何重写示例代码， 使其成为 个完整的应用程序。

### 使用 Socket.IO 创建实时网络聊天应用程序

Node.js 为网络上的实时应用程序提供了基础构件：它基于网络标准的 JavaScript，在本质上并不是非阻塞的，这对实现实时行为十分重要。

因此，实时 web 应用程序的典型代表，即基于浏览器的聊天室成为展示 Node.Js 性能的最流行的示例应用程序并不奇怪。

这个示例应用程序对于基本的聊天应用程序而言是一个很好的起点，它需要在服务器端和客户端都进行扩展，下面几节将会逐步讲解如何进行这种扩展。

**1、应用程序结构和用例**

基于浏览器的聊天应用程序非常简单，用户通过一个十分简约的界面与聊天系统进行交互，交互界面只有两个部件——一个文本输入域以及一个显示所有接收到的聊天信息的区域。

当用户在输入域中输入文本并按下回车键时，输入的文本就会发送到服务器。当在 Socket.IO 连接上接收到消息时，客户端就会将其添加到消息区域中。

每个客户端都会收到其他客户端发送的所有消息，并且这些消息也会返回给发送端

**2、聊天服务器**

外先要重写上面创建的服务器应用程序，需要监听新连接和新消息。当有来自客户端的新消息时，都要将其返还给发送他的客户端，然后将其广播给连接到服务器上的其他客户端。可以通过维护一个包含所有现在已连接到服务器的客户端队列来实现广播部分，但是没有必要这样做——Socket.IO 已经提供了一种方便的广播机制，可以将消息发送给所有已连接到服务器上的客户端(发送消息的客户端除外）。

因为聊天服务器的文件提交部分不要修改，所以主要重写处理套接字连接的部分：

```js
io.on('connection', function (socket) {
  socket.on('clientMessage', function (content) {
    socket.emit('serverMessage', 'You said: ' + content );
    socket.broadcast.emit('serverMessage', socket.id + ' said: '+ content);
  });
});
```

现在需要监听每个连接套接字上的 `clientMessage` 事件，并通过将事件内容返还给其发送端以及广播给其他客户端的方式来处理该事件。为了区分客户端上的聊天消息，在每条聊天消息之前加上了前缀 You said：或者 \<client id\> said:，client id是当前内部的客户端 ID 号。

重申一下，传入的事件名称并不是特殊的关键词，不具备任何与 Socket.IO 相关的含义——它可以是一个任意选择的标签。当然，需要保证客户端在套接字上发射消息时采用的是同一标签。

下面展示了完整的服务器代码：

```js
var server = require('http').createServer(handler);
var io = require('socket.io')(server);
var fs = require('fs');

function handler (req, res) {
  fs.readFile(__dirname + '/index.html', function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.write('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
  socket.on('clientMessage', function (content) {
    socket.emit('serverMessage', 'You said: ' + content );
    socket.broadcast.emit('serverMessage', socket.id + ' said: '+ content);
  });
});

server.listen(3000, function () {
  console.log('Server is listen on port 3000');
});
```

**3、聊天客户端**

因为在聊天应用程序服务器端上的消息处理仍然很初级，所以大部分繁重的消息处理实际是发生在客户端上。

因此，需要重写前述示例代码的大部分内容。客户端需要个部件让客户输入聊天消息，需要一个区域显示所有传入的聊天消息。首先我们编写这两个部件：

```html
<div id="chat">
  <div id="message"></div>
  <div id="input-wrapper">
    <input type="text" id="input" placeholder="请输入信息">
  </div>
</div>
```

然后，要在页面的 `<head>` 节中使用内嵌样式表，来对页面上的这两个部件进行样式处理和定位处理。

```css
#chat {
  width: 400px;
  height: 600px;
  margin: 0 auto;
  border:  2px solid #000;
}
#message {
  height: 500px;
}
#input-wrapper {
  height: 100px;
}
#input {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
```

在 `body` 的结束标签的前面需要加载 [Socket.IO 客户端库](https://github.com/socketio/socket.io-client)，并且增加客户端应用程序逻辑。
将 JavaScript 放在文档末尾十分重要，这可以保证所有的 DOM 元素都可以为 JavaScript 代码所用。

首先需要加载 Socket.IO 客户端库。

```html
  <script src="http://localhost:3000/socket.io/socket.io.js"></script>
```

之后再用 `<script type="text/javascript">` 为代码打开另一个脚本块后，需要处理两个用例——来自服务器的消息到达客户端，以及消息必须被发送到服务器。让我们从一个函数开始，该函数知道如何将新消息添加到消息域中。

```js
var messageElement = document
```

新消息通过 Socket.IO 连接到达，所以必须连接到后台，并为服务器代码发射的 `serverMessage` 事件增加一个处理程序：

```js
messsageElement = document.getElementById('message');
var lastMessageElement = null;

function addMessage (message) {
  var newMessageElement = document.createElement('div');
  var newMessageText = document.createTextNode(message);
  newMessageElement.appendChild(newMessageText);
  messsageElement.insertBefore(newMessageElement, lastMessageElement);
  lastMessageElement = newMessageElement;
}

var socket = io.connect('http://localhost:3000');
socket.on('serverMessage', function (content) {
  addMessage(content);
});
```

最后一步是发射 `clientMessage` 事件，该事件将用户消息作为其内容，为了达到这一目的，可以绑定输入文本的域的 `onkeydown` 事件，并且当用户按下回车键就能将用户信息写入套接字：

```js
var inputElement = document.getElementById('input');

inputElement.onkeydown = function (keybordEvent) {
  if (keybordEvent.keyCode === 13) {
    socket.emit('clientMessage', inputElement.value);
    inputElement.value = '';
    return false;
  } else {
    return true;
  }
};
```

将前述内容组合到一起就形成了文件 index.html，如下所示：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sockey.IO example application</title>
  <script src="http://localhost:3000/socket.io/socket.io.js"></script>
  <script>
    var socket = io('http://localhost:3000');
    socket.emit('clientMessage', 'Hello world.');
  </script>
  <style type="text/css">
    #chat {
      width: 400px;
      height: 600px;
      margin: 0 auto;
      border:  2px solid #000;
    }
    #message {
      height: 500px;
    }
    #input-wrapper {
      height: 100px;
    }
    #input {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="chat">
    <div id="message"></div>
    <div id="input-wrapper">
      <input type="text" id="input" placeholder="请输入信息">
    </div>
  </div>
  <script src="http://localhost:3000/socket.io/socket.io.js"></script>
  <script type="text/javascript">
    messsageElement = document.getElementById('message');
    var lastMessageElement = null;

    function addMessage (message) {
      var newMessageElement = document.createElement('div');
      var newMessageText = document.createTextNode(message);
      newMessageElement.appendChild(newMessageText);
      messsageElement.insertBefore(newMessageElement, lastMessageElement);
      lastMessageElement = newMessageElement;
    }

    var socket = io.connect('http://localhost:3000');
    socket.on('serverMessage', function (content) {
      addMessage(content);
    });

    var inputElement = document.getElementById('input');

    inputElement.onkeydown = function (keybordEvent) {
      console.log('dasda');
      if (keybordEvent.keyCode === 13) {
        socket.emit('clientMessage', inputElement.value);
        inputElement.value = '';
        return false;
      } else {
        return true;
      }
    };
  </script>
</body>
</html>
```

上面的代码实现了最简单的聊天用例，当用 `node server.js` 命令启动聊天服务器并打开 http://localhost:3000 就会看到一个精简的界面，通过该界面可以向其他用户发送消息，也可以接收来自其他用户的消息。打开另一个浏览器窗口或选项卡来模拟实际中的多用户交互。

### 扩展聊天应用程序

此时，客户端和服务器之间的聊天交互协议还不够丰富——客户端和服务器都会发射某种类型的消息，并会对某种类型的消息做出响应。当应用程序中的用例变得更为复杂时，上述情形将发生变化。

例如，由内部套接字 ID 来识别用户并不方便，如果能在开始聊天之前，由用户名来识别用户就比较合适。

这可以通过新增一种客户端到服务器的 Socket.IO 消息类型来实现，这个消息的类型是 login。

服务器需要通过关联用户名与套接字连接来处理该消息，用户名就是 `login` 消息的内容。

```js
socket.on('login', function (username) {
  socket.username = username;
  socket.emit('serverMessage', 'Currently logged in as ' + username);
  socket.broadcast.emit('serverMessage', 'User' + username + ' Logged in');
});
```

上述服务器端代码在套接字上设置了用户名，针对当前连接，采用 `socket.set` 在套接字上设置任意的键－值对，同时保留了你觉得有用的任意信息。

然后，需要从客户端发送 `login` 消息，为此，浏览器会向用户询问用户名，现在要用某个事件来触发该问题，这个事件可能是 `login` 服务器事件。

```js
socket.on('login', function (username) {
  var username = prompt('What username would you like use?');
  socket.emit('login', username);
});
```

之后，服务器需要在用户连接时，发送 `loggin` 事件。

```js
socket.on('login', function (username) {
  socket.set('username', username, function (err) {
    if (err) {
      throw err;
    }
    socket.emit('serverMessage', 'Currently logged in as ' + username);
    socket.broadcast.emit('serverMessage', 'User' + username + ' Logged in');
  });
});
```

并且服务器在用户连接成功时会发射 `loggin` 事件：

```js
socket.emit('login'); 
```

现在，登录流程是这样的：用户进行连接时，服务器发送 `login` 事件，浏览器一旦接收到该事件，就会向用户提示用户名，并通过 `login` 事件向服务器发送用户名。服务器对该事件进行处理，将用户名和套接字关联起来以备后用。

下面是完整的服务器代码：

```js
var server = require('http').createServer(handler);
var io = require('socket.io')(server);
var fs = require('fs');

function handler (req, res) {
  fs.readFile(__dirname + '/index.html', function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.write('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
  socket.emit('login');

  socket.on('login', function (username) {
    socket.username = username;
    socket.emit('serverMessage', 'Currently logged in as ' + username);
    socket.broadcast.emit('serverMessage', 'User' + username + ' Logged in');
  });

  socket.on('clientMessage', function (content) {
    socket.emit('serverMessage', 'You said: ' + content );
    socket.broadcast.emit('serverMessage', socket.username + ' said: '+ content);
  });
});

server.listen(3000, function () {
  console.log('Server is listen on port 3000');
});
```

这是完整的客户端代码：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sockey.IO example application</title>
  <style type="text/css">
    #chat {
      width: 400px;
      height: 600px;
      margin: 0 auto;
      border:  2px solid #000;
    }
    #message {
      height: 500px;
    }
    #input-wrapper {
      height: 100px;
    }
    #input {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="chat">
    <div id="message"></div>
    <div id="input-wrapper">
      <input type="text" id="input" placeholder="请输入信息">
    </div>
  </div>
  <script src="http://localhost:3000/socket.io/socket.io.js"></script>
  <script type="text/javascript">
    messsageElement = document.getElementById('message');
    var lastMessageElement = null;

    function addMessage (message) {
      var newMessageElement = document.createElement('div');
      var newMessageText = document.createTextNode(message);
      newMessageElement.appendChild(newMessageText);
      messsageElement.insertBefore(newMessageElement, lastMessageElement);
      lastMessageElement = newMessageElement;
    }

    var socket = io.connect('http://localhost:3000');
    
    socket.on('login', function (username) {
      console.log('dasda')
      var username = prompt('What username would you like use?');
      socket.emit('login', username);
    });

    socket.on('serverMessage', function (content) {
      addMessage(content);
    });

    var inputElement = document.getElementById('input');

    inputElement.onkeydown = function (keybordEvent) {
      console.log('dasda');
      if (keybordEvent.keyCode === 13) {
        socket.emit('clientMessage', inputElement.value);
        inputElement.value = '';
        return false;
      } else {
        return true;
      }
    };
  </script>
</body>
</html>
```

现在将客户端代码保存为文件 index.html，同时将服务器代码保存为文件app.js，然后运行服务器代码，如下所示：

```bash
$ node app.js
```

### 检测连接断开

现在，用户离开聊天的唯一方法就是关闭浏览器窗口，这会在服务器端的套接字上触发 `disconnect` 事件。某个用户离家聊天时，能够让其他用户得到通知会非常有趣：

```js
socket.on('disconnect', function () {
  socket.broadcast.emit('serverMessage', 'User ' + socket.username + 'disconnected');
});
```

检测连接断开的服务器代码：

```js
var server = require('http').createServer(handler);
var io = require('socket.io')(server);
var fs = require('fs');

function handler (req, res) {
  fs.readFile(__dirname + '/index.html', function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.write('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
  socket.emit('login');

  socket.on('login', function (username) {
    socket.username = username;
    socket.emit('serverMessage', 'Currently logged in as ' + username);
    socket.broadcast.emit('serverMessage', 'User ' + username + ' Logged in');
  });

  socket.on('clientMessage', function (content) {
    socket.emit('serverMessage', 'You said: ' + content );
    socket.broadcast.emit('serverMessage', socket.username + ' said: '+ content);
  });

  socket.on('disconnect', function () {
    socket.broadcast.emit('serverMessage', 'User ' + socket.username + ' disconnected');
  });
});


server.listen(3000, function () {
  console.log('Server is listen on port 3000');
});
```

重启 Node 服务器，然后打开几个浏览器窗进入聊天应用程序进行测试。如果关闭其中一个窗口，其他窗口都会得到通知。

### 将用户分隔到不同聊天室

还可以提供几个聊天室让用户加入，即将聊天消息限制在加入聊天室的用户范围之内，可以通过记录哪个套接字在哪个聊天室来实现这个目标，但是还好，但是还好，Socket.IO 恰好支持这些功能。

但是，客户端首先必须允许用户加入一个聊天室，为此，浏览器命令行必须能够接受一些类似 iRC 协议中的命令，在 iRC 协议中，用户可以输入一条以字符 `/` 开头的命令，字符 `/` 紧接着一个动词和一些参数，下面是允许这种命令的客户端代码：

```html
```

在上面的代码中，`sendMessage` 函数用于用户输入，如果用户的输入和命令模式匹配，就会调用 `sendCommand` 函数，否则就向服务器发送条普通的文本消息。`senddMessage` 函数会对命令进行解析，并产生合适的服务器消息。在本例中只需要支持 `/j <room>`命令，该命令可以让用户加入给定的聊天室。

然后，服务器必须解释 `join` 命令，并让用户加入聊天室。在加入聊天室时，用户可能已经在另一个聊天室中，在这种情况下用户需要离开先前加入的聊天室。同样， 可以通过将聊天室名与套接字对象关联起来，以存储用户当前所处的聊天室。下面是修改后的服务器代码，修改后的代码可以进行上述处理。

```js
var server = require('http').createServer(handler);
var io = require('socket.io')(server);
var fs = require('fs');

function handler (req, res) {
  fs.readFile(__dirname + '/index.html', function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.write('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

function joinRoom (socket, room) {
  socket.join(room, function (err) {
    if (err) {
      throw err;
    }
    socket.room = room;
    socket.emit('serverMessage', 'joined room success!')
  });
  console.log(socket.rooms);
}

io.on('connection', function (socket) {
  socket.emit('login');

  socket.on('login', function (username) {
    socket.username = username;
    socket.emit('serverMessage', 'Currently logged in as ' + username);
    socket.broadcast.to(socket.room).emit('serverMessage', 'User ' + username + ' Logged in');
  });

  socket.on('clientMessage', function (content) {
    socket.emit('serverMessage', 'You said: ' + content );
    var broadcast = socket.broadcast;
    if (socket.room) {
      broadcast.to(socket.room);
    }
    broadcast.emit('serverMessage', socket.username + ' said: '+ content);
  });

  socket.on('disconnect', function () {
    socket.broadcast.to(socket.room).emit('serverMessage', 'User ' + socket.username + ' disconnected');
  });

  socket.on('join', function (room) {
    var currentRoom = socket.room;

    if (currentRoom) {
      socket.leave(currentRoom, function(err) {
        if (err) {
          throw err;
        }
        joinRoom(socket, room);
      });
    } else {
      joinRoom(socket, room);
    }
  })
});


server.listen(3000, function () {
  console.log('Server is listen on port 3000');
});
```

在上面的代码中，当收到一条消息时，服务器就会检查用户是否已经加入聊天室。 如果用户已经加入了聊天室，服务器就会通过 `broadcast.to(room)`来修改`broadcast` 对象，将广播范围限制在给定的聊天室中。如果检查到该用户还没有进入聊天室，他发送的消息就会在所有尚未进入聊天室的用户中间进行广播。

可以将所做的修改保存为客户端和服务器文件，然后重启 Node 服务器， 同时重新加载可能已经打开的聊天应用程序窗口。现在可以用类似 `/j chatroom1` 的命令来加入聊天室。

### 使用名称空间

上述这个简单的聊天应用程序也许是大型网站的一部分，如果该网站提供了几个使用 Socket.IO 的近实时交互程序，就要十分小心，同时要分离所有的服务器及客户端事件名，以免它们发生冲突。

幸运的是 Socket.IO 允许使用名称空间来分离服务器和客户端上不同的应用程序，首先必须在客户端上连接到个已被名称空间化的 Socket.IO URL:

```js
var socket = io('http://localhost:3000/chat');
``` 

然后，聊天服务器必须将套接字的范围限制为仅使用了该名称空间的套接字：

```js
var chat = io.of('/chat');

chat.on('connection', function (socket) {
  socket.on('clientMessage', function (content) {
    //...
  })
})
```

观在，可以轻松地使用相同的技术向客户端和服务器添加另一个应用程序，而不用担心事件名会发生冲突。

### 使用 Redis 分布运行服务器端应用程序

使用 Socket.IO 可以让所有用户采用一个 Node 进程进行连接。但是在实际的应用程序产品中，也许需要多个 Node 进程来为应用程序提供程序。为了冗余和/或负载分配，也许在负载均衡器后要有一个计算机群集来运行应用程序服务器。

> **[info] 注意**
>
> 如果在一组运行 Socket.IO 服务器的 Node.js 进程之前运行负载均衡器，需要使用的负载均衡器支持 Websockets。
>
> 如杲想基于 Node 的 Socket.IO 服务器，我推荐你考虑 [node-http-proxy 模块](https://github.com/nodejitsu/node-http-proxy)，该模块适应性很强，并且具有丰富的特性。

运行一组分布式进程的问题在于任意用户都可以在任意给定时刻连接到任意指定的  Node.js 进程，用户只能与连接到该服务器的其他用户进行通信，而连接到不同服务器的用户则无法访问。

幸好，Socket.IO 具有可插拔的存储器，默认情况下它使用本地进程内存，但是可以将其设置成符合给定协议的任意存储器，例如，一个主流的选择是采用 [Redis](http://www.redis.cn/) 数据库作为其存储器。

[Redis](http://www.redis.cn/) 是一个强大的内存「键-值」数据库，它具有一些先进的特性，其中之一就是支持「发布-订阅」，即客户端可以发布事件，而订阅者可以得到这些事件的通知。Socket.IO 也内置了对 Redis 存储器的支持，但是需要安装 redis 模块。

```bash
$ npm install redis
```

现在需要安装的只是 Redis 服务器本身。

> **[info] 注意**
>
> 如何安装 Redis 服务器超出了本书的范围，但是到[官方网站](http://www.redis.cn/)查阅相关文档就可以入门。

一旦安装并运行了 Redis 服务器，就可以准备配置 Socket.IO 服务器以便让其使用 Redis 存储器：

```js
var redis = require('redis'),
    RedisStore = reuire('socket.io/lib/stores/redis'),
    sub = redis.createClient(),
    pub = redis.createClient(),
    client = redis.createClient();

io.set('store', new RedisStore({
  redisPub: pub,
  redisSub: sub,
  redisClient: client
}));

```

即只要重启服务器就可以使用 Redis 了。如果需要安装多个服务器，那么 Redis 就会成为聊天消息的中心服务器，但是由于默认情况下 redis 模块是连接到本地主机上的，因此需要为 Redis 服务器配置服务器名：

```js
var redisPort = 6379;
var redisHostname = 'my.host.name';

var redis = require('redis'),
    RedisStore = reuire('socket.io/lib/stores/redis'),
    sub = redis.createClient(redisPort, redisHostname),
    pub = redis.createClient(redisPort, redisHostname),
    client = redis.createClient(redisPort, redisHostname);
```

如果将 my.host.name 替换为运行 Redis 的服务器主机名，下面的代码包含了完整的服务器代码。

```js
var server = require('http').createServer(handler);
var io = require('socket.io')(server);
var fs = require('fs');

var redisPort = 6379;
var redisHostname = 'localhost';

var redis = require('redis'),
    sub = redis.createClient(redisPort, redisHostname),
    pub = redis.createClient(redisPort, redisHostname),
    client = redis.createClient(redisPort, redisHostname);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html', function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.write('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

function joinRoom (socket, room) {
  socket.join(room, function (err) {
    if (err) {
      throw err;
    }
    socket.room = room;
    socket.emit('serverMessage', 'joined room success!');
    sub.subscribe(room);
    
  });
  console.log(socket.rooms);
}


var chat = io.of('/chat');


chat.on('connection', function (socket) {
  socket.emit('login');

  socket.on('login', function (username) {
    socket.username = username;
    socket.emit('serverMessage', 'Currently logged in as ' + username);
    socket.broadcast.to(socket.room).emit('serverMessage', 'User ' + username + ' Logged in');
  });

  socket.on('clientMessage', function (content) {
    socket.emit('serverMessage', 'You said: ' + content );
    pub.publish(socket.room, socket.username + ' said: '+ content);
  })

  socket.on('disconnect', function () {
    socket.broadcast.to(socket.room).emit('serverMessage', 'User ' + socket.username + ' disconnected');
  });

  socket.on('join', function (room) {
    var currentRoom = socket.room;

    if (currentRoom) {
      socket.leave(currentRoom, function(err) {
        if (err) {
          throw err;
        }
        joinRoom(socket, room);
      });
    } else {
      joinRoom(socket, room);
    }
  })
});


sub.on('subscribe', function (channel, count){
  console.log('subscribe: ' + channel);
});

sub.on('message', function (channel, message) {
  chat.to(channel).emit('serverMessage', message);
});



server.listen(3000, function () {
  console.log('Server is listen on port 3000');
});
```

重启服务器，加入房间即可聊天。

## 本章小结

Socket.IO 是一个优秀的跨浏览器解决方案，为浏览器和服务器之间提供了近实时的双向通信。

可以通过对所有连接起来的套接字进行广播来将若干客户端连接起来，此外，还可以让客户端加入和离开特定的聊天室，并且可以选择只对特定的聊天室进行广播。

通过使用名称空间，以让几个基于 Socket.IO 的应用在同一客户端和服务器应用程序中安全的共存。

此外，还可以通过使用 Redis 存储器，将一个 Socket.IO 应用程序分布到多个 Node.js 进程上运行，Redis 存储器采用 Redis 服务器作为通信中心。 
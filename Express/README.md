# 用 Express.js 创建 Web 应用程序

**本章提要：**

* 安装 Express

* 使用 Express 启动 Web 应用程序

* 定义 Express 中间件

* 显示 Jade 模板

* 定义 URL 路由监听器

* 创建路由中间件

对于一些语言和平台而言，可以用一些框架来简化创建基于 HTTP 的应用程序的工作，也许最知名框架的就是 Rails (针对Ruby语言），而不计其数的其他框架包括 Django、Sinatra 和 Cake。大多数框架的目标是简化和架构 HTML 应用程序的开发，以及解决一些一般性问题，比如将 HTTP 请求发送给正确的控制代码、提交静态资源、显示HTML模板。

在 Node 的世界里有一些模块和框架同样可以解决上述这些问题以及其他一些问题，其中一些是可以整合到一起的独立，而其他一些——像 Express.js —— 提供了一个可以快速实现的完整解决方案。

> **[info] 「编者注」：**
>
> Express 4 不再依赖 Connect，而且从内核中移除了除 express.static 外的所有内置中间件。也就是说现在的 Express 是一个独立的路由和中间件 Web 框架，Express 的版本升级不再受中间件更新的影响。

## 初始化 Express.js 应用程序

本节展示如何从头开始创建 Express 应用程序，但首先必须用 npm  全局安装 Express：

```bash
$ npm install express-generator -g
```

> **[info] 「编者注」：**
>
> 如果上述命令因为不具有足够的权限（取决于系统）而失败，也可以使用 sudo 来执行该命令，如下所示：
> ```
> $ sudo npm install express-generator -g
> ```
> 如果无法这样做，就尝试调整文件系统中的权限。

现在可以使用 express 二进制模块在本地初始化应用程序：

```bash
$ express my_app

warning: the default view engine will not be jade in future releases
  warning: use `--view=jade' or `--help' for additional options


   create : my_app
   create : my_app/package.json
   create : my_app/app.js
   create : my_app/public
   create : my_app/routes
   create : my_app/routes/index.js
   create : my_app/routes/users.js
   create : my_app/views
   create : my_app/views/index.jade
   create : my_app/views/layout.jade
   create : my_app/views/error.jade
   create : my_app/bin
   create : my_app/bin/www
   create : my_app/public/javascripts
   create : my_app/public/images
   create : my_app/public/stylesheets
   create : my_app/public/stylesheets/style.css

   install dependencies:
     $ cd my_app && npm install

   run the app:
     $ DEBUG=my-app:* npm start

```

Express 创建了一个目录 my_app，然后在其中创建了一组文件，可以在这组文件的基础上新建应用程序。进入 my_app 目录，并打开编辑器来分析一下 Express 到底创建了什么。

首先，有一个清单文件 package.json，它包含如下所示的一些内容：

```js
{
  "name": "my-app",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "node ./bin/www"
  },
  "dependencies": {
    "body-parser": "~1.18.2",
    "cookie-parser": "~1.4.3",
    "debug": "~2.6.9",
    "express": "~4.15.5",
    "jade": "~1.11.0",
    "morgan": "~1.9.0",
    "serve-favicon": "~2.4.5"
  }
}
```

这个清单文件的主要目的是包含模块依赖列表，NPM 可以根据这个列表来安装所依赖的模块，现在就让我们进行安装：

```bash
$ npm install
```

上面的代码会下载 package.json 文件 `dependencies` 下所记录的依赖模块，并将它们安装到 node_modules 目录中，可以看到 Express 依赖的模块中现已不包括 Connect 模块。

下一步浏览 Express 创建的 public 目录，可以看到该目录包含应用程序可能需要的静态文件目录，从某种程度上说，这些目录是标准目录，用来分割样式表，图像以及客户端 JS 文件的存储位置，但是可以随意修改这些目录：

```bash
$ ls

images      javascripts stylesheets
```

还可以看到 Express 创建了一个 app.js 文件，该文件包含一些针对服务器的初始化代码，如下所示：

```js
/**
 * 模块依赖
 */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// 视图引擎设置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// 在 /public 放置了 favicon 之后取消注释
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/', index);
app.use('/users', users);

// 捕获 404 并转发到错误处理程序
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// 错误处理程序
app.use(function(err, req, res, next) {
  // 设置 locals, 仅在开发环境提供 error
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 渲染错误页面
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

```

上面的代码导入了 express 模块，并使用其入口函数 express() 创建了一个 Express 应用。

这之后的代码是进行应用程序的一些设置，首先将 `views` 设置为模板文件的根，用来创建 HTLM 页面。然后将 `views engine` 设置为jade， jade 是一种 HTML 模板语言，可以执行希望模板语言所能执行的任务 —— 它允许显示 HTML 块、显示动态值、执行循环以及包含其他模板。可以查看一些简单的 Jade 模板，这些模板都位于 Express 刚才创建的 views 目录中。

在下一节中，读者将学习如何为应用程序定义中间件。

## 在应用程序中设置中间件

继续 app.js 文件中的代码，可以看到一些中间件被添加到应用程序中:

```js
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
```

使用 `app.use` 可以将中间件添加到堆栈中，这些中间件按照 `app.use` 的调用顺序执行。

## 路由请求

在定义 HTTP 服务器请求监听器或者中间件组件时，针对每个请求都会调用相应的代码段。但是，显然应用程序的不同部分需要触发不同的服务器行为。例如，GET  请求应该和 POST 请求区别处理，并且不同的 URL 也应该触发不同的响应。例如，如果想要创建的应用程序的某一部分显示用户简介，就希望下列方法和 URL 的组合具有不同的行为：

- GET/users —— 显示用户列表或者查询用户
- GET/users/:username —— 通常显示给定用户名的用户简介，如下一行所示。
- GET/users/:joe —— 显示用户名为 “joe” 的用户简介。
- POST/users —— 创建用户简介。
- PUT/users/:username —— 根据指定的用户名更新用户简介，如下一行所示。
- PUT/users/:joe —— 更新用户名为 “joe” 的用户简介。

上面的这个列表定义了路由表，路由表将 HTTP 方法和 URL 模式映射成行为，下一节展示了在 Express 中如何定义这些方法和模式。

### 处理路由

在 Express 创建的 app.js 文件中使用了两个路由：

```js
//...

var index = require('./routes/index');
var users = require('./routes/users');

//...

// 路由
app.use('/', index);
app.use('/users', users);
//...
```

上面的代码告诉应用程序，如果向 URL `/` 发送 GET 请求，就会调用 `index` 处理程序，在 app.js 中已经导入了这个 `index` 对象，并且在文件 `routes/index.js` 中对该对象进行了定义，可以对模型做一点改动来适应新的路由器。

修改文件 `routes/index.js` 如下所示：

```js
/**
 * GET 主页
 */

var express = require('express');
var router = express.Router();

/* GET 主页。 */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

```

然后在文件 `routes/users` 中定义新的路由器，如下所示：

```js
/**
 * 用户路由
 */

var express = require('express');
var router = express.Router();

/* 获取用户列表 */
router.get('/', function(req, res, next) {
  res.render('users/index', {title: 'User List'});
});

router.get('/:name', function (req, res, next) {
  res.render('users/profile', {title: 'User profile'});
});

module.exports = router;
```

> **[info] 注意**
>
> 上述设置路由器的模型将路由设置提交给每个路由组，这会避免文件 app.js 被路由弄得凌乱不堪。

上面的 `users.js` 文件中，我们定义了两个路由处理程序，第一个处理程序会在请求 GET 方法和 URL `/users` 时被激活，在本例中会显示模板 `users/index`，同时向模板传递一个标题，将这个标题作为模板的变量参数。

另一个路由处理程序是动态路由，它匹配的路由以 `/users/` 起始，并在其后紧跟着一个空字符串，这个字符串可为 `req.pramas.name` 中的路由处理程序所用。

在 Express 路由中，具有 `:` 前缀的字符串被当作占位符处理，除了 `/` 字符外，获得的值可以匹配任意字符串。

现在启动服务器：

```bash
$ DEBUG=myapp npm start
```

然后，可以将浏览器转向 http://localhost:3000，应该可以看到默认的索引视图。如果将浏览器转向 http://localhost:3000/test ，将会看到一跳错误信息，并且服务器的输出应该包含如下信息：

```
Not Found
404
Error: Not Found
    at /Users/WAHAHA/Projects/Node/express/chapter3/my_app/app.js:30:13
    at Layer.handle [as handle_request] (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:317:13)
    at /Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:284:7
    at Function.process_params (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:335:12)
    at next (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:275:10)
    at /Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:635:15
    at next (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:260:14)
    at Function.handle (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:174:3)
    at router (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:47:12)
```
这里因为没有与之对应的路由处理程序，所以抛出此错误，Express 用失败的 404 模板文件来帮助你。

现在将浏览器转向 http://localhost:3000/users ，将会看到显示一个错误消息，并且服务器的输出应该包含如下信息：

```
Error: Failed to lookup view "users/index" in views directory "/Users/WAHAHA/Projects/Node/express/chapter3/my_app/views"
    at Function.render (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/application.js:580:17)
    at ServerResponse.render (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/response.js:971:7)
    at /Users/WAHAHA/Projects/Node/express/chapter3/my_app/routes/users.js:6:7
    at Layer.handle [as handle_request] (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/layer.js:95:5)
    at next (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/route.js:137:13)
    at Route.dispatch (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/route.js:112:3)
    at Layer.handle [as handle_request] (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/layer.js:95:5)
    at /Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:281:22
    at Function.process_params (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:335:12)
    at next (/Users/WAHAHA/Projects/Node/express/chapter3/my_app/node_modules/express/lib/router/index.js:275:10)
```

现在必须在 `views/users/index.jade` 中创建模板文件，如下所示:

```jade
h1 Users
p Users list should be here
```

将文件保存并刷新页面之后，将会看到一个包含用户列表占位符的简单 HTML 页面，为了简化显示，现在要在 data/users.json 下创建一个模拟用户列表。创建项目根目录 data，然后创建一个包含相同内容的文件 users.json，如下所示：

```js
{
  "frank": {
  "username": "frank",
  "name": "Frank Sinatra",
  "bio": "Singer",
  "password": "123456"
  } ,
  "jobim": {
  "username": "jobim",
  "name": "Antonio Carlos Jobim ",
  "bio": "Composer",
  "password": "123456"
  } ,
  "fred": {
  "username": "fred" ,
  "name": "Fred",
  "bio": "Dancer and Actor",
  "password": "123456"
  }
}
```

现在可以完成用户路由器监听器，如下所示：

```js
/**
 * 用户路由
 */
```

上面的代码实现了所有基本的函数，这些函数用于列出用户、显示用户、创建用户和删除用户。让我们逐个仔细地看看每一块代码。

最开始，列表导入了用户的模拟数据库，它只是一个经过解析并载入内存的 JSON 结构。

```js
/* 获取用户列表 */
router.get('/', function(req, res, next) {
  res.render('users/index', {title: 'Users', users: users});
});
```

GET `/users` 路由器的监听器只是将用户 “数据库” 传入 `views/users/index.jade` 模板，现在需要修改这个模板来显示用户，如下所示：

```jade
h1 Users

p
  a(href='users/new') Create new profile

ul
  - for (var username in users) {
    li
      a(href='/users/' + encodeURIComponent(username))=users[username].name
  - };

```

这个列表迭代所有用户对象，针对每个用户显示一个列表项，每个列表项包含指向一个详细 URL 的链接。在这里可以看到 Jade 模板的一个示例，以及学习如何标记点缀代码。

现在重启服务器来测试新代码。

当将浏览器转向 http://localhost:3000/users 时，应该能看到用户列表显示出未。如果单击某个用户链接，就激活了如下所示的路由监听器：

```js
/* 获取指定用户 */
router.get('/:name', function (req, res, next) {
  var user = users[req.params.name];
  if (user) {
    res.render('users/profile', {title: 'User profile', user:user});
  } else {
    next();
  }
});
```

这个路由监听器用到了包含用户名的请求参数 param，它用这个参数来查找用户对象。如果找到一个用户，就被应用于模板`users/profile.jade`。如果没有找到用户，控制权就会返回给中间件引擎，本例中会显示 "Not found" 消息。

如果单击列表中的某个用户，将看到一个错误显示，告知 Express 无法找到模板 `users/profile`，必须先创建  `views/users/profile.jade`  这个模板，如下所示：

```jade
h1= user.name

h2 Bio
p= user.bio

form(action='/users/' + encodeURIComponent(user.username), method='POST')
  input(name='_method', type='hidden', value='DELETE')
  input(type='submit', value='Delete')
```

在第一个小节中会显示用户名和个人简介，然后提供了一个带有按钮的简单表单，可以用这个按钮将用户从数据库中删除。 还可以利用该方法重载中间件组件，传入一个请求主体参数 `_method`，该参数包含字符串 "DELETE"。

> **[info] 「编者注」：**
>
> 为何需要方法重载中间件？ profile.jade 的表单提交方法为何是 POST，不直接使用 DELETE?
>
> 目前 html 的表单只支持 GET 和 POST 方法。因此在使用 PUT 和 DELETE 时需要使用其他方法。常用的有 JS 或者 许多框架使用隐藏的 input 来修改。
>
> ```js
> <input type="hidden" name="_method" value="PUT">
> ```

因此，在这里我们首先要安装方法覆盖的中间件 `method-override`:

```bash
npm install method-override --save
```

然后在 app.js 引入并使用它:

```js
var methodOverride = require('method-override');

//...

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// 必须要放在 body 被解析之后
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // 在 POST 主体中查找 并 删除它
    var method = req.body._method
    delete req.body._method
    return method
  }
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

```
当方法重载中间件设置这个参数时，将请求方法从 POST 修改为 DELETE，这样就会激活如下所示的路由监听器：

```js
/* 删除指定用户 */
router.delete('/:name', function (req, res, next) {
  if (users[req.params.user]) {
    delete users[req.params.user];
    res.redirect('/users');
  } else {
    next();
  }
});
```

这个监听器会在数据库中查找用户，如果用户存在，监听器就将其从数据库中删除，并将请求重定向到用户列表。

通过单击链接 `Create new profile`， 还可以在用户列表中新建用户，这样会激活如下的路由监听器:

```js
/* 新用户注册页 */
router.get('/new', function (req, res, next) {
  res.render('users/new', {title: 'New User'});
});
```

这个监听器只是用于渲染模板 `views/users/new.jade`，需要创建该模板，如下所示：

```jade
h1 New User

form(method='POST', action='/users')
  p
    label(for='username') Username <br/>
    input#username(name='username')
  p
    label(for='name') Name <br/>
    input#name(name='name')
  p
    label(for='bio') Bio <br/>
    textarea#bio(name='bio')
  p
    input(type='submit', value='Create')
```

面这个模板包含一个简单的表单，用于创建用户，当创建 Create 按钮时，就会向 URL `/users` 发送一个请求，从而激活如下所示的路由监听器：

```js
/* 新用户注册 */
router.post('/', function (req, res) {
  if (users[req.params.name]) {
    res.send('Conflict', 409);
  } else {
    users[req.body.username] = req.body;
    res.redirect('/users')
  }
});
```

监听器函数的第一行检查用户是否已经存在于“数据库”中，如果存在，就会以 409 状态码做出响应，这是向客户端表示发生冲突，同时也会用 `res.send` 显示一个字符串 “Conflict”，这个字符串就是响应主体，而 `res.send` 是由 Express 提供的一个实用工具，允许用字符串进行响应，以及设置响应状态码。

如果没有冲突，就将用户存入“数据库”中，然后，用 `res.redirect` 实用函数将用户重定向到 URL `/users`。

> **[info] 「注意」：**
>
> 在这个例子中，将用户数据存储在内存中，但是在实际的应用程序中，显然想保留这些数据，这意味着要进行异步的 I/O 操作，如果有一个简单通用的键-值对存储模块来访问数据库，那么最后有关路由监听器的代码就应该如下所示：
>
> ```js
> router.post('/', function (req, res, next) {
>   db.get(req.body.username, function (err, user) {
>     if (err) {
>       return next(err);
>     }
>     if (user) {
>       res.send('Conflict', 409);
>     } else {
>       db.set(req.body.username, req.body, function (err){
>         if (err) {
>           return next(err);
>         }
>         res.redirect('/users');
>       });
>     }
>   });
> });


### 使用会话

现在已经有了一个基本的基于 HTTP 的用户管理应用程序（或者是某个应用程序的一部分），这个应用程序可以用多种方法改进。一种方法就是提供某种验证机制和会话管理，允许用户通过用户名和密码进行登录。

首先需要使用 npm 安装这个会话中间件：

```bash
$ npm install express-session --save
```

然后在 app.js 文件中设置它：

```js
var session = require('express-session');

// ...

```

在上面的代码中， 设置了一个带有加密字符串（可以修改）的 cookie 解析器中间件，因为就像前面介绍的那样，由于会话中间件需要用 cookie 来维护会话，所以它需要 cookie 解析器中间件。

此外，还设置了会话中间件，并定义了共享加密字符串和最长会话期，最长会话期定义了在没有用户的 HTTP 活动时，会话能够存在的最长时间。

然后需要创建个会话路由监听器，可以将其存入文件 `routes/session.js` 中，如下所示：

```js
/**
 * 会话路由
 */

var router = require('express').Router();
var users = require('../data/users');

router.get('/new', function (req, res) {
  res.render('session/new', {title: 'Log in'});
});

router.post('/', function (req, res) {
  console.log(users[req.body.username])
  console.log(users[req.body.username.password])
  if (users[req.body.username] &&
      users[req.body.username].password === req.body.password
  ) {
    req.session.user = users[req.body.username];
    res.redirect('/users');
  } else {
    res.redirect('/session/new')
  }
});

router.delete('/', function (req, res, next) {
  req.session.destroy();
  res.redirect('/users');
});

module.exports = router;

```


还需要在 app.js 引入 session 路由监听器:

```js
//...

var sessionRouter = require('./routes/session');

// ...

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

// 路由
app.use('/', index);
app.use('/users', users);
app.use('/session', sessionRouter);

//...
```

在上面的代码块中，我们可以看到这样一段代码：

```js
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});
```

这是针对视图中传入的传入局部变量的替代方法，不是显式地将参数插入每个 `res.render()`，而是定义一个动态辅助函数来求每个请求的值，结果就被用作一个局部变量。在上面的这段代码中，对外暴露了会话，它在稍后会为任意的视图模板所使用。

现在可以修改页面布局，并为其创建一个头，这个头会显示用户的登录状态。为此，要在 `views/session/user.jade` 下新建一个文件，如下所示：

```jade
- if (session &&  session.user) {

  p
    span Hello&nbsp
    span=session.username
    span !
  p
    form(method='POST', action='/session')
      input(type='hidden', name='_method', value='DELETE')
      input(type='submit', value='Log out')
- } else {

  p
    a(href='/session/new') Login
    span &nbsp;or&nbsp;
    a(href='/users/new') Register
- }
```

这部分代码会用两种模式进行显示：会话中有用户以及会话中没有用户。在第一种情况下，会显示一些用户数据和一个按钮来结束会话。在后一种情况下，会显示一个链接让用户登录。

现在需要将上面这部分代码包含进文件 `views/layout.jade`, 如下所示：

```jade
doctype html
html
  head
    title= title
    link(rel='stylesheet', href='/stylesheets/style.css')
  body
    header
      include session/user.jade
    section#main!=body
```

如果单击 “Login” 链接，就会激活如下所示路由：

```js
router.get('/new', function (req, res) {
  res.render('session/new', {title: 'Log in'});
});
```

这个路由只是显示模板文件 `views/session/new.jade`，这个模板文件是一个登录表单，如下所示：

```jade
h1 Log in
form(method='POST',action='/session')
  p
    label(for='username') User name: <br />
    input#username(name='username')
  p
    label(for='password') Password: <br />
    input#username(name='password')
  p
    input(type='submit', value='Log in')

```

这个表单会将数据提交给 URL `/session`， 从而激活如下所示的路由：

```js
router.post('/', function (req, res) {
  if (users[req.body.username] &&
      users[req.body.username].password === req.body.password
  ) {
    req.session.user = users[req.body.username];
    res.redirect('/users');
  } else {
    res.redirect('/session/new')
  }
});
```

上面这个路由监听器会根据模拟的用户数据库检查用户名和密码，如果匹配，就将用户对象存入会话，然后将用户重定向到 URL `/users`。

为了在用户登录成功时能在页头显示用户名和一个用于退出登录的按钮。需要修改一些东西：

1. 在 layout.jade 最下面添加一个用于继承的占位 `block content`
  ```jade
  doctype html
  html
    head
      title= title
      link(rel='stylesheet', href='/stylesheets/style.css')
    body
      header
        include session/user.jade
      section#main!=body
      block content
  ```

2. 然后修改 `users/inde.jade`如下：

  ```jade
  extends ../layout

  block content
    h1 Users

    p
      a(href='users/new') Create new profile

    ul
      - for (var username in users) {
        li
          a(href='/users/' + encodeURIComponent(username))=users[username].name
      - };

  ```

这个按钮会向 URL `/session` 发出一个 DELETE 请求（再次提醒，可以使用方法重载中间件），从而激活如下所示的路由：

```js
router.delete('/', function (req, res, next) {
  req.session.destroy();
  res.redirect('/users');
});
```

上面这个路由监听器只是销毁会话，并重定向到URL `/users`。


此外，还需要在签名表单(`views/users/new.jade`)中增加一个密码域，如下所示：

```jade
h1 New User

form(method='POST', action='/users')
  p
    label(for='username') Username <br/>
    input#username(name='username')
  p
    label(for='name') Name <br/>
    input#name(name='name')
  p
    label(for='password') Password <br/>
    input#password(type='password', name='password')
  p
    label(for='bio') Bio <br/>
    textarea#bio(name='bio')
  p
    input(type='submit', value='Create')

```

现在可以创建一个拥有密码的用户来进行登录和退出登录。

现在应该将用户访问重定向到一些路由，例如，用户应该只能在登录成功后才能创建其简介，它也只能删除自己的简介。为此，要用到一个新的中间件：路由中间件。

### 使用路由中间件

也许想基于会话信息限制某些行为，例如，要限制执行一些到成功登录的用户的路由，尤其要限制执行一些到具有内部简介特征的用户的路由（比如称为管理员）。

以让每个有关的路由监听器执行上述任务，但是这会导致重复的、不优雅的代码。另一种方法是在所选择的路由上定义要执行的路由中间件。

例如，如果想要针对没有登录的用户，将对数据的访问重定向到 GET /users/new、POST /users、GET /session/new、POST /session，可以创建如下所示的通用路由中间件，并将这个中间件存入文件 routes/middlewares/not_logged_in.js。如下所示：

```js
function notLoggedIn(req, res, next) {
  if (req.session.user) {
    res.send ('Unauthorized', 401);
  } else {
    next();
  }
}

module.exports = notLoggedIn;

```

上面的这个中间件时检查用户是否存在，如果在，就发送状态401 Unauthorized，如果不在，就处理下一个中间件。

然后可以将这个中间件导入文件 routes/session.js，并将其放置在文件的最上方，在每一个需要该中间件的路由中都要进行这种包含处理。如下所示：

```js
/**
 * 会话路由
 */

var router = require('express').Router();
var users = require('../data/users');
// 载入 中间件
var notLoggedIn = require('./middlewares/not_logged_in');

router.get('/new', notLoggedIn, function (req, res) {
  res.render('session/new', {title: 'Log in'});
});

// 使用
router.post('/', notLoggedIn, function (req, res) {
  if (users[req.body.username] &&
      users[req.body.username].password === req.body.password
  ) {
    req.session.user = users[req.body.username];
    res.redirect('/users');
  } else {
    res.redirect('/session/new')
  }
});

// 使用
router.delete('/', function (req, res, next) {
  req.session.destroy();
  console.log('11111111');
  res.redirect('/users');
});

module.exports = router;
```

在上面的例子中，将新的路由中间件回调函数放在了一个监听器之前，Express 会将路由中间件调用串联起来。

此外，还必须使用用户路由中的函数，如下所示：

```js
/**
 * 用户路由
 */

var express = require('express');
var router = express.Router();
var users = require('../data/users');
var notLoggedIn = require('./middlewares/not_logged_in');


/* 获取用户列表 */
router.get('/', function(req, res, next) {
  res.render('users/index', {title: 'Users', users: users});
});

/* 新用户注册页 */
router.get('/new', notLoggedIn, function (req, res, next) {
  res.render('users/new', {title: 'New User'});
});

/* 获取指定用户 */
router.get('/:name', function (req, res, next) {
  var user = users[req.params.name];
  if (user) {
    res.render('users/profile', {title: 'User profile', user:user});
  } else {
    next();
  }
});

/* 新用户注册 */
router.post('/', notLoggedIn, function (req, res) {
  if (users[req.params.name]) {
    res.send('Conflict', 409);
  } else {
    users[req.body.username] = req.body;
    res.redirect('/users');
  }
});

/* 删除指定用户 */
router.delete('/:name', function (req, res, next) {
  if (users[req.params.name]) {
    delete users[req.params.name];
    res.redirect('/users');
  } else {
    next();
  }
});

module.exports = router;

```

可以利用这种策略和机会删除一些加载用户的冗余代码，为此，要在routes/middleware/load_user.js 中新建一个路由中间件组件，这个路由中间件组件基于用户参数加载用户，如下所示：

```js
var users = require('../../data/users');

function loadUser (req, res, next) {
  var user = req.user = users[req.params.name];
  if (!user) {
    res.send('Not Find', 404);
  } else {
    next();
  }
}

module.exports = loadUser;
```

上面这个中间件将用户载入属性 `req.user`，使其可为下一个要执行的中间件所用。

现在要包含这个中间件，并重用文件 routes/users.js 中的一些冗余代码，如下所示：

```js
/**
 * 用户路由
 */

var express = require('express');
var router = express.Router();
var users = require('../data/users');
var notLoggedIn = require('./middlewares/not_logged_in');
var loadUser = require('./middlewares/load_user');

router.get('/', function(req, res, next) {
  res.render('users/index', {title: 'Users', users: users});
});

router.get('/new', notLoggedIn, function (req, res, next) {
  res.render('users/new', {title: 'New User'});
});

/* 删除冗余 */
router.get('/:name', loadUser, function (req, res, next) {
    res.render('users/profile', {title: 'User profile', user:req.user});
});

router.post('/', notLoggedIn, function (req, res) {
  if (users[req.params.name]) {
    res.send('Conflict', 409);
  } else {
    users[req.body.username] = req.body;
    res.redirect('/users');
  }
});

/* 删除冗余 */
router.delete('/:name', loadUser, function (req, res, next) {
  delete users[req.user.name];
  res.redirect('/users');
});

module.exports = router;

```

现在需要保护简历不被其他用户操纵，为此，需要新建一个中间件检查加载的用户是否与登录的用户相同，如 routes/middlewares/restrict_user_to_self.js 所示：

```js
function restrictUserToSelf (req, res, next) {
  if (! req.session.user || req.session.user.name !== req.user.username) {
    res.send('Unauthorized', 401);
  } else {
    next();
  }
}

module.exports = restrictUserToSelf;

```

现在可以可以导入这个新建的中间件，并将其放置在用户路由的上面：

```js
var rest豆ctUserToSelf =- require ('. /middleware/restrict -user -to -self'\·
```

并使用位于用户路由中间件最后的`delete` 监听器：

```js
/* 删除指定用户 */
router.delete('/:name', loadUser, restrictUserToSelf, function (req, res, next) {
  delete users[req.user.name];
  res.redirect('/users');
});
```

然后重启服务器，确认登录成功后只能删除自己的简介。

> **[info] 注意**
>
> 这个应用程序还需要进行大量改进才能保证其安全性，这些改进包对用户输入进行清理和验证、当产生动作时要反馈消息、当出现错误时显示更多友好的消息。
>
> 还应该使用持久化数据库来存储用户数据，这在本书的后面将会介绍。


## 本章小结

Express 是用来构建基于 HTML 的网站最流行的 Web 框架之一，它目前已独立于 Connect 框架和众多中间件库，变得更加纯粹，允许加载这些中间件完成丰富功能。

可以使用 Express 应用程序生成器开始项目并以此为起点，增加或者删除中间件组件，以及定义路由表。

路由用到了一个简单的针对方法和请求 URL 的模式－匹配表单，不应将所有路由都放置在主模块中，相反应该针对不同的功能集合使用单独的模块。

在 Express 中，路由的运行类似于全局中间件，在路由中，可以定义个监听某个特定路由的监听器函数堆栈，使用这个特征可以保证最终的路由监听器更为安全，并能减少其冗余度。
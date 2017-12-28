# 使用 Mongoose 连接 MongoDB 数据库

**本章提要**

* 安装和使用 Mongoose

* 定义模式和模型

* 理解 Mongoose 的数据类型

* 使用模式验证

* 查找、插入和更新文档

* 给查询结果标记分页

* 定义索引

* 应用取值器、赋值器和虚属性

* 引用记录

* 用高级方法丰富模型和文档对象

面向文档的数据库在最近几年重获流行，并处于 NoSQL 运动的前锋和中心。这种类型的数据库与关系型数据库不同，它不需要事先指定数据结构，相反你可以根据项目需要有组织地改变数据结构。与关系数据库的另一个重要的不同之处在于文档是原子单元，可以根据需要保证其完整性，因此不再需要跨表联合和事务。

[MongoDB](http://www.mongodb.org.cn/) 是一个很流行的面向文档的数据库，可以让你使用强大的查询语言执行动态查询。

在 MongoDB 中，数据被组织起来以便 MongoDB 能保持一组集合，每个集合中都有一组文档，每个文档又有一组字段。字段是一个键-值对，其中键是字符串，而值是一种基本类型（比如字符串、整数、 浮点数、时间戳、 二进制等等），或者是嵌入式文档，或者是任何数据类型的集合。

MongoDB 查询可以用 Javascript 文档描述，比如说有一个用户集合，想在其中查找所有名为 “John”、姓为 “Doe” 的用户，就可以使用如下查询语句：

```js
{name: {first: 'John', last: 'Doe'}}
```

还可以使用如下所示的查询语句查找所有姓为 “Doe” 的用户：

```js
{'name.last': 'Doe'}
```

还可以用正则表达式来替代静态值。例如，要查找所有姓以 “D” 开头的用户，可以使用：

```js
{'name.last': /^D/}
```

 这对数组值也同样有效，例如，如果在一个文章集合中查找那些关键词为 node.js 的文章，可以使用如下所示的查询语句：

 ```js
 {keywords: 'node.js'}
 ```

 还可以通过使用如下所示的查询语句，匹配至少有一个关键词与关键词集合相符的有关文章：

 ```js
 {keywords: {'in': ['node.js', 'javascript']}}
 ```

 有若干与此类似的操作符，可以在查询中使用这些操作符，以便查找所有字段 count 的值大于 10 并小于等于 100 的所有文档：

 ```js
 {count: {'$gt': 10, '&lte': 100}}
```

> **[info] 注意**
>
> 注意：本书并不打算让你精通安装和查询MongoDB, 这是其他图书的目标。
>
>如果还没有在系统中安装 MongoDB 并且希望安装它，请访问 [MongoDB 官网](https://www.mongodb.com/)。
>
> 另一个选择是利用 MongoDB 的外部服务，比如https://www.compose.com/  上

## 安装 Mongoose

在本章中，将创建访问 MongoDB 服务器的代码，为此，在 Node 中将会用到第三方模块 MongoDB, [Mongoose](https://github.com/Automattic/mongoose) 允许采用对象模型来访问 MongoDB。

在第21章“使用 Express.js 创建 Web 应用程序”中，用到了几个路由监听器来管理用户，这些路由监听器就是管理用户数据库的公共接口。这个数据库是一个伪内存对象，显然无法使其持久化，仅能使其适用于原型。但是，既然可以通过 Mongoose 来使用 MongoDB 数据库，就可以用一个真正的持久化数据访问层来代替伪内存对象。

让我们从将第21章中的应用程序代码复制到新的项目目录中开始，进入项目目录，使用 npm 安装 mongoose:

```bash
$ npm install mongoose --save
```

## 理解 Mongoose 如何使用模型封装对数据库的访问

Mongoose 是一个对数据库交互对象建模的尸一个数据库有多个集合，每个集合又有多个文档，同一集合中的两个文档不必具有相似的数据结构，但是如果说有一个“用户”集合，这个集合中包含用户记录，集合中的所有文档都是相似的。

你要在 Mongoose 中定义模式，每个模式都包含一个字段以及字段约束列表，所有字段都有类型以及由类型限定的约束，比如最小值、字段值能否为空、字段值是否在集合的所有文档中唯一、是否需要验证规则等等。

模型表示数据库到使用模式的集合的连接。

## 连接 MongoDB 数据库

首先，需要连接到 MongoDB服务器，无论这个服务器是在本地安装的还是在互联网上订阅的外部服务。为此，需要指定个指向MongoDB 数据库的 URL，如下所示：

```
mongodb://usernarne:password@hostname:port/database
```

如果是连接本地计算机上的 MongoDB，而服务器不需要密码，在这种情况下，只需要如下的 URL：

```
mongodb://localhost/database
```

然后，就可以用 Mongoose 连接数据，为此要向 app.js 中添加如下代码：

```js
// 由于我本身没有对 MongoDB 设置密码等等，因此使用 'mongodb://127.0.0.1:27017';
var dbURL = 'mongodb://127.0.0.1:27017';
var db = require('mongoose').connect(dbURL, function (err) {
  if (err) {
    return console.log('数据库连接失败');
  }
  console.log('数据库连接成功');
});
```

## 定义模式

现在，需要创建模式来定义用户文档的外观，可以用 data/schemas 目录来放置模式模块，在该目录中创建一个文件 user.js，如下所示：

```js
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  username: String,
  name: String,
  password: String
});

module.exports = userSchema;

```

在上面的代码中定义了基本的模式，这个模式有三个字段，这三个字段都是字符串类型。在本章的后面，将学习如何改进该模式，使其更有用，并且能够支持更复杂的文档。

## 定义模型

现在，需要定义一个模型，将用户集合映射到数据库中，同样可以将这个模型定义为文件 data/models/user.js 下的一个模块，如下所示：

```js
var mongoose = require('mongoose');
var userSchema = require('../schemas/user');

var User = mongoose.model('User', userSchema);

module.exports = User;

```

现在，要在路由监听器中使用该模型，但是，首先需要更新路由中间件，使其支持新的用户文档模型。首先，在routes/middleware/load_user.js中创建一个模块，该模块定义了一个加载用户的中间件，如下所示：

```js
var User = require('../../data/models/user');

function loadUser (req, res, next) {
  User.findOne({username: req.params.name}, function (err, user) {
    if (err) {
      return next(err);
    }
    if(!user) {
      res.send('Not Find', 404);
    } else {
      req.user = user;
      next();
    }
  });
}

module.exports = loadUser;
```

在上面的代码中，用到了用户模型对象中提供的，
[`findOne`](https://tuzhu008.github.io/gitbook-Node_cn/Library/mongoose/docs/API.html#query_findOne) 
方法，该方法的第一个参数是查询参数，在本例中该参数要和请求参数 `name` 严格匹配。第二个参数是一个回调函数，这个回调函数会在出现错误或者判断操作结束时被调用。如果出现了错误，就会转而调用下一个回调函数。如果在用户集合中没有发现匹配的用户，就会回应一个状态码 404 Not Found，并停止执行。如果找到了匹配的用户，就将其赋值给 `req.user` 属性以备路由监听器能在稍后使用。

现在可以修改用户的路由行为，如下所示：

```js
/**
 * 用户路由
 */

var express = require('express');
var router = express.Router();
// 引入模型
var User = require('../data/models/user');
var notLoggedIn = require('./middlewares/not_logged_in');
var loadUser = require('./middlewares/load_user');
var restrictUserToSelf = require('./middlewares/restrict_user_to_self');

router.get('/', function(req, res, next) {
    // 获取列表
  User.find({}, function(err, users) {
    if (err) {
      return next(err);
    }
    res.render('users/index', {title: 'Users', users: users})
  });
});

router.get('/new', notLoggedIn, function (req, res, next) {
  res.render('users/new', {title: 'New User'});
});

router.get('/:name', loadUser, function (req, res, next) {
    res.render('users/profile', {title: 'User profile', user:req.user});
});

router.post('/', notLoggedIn, function (req, res, next) {
    // 注册
  User.findOne({username: req.body.username}, function (err, user) {
    if (err) {
      return next(err);
    }
    if(user) {
      return res.send('Conflict', 409); 
    }
    User.create(req.body, function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/users');
    });
  })
});

router.delete('/:name', loadUser, restrictUserToSelf, function (req, res, next) {
  // 删除
  User.remove({username: req.user}, function (err) {
    if (err) {
      return next(err)    
    }
    res.redirect('/users');
  })
});

module.exports = router;

```

现在来逐个分析路由监听器上所做的修改，首先是针对列表中用户的路由监听器：

```js
router.get('/', function(req, res, next) {
  User.find({}, function(err, users) {
    if (err) {
      return next(err);
    }
    res.render('users/index', {title: 'Users', users: users})
  });
});
```

在上面的代码中，用到了模型中的 
[`find`](https://tuzhu008.github.io/gitbook-Node_cn/Library/mongoose/docs/API.html#model_find)
 方法，并向其传递一个空查询对象，
MongoDB应该查找每一个用户并返回他／她的信息，这里至少存在两个问题：首先是没有对结果进行排序，MongoDB 采用的是自然排序，而不是指定顺序，自然排序是指文档在内部存储的顺序，这很可能是用户所不希望的。 可以按照如下所示的方法对查询结果进行排序。

```js
User.find({}).sort({'name': 1}).exec(function (err, users) {
    if （err）{
        return next(err);
    }
    res.render('users/index', {title: 'Users', users: users})
})
```

在上面的代码中用到了查询链式 API, 在这个 API 中可以定义约束、指定排序顺序，然后再在单独的创建者方法调用中执行查询，在这里指定应该根据 `name` 属性对结果进行升序排序（因此值为 1），如果用 -1 替换 1，则对结果进行降序排序。

还可以根据其他字段进行排序，只要在执行查询之前将字段添加到查询对象中即可。比如说，如果想根据年龄进行降序排序，然后根据名称进行升序排序，则应使用如下的代码：

```js
 User
    .find({})
    .sort({'age': -1})
    .sort({'name': 1})
    .exec(function(err, users) { //..  });
```

监听器代码中存在的第二个问题是因为要求 MongoDB 取回集合中的所有对象，所以查询耗费的事件会随着用户集合的增长而增长。

用户界面列表需要分页，这意味着需要对用户列表进行切分，可以使用 skip 和 limit 选项只获取一页检索数据。

```js
router.get('/', function(req, res, next) {
  var page = req.query.page && parseInt(req.query.page, 10) || 0;
  User
    .find({})
    .skip(page * maxUsersPerPage)
    .limit(maxUsersPerPage)
    .sort({'age': -1})
    .sort({'name': 1})
    .exec(function(err, users) {
    if (err) {
      return next(err);
    }
    res.render('users/index', {title: 'Users', users: users, page: page})
  });
});
```

在上面的代码中，可以根据请求的 URL 中的查询字符串得到当前页面，如果没有查询字符串，就使用默认值 0。然后让 MongoDB 跳过最前面的 x 个元素——x是之前的页面上的用户数目之和——并且将结果限制为所希望的每个页面上的最多用户数。


> 注意，为了能让代码运行起来，需要在模块范围内定义 maxUserPerPage 配置变量，并让该变量的值符合你的需求：
> 
> ```js
> var maxUserPerPage = 5;
> ```

然后需要将当前页面传递给显示模板，以便让用户知道用户位于哪个页面，并可以创建页面链接 “前一页” 和 “后一页”。现在修改模板 views/users/index.jade

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

  if (page > 0)
    a(href='?page=' + (page - 1)) Previous
    &nbsp;

  a(href='?page=' + (page + 1)) Next

```

但是上面的代码仍然存在一个问题——下一页不存在用户时仍然会显示 “下一页” 页面链接，为了修正这个问题，要统计集合中所有用户的数据，并指出还剩下多少页，可以在routes/users.js 中的路由监听器中完成这个修改：

```js
router.get('/', function(req, res, next) {
  var page = req.query.page && parseInt(req.query.page, 10) || 0;
  User.count(function (err, count) {
    if (err) {
      return next(err);
    }
    var lastPage = (page + 1) * maxUsersPerPage >= count;
    User
      .find({})
      .skip(page * maxUsersPerPage)
      .limit(maxUsersPerPage)
      .sort({'age': -1})
      .sort({'name': 1})
      .exec(function(err, users) {
      if (err) {
        return next(err);
      }
      res.render('users/index', {
        title: 'Users',
        users: users,
        page: page,
        lastPage: lastPage
      });
    });
  });
});
```

在上面的代码中，通过模型的 
[`count`](https://tuzhu008.github.io/gitbook-Node_cn/Library/mongoose/docs/API.html#model_count)
 方法来请求文档的数目，一旦这个操作结束，就要判断是否还有剩余的页面，然后将判断结果传递到木板中。

需要修改用户索引视图模板，如下所示：

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

  if (page > 0)
    a(href='?page=' + (page - 1)) Previous
    &nbsp;
  //-添加判断
  if (!lastPage)
    a(href='?page=' + (page + 1)) Next
    &nbsp;
```

在路由监听器代码中，还要避免一种情况——没有理由理由让两个查询（计数和获得用户）串行执行，而应该让它们并行执行，从而减少响应用户请求的耗费事件。

> **[info] 注意**
>
> 使用 Node.js 众多优势之一是能够轻松地创建并行 I/O 请求，好好利用这一点！

为此，可以利用在第 19 章中学习的 [async 模块]()，首先需要将该模块添加到清单 packge.json 中，如下所示:

```js
npm install async --save
```

准备导入该模块并在路由监听器中使用它，将该模块的导入放在 routes/users.js 的最上面。

```js
var async = require('async');
```

现在可以用 async.parallel 来并行化请求，如下所示：

```js
/* 获取用户列表 */
router.get('/', function(req, res, next) {
  var page = req.query.page && parseInt(req.query.page, 10) || 0;
  async.parallel([
    function(callback) {
      User.count(callback)
    },
    function(callback) {
      User
      .find({})
      .skip(page * maxUsersPerPage)
      .limit(maxUsersPerPage)
      .sort({'age': -1})
      .sort({'name': 1})
      .exec(callback);
    }
  ], function (err, results) {
    if (err) {
      return next(err);
    }
    var count = results[0];
    var users = results[1];

    var lastPage = (page + 1) * maxUsersPerPage >= count;
    
    res.render('users/index', {
      title: 'Users',
      users: users,
      page: page,
      lastPage: lastPage
    });
  });
});
``` 

最后一个回调函数(`async.parallel` 的最后一个参数）会在两个查询都完成时或者发生错误时被调用，同时能获得一个数组，数组中的元素是各个查询的结果。如果没有发生错误，那么数组的第一个元素包含的是用户数目，第二个元素包含的用户列表。

下面来看一看用户路由监听器：

```js
/* 新用户注册 */
router.post('/', notLoggedIn, function (req, res, next) {
  User.findOne({username: req.body.username}, function (err, user) {
    if (err) {
      return next(err);
    }
    if(user) {
      return res.send('Conflict', 409); 
    }
    User.create(req.body, function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/users');
    });
  })
});
```

在上面的代码中，检查了用户名是否被占用，如果没有被占用，就在用户模型上用 
[`create()` ](https://tuzhu008.github.io/gitbook-Node_cn/Library/mongoose/docs/API.html#model_create)
方法创建用户，这段代码中至少存在一个问题——另外一个请求可能会在检查给定的用户名是否存在与数据库实际创建用户的时间点之间用相同的用户名创建用户，这样就可能会导致具有相同用户名的多个用户被插入到数据库，这种情况不允许发生，因为你是基于用户名来查找用户的。

要避免该问题，就要向用户名模式添加一个选项，声明 `username` 字段的唯一性，如下所示：

```js
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  // 重新定义username
  username: {
    type: String,
    unique: true
  },
  name: String,
  password: String
});

module.exports = userSchema;

```

采用该选项时，Mongoose 会确保在 `username` 字段上的唯一的索引，现在可以删除检查用户名是否存在的代码，只需要依赖 MongoDB 返回文件 routes/users.js 中的错误：

```js
router.post('/', notLoggedIn, function (req, res, next) {
  User.create(req.body, function (err) {
    if (err){
      if (err.code === 11000) {
        res.send('Conflict', 409)
      } else {
        return next(err);
      }
      return;
    }
    res.redirect('/users');
  });
});
```

当 MongoDB 输出错误时，Mongoose 会捕获错误码，并将其传入错误对象，在上面的代码中对错误码做出了解释，当错误码表示键值重复错误时，就会显示 409 Conflict HTTP 状态码。

> **[info] 注意**
>
> 在 Mongodb 网站上可以查找到有关 MongoDB 错误代码的更多信息。

为了能让登录起作用，必须将登录过程整合到 Mongoose 当中，为此，要修改文件 routes/session.js，如下所示：

```js
/**
 * 会话路由
 */

var router = require('express').Router();
var User = require('../data/models/user');
var notLoggedIn = require('./middlewares/not_logged_in');

router.get('/new', notLoggedIn, function (req, res) {
  res.render('session/new', {title: 'Log in'});
});

router.post('/', notLoggedIn, function (req, res, next) {
  User.findOne({
    username: req.body.username,
    password: req.body.password
  }, function (err, user) {
    if (err) {
      return next(err);
    }
    if (user) {
      req.session.user = user;
      res.redirect('/users');
    } else {
      res.redirect('/session/new')
    }
  })
});

router.delete('/', function (req, res, next) {
  req.session.destroy();
  res.redirect('/users');
});

module.exports = router;

```

既然用户路由可以和 MongoDB 协调工作了，就可以继续完善用户模式来整合验证器、文档嵌套等等。

### 使用验证器

当用户在网站上注册新的用户账号时，他们可以在输入域中输入任意数据——Mongoose没有验证机制。但是，可以将约束引入用户模式。例如，可以在 data/schemas/user.js 中引入一个新的字段  `email`，要求必须与一个正则表达式匹配，如下所示：

```js
h1 New User

form(method='POST', action='/users')
  p
    label(for='username') Username <br/>
    input#username(name='username')
  p
    label(for='name') Name <br/>
    input#name(name='name')
  p
    label(for='email') email <br/>
    input#email(name='email')
  p
    label(for='password') Password <br/>
    input#password(type='password', name='password')
  p
    label(for='bio') Bio <br/>
    textarea#bio(name='bio')
  p
    input(type='submit', value='Create')

```

现在可以重启服务器，测试网络应用程序。

```bash
DEBUG=myapp npm start
```

将浏览器转向 http://localhost:3000/users , 尝试分别用正确和错误的电子邮件地址创建用户简介。将会看到错误验证会触发一个回调函数，该回调函数有一个错误队形参数。在出现验证错误时，如果希望将 Mongoose 错误信息打印出来，可以如下所示:

mongoose 抛出的错误信息往往包括但不限于这些选项：

```js
{_message: 'User validation failed'
    name: 'ValidatorError',
    errors:
    {email: 
        {message: 'Path `email` is invalid (111).',
        name: 'ValidatorError',
        path: 'email',
        kind: 'regexp'}}}
```

可以对这种类型的错误进行测试，并在文件 routes/users.js 处理该错误：

```js
/* 新用户注册 */
router.post('/', notLoggedIn, function (req, res, next) {
  User.create(req.body, function (err) {
    if (err){
      if (err.code === 11000) {
        res.send('Conflict', 409)
      } else { // 处理错误
        if (err.name === 'ValidationError') {
          return res.send(Object.keys(err.errors).map(function (errorField) {
            return err.errors[errorField].message;
          }).join('. '), 406)
        } else {
          return next(err);
        }
      }
      return;
    }
    res.redirect('/users');
  });
});
```

上面的代码会向用户显示一条简陋的消息，但是可以轻松的完善代码，以便显示适合的上下文信息。

还可以枚举某个字段的允许值，例如，如果想在 gender 字段中存储用户的性别，可以对用户模式进行修改，如下所示：

```js
var mongoose = require('mongoose');

var emailRegExp = /.+\@.+\..+/;

var userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  name: String,
  password: String,
  email: {
    type: String,
    required: true,
    match: emailRegExp
  },
  // gender 字段
  gender: {
    type: String,
    required: true,
    upperCase: true,
    enum: ['M', 'F']
  }
});

module.exports = userSchema;
```

在上面的代码中，规定 `gender` 字段的值是一个字符串，字符串必须为 `M` 或 `F`。同时要求在验证 `gender` 之前将其转为大写，但是小写的 `m` 或 `f` 也同样有效。

为测试所做的修改，需要重启服务器，并向用户创建表单添加 `gender` 输入域，如下所示：

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
    label(for='email') email <br/>
    input#email(name='email')
  //- 增加 gender 字段
  p
    label(for="gender") gender <br/>
    select#gender(name='gender')
      option(value='M') male
      option(value='F') female
  p
    label(for='password') Password <br/>
    input#password(type='password', name='password')
  p
    label(for='bio') Bio <br/>
    textarea#bio(name='bio')
  p
    input(type='submit', value='Create')
```

除了枚举可能值或者提供正则表达式之外，还可以提供一个普通函数来验证字段。例如，由于某种原因，也许你想将生日添加到用户简介中，验证用户是否已满18岁。

首先，因为 JavaScript 是以毫秒形式存储日期的，所以要将18岁转换成毫秒，应该在 data/schemas/user.js 中的用户模块开头进行这种转换：

```js
var TIMESPAN_YEAR = 31536000000;
var TIMESPAN_18_YEARS= 18 * TIMESPAN_YEAR;
```

然后，要提供一个验证函数，这个验证函数同样也要放在 data/schemas/user.js 中用户模式的开头：

```js
function validate_18_years_old_or_more (date) {
  return (Date.now() - date.getTime()) > TIMESPAN_18_YEARS;
}
```

这个函数有一个日期参数并返回一个布尔值，该布尔值表明是否大于 18 岁，下面是对模式进行的必要修改：

```js
var mongoose = require('mongoose');

var emailRegExp = /.+\@.+\..+/;

var TIMESPAN_YEAR = 31536000000;
var TIMESPAN_18_YEARS= 18 * TIMESPAN_YEAR;

function validate_18_years_old_or_more (date) {
  return (Date.now() - date.getTime()) > TIMESPAN_18_YEARS;
}

var userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  name: String,
  password: String,
  email: {
    type: String,
    required: true,
    match: emailRegExp
  },
  gender: {
    type: String,
    required: true,
    upperCase: true,
    enum: ['M', 'F']
  },
  // birthday 字段
  birthday: {
    type: Date,
    validate: [
      validate_18_years_old_or_more,
      'You must be 18 years old or more'
    ]
  }
});

module.exports = userSchema;
```

注意，在验证字段选项中传递一个包含两个元素的数组——验证器函数和消息。通过这种方法可以指定自定义的消息，用自定义消息改写由 Mongoose 自动生成的消息。

为了进行测试，必须重启服务器并向模板 /views/users/new.jade 添加一个日期输入域，如下所示：

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
    label(for='email') email <br/>
    input#email(name='email')
  p
    label(for="gender") gender <br/>
    select#gender(name='gender')
      option(value='M') male
      option(value='F') female
  //- 添加 birtday 输入框
  p
    label(for='birthday') birthday <br/>
    input#birthday(name='birthday')
  p
    label(for='password') Password <br/>
    input#password(type='password', name='password')
  p
    label(for='bio') Bio <br/>
    textarea#bio(name='bio')
  p
    input(type='submit', value='Create')

```

> **[info] 注意**
> 
> Mongoose 接受任何与 Date.parse() 兼容的日期格式，这意味着它可以接收 RF2822 格式 和 ISO 8601 格式。也就是说可以用很多可选格式引入日期，但是为了简化测试，可以采用通用格式 YYYY/MM/DD

如果验证函数需要进行一些 I/O 操作的话，还可以指定异步验证器。例如，你也许想通过与外部服务器进行交互，来进行某种类型的验证。为简单起见，要添加一个包含 Twitter 句柄的字段，并且只需使用 Twitter API 来验证该句柄是否存在。

为此，只要向 Twitter 上的用户页面发送 HTTP 请求，然后再观察响应的 HTTP 状态。如果响应状态是 404 Not Found，可以断定这个 Twitter 句柄是无效的。

为了简化 HTTP 请求的创建过程，可以使用 Mikeal Rogers 的第三方模块 [request](https://tuzhu008.github.io/gitbook-Node_cn/Library/request/) (在第 13 章中有介绍)，首先需要安装该模块：

```bash
npm install request --save
```

然后在 data/schema/user.js 的上方引入该模块:

```js
var mongoose = require('request');
```

然后在同一个文件中定义一个验证函数，这个验证函数有一个值参数和一个回调函数参数，当有来自 Twitter 的响应到达时，就会用一个布尔值进行回调：

```js
function twitterHandleExists(handle, done) {
  request('http://twitter.com/' + encodeURIComponent(handle), function (err, res) {
    if (err) {
      console.error(err);
      return done(false);
    }
    if (res.statusCode > 299) {
      done(false);
    } else {
      done(true);
    }
  });
}
```

在上面的代码中，对用户 URL twitter.com 进行了一次 HTTP 调用，如果出现错误或者 HTTP 的状态码不是 2xx OK，就足以断定字段是无效的。在上面的代码中用到了异步验证器，用一个布尔值调用回调函数，并根据回调函数的返回值判断字段是否有效。

### 使用修改器

有时需要在验证和保存之前修改字段值。例如，性别字段有一个修改器 `uppercase`，该修改器用来在输入验证和保存步骤之前将字符串转换为大写。

对于符串类型的字段而言，可以使用 `uppercase` 修改器、`lowercase` 修改器以及 `trim` 修改器。`trim` 修改器会使用 `string.trim()` 方法删除字符串中头部和尾部的空格。还可以通过定义一个转换和返回值的函数来使用自定义的修改器。例如，用户可以用也可以不用 ＠ 作为'Twitter' 句柄的前缀：

```js
twitter: {
    type: String,
    validate: [twitterHandleExists, 'Please provide a valid twitter handle'],
    set: function(handle) {
      if (!handle) {
        return;
      }
      handle = handle.trim();
      if(handle.indexOf('@') === 0) {
        handle = handle.substring(1);
      }
      return handle;
    }
  }
```

在上面的代码中，首先对句柄进行修改裁剪（如果用户没有这样做），如果句柄的第一个字符是 ＠，将该字符删除。通过这种方法，用户既可以输入@mytwitterhandle，也可以输入 mytwitterhandle, 两者都会被映射为 mytwitterhandle。

### 使用取值器

通过定义取值器，可以在 MongoDB 向 Mongoose 提交数据之后但在对象可用之前过滤对象，从而决定哪些对象可被存入数据库。 通过提供一个自定义函数， 可以使用取值器对值进行过滤，或者将其转换为想要的形式。这在有些时候也许很有用，例如在执行数据迁移时。

假如允许用户存储以 ＠ 作为前缀 Twitter 的句柄，之后决定用一个赋值器将这些句柄过滤出去。在用户集合中有几个以 ＠ 作为前缀的 Twitter 句柄，其余 Twitter 句柄则没有这个前缀。可以进行一次完整的数据迁移，虽然根据用户集合的规模，这可能要耗费很长一段时间，并对服务的性能产生影响。还可以通过修改视图代码，允许这两种不同的变化，从而学习容忍这种不一致性，但是这可能会使数据过滤代码在应用程序中的位置不正确。

可以按照如下所示的方式定义过滤函数，并将其放置在 data/schema/user.js 的最上面：

```js
function filterTwitterHandle (handle) {
  if (!handle) {
    return;
  }
  handle = handle.trim();
  if(handle.indexOf('@') === 0) {
    handle = handle.substring(1);
  }
  return handle;
}
```

这个过滤函数既可用作 twitter 字段的赋值器，也可用作其取值器，如下所示：

```js
var userSchema = mongoose.Schema({
  // 重新定义username
  username: {
    type: String,
    unique: true
  },
  name: String,
  password: String,
  email: {
    type: String,
    required: true,
    match: emailRegExp
  },
  gender: {
    type: String,
    required: true,
    upperCase: true,
    enum: ['M', 'F']
  },
  birthday: {
    type: Date,
    validate: [
      validate_18_years_old_or_more,
      'You must be 18 years old or more'
    ]
  },
  twitter: {
    type: String,
    validate: [twitterHandleExists, 'Please provide a valid twitter handle'],
    set: filterTwitterHandle,
    get: filterTwitterHandle
});
```

### 使用虚拟属性

还可以使用一些不再文档中出现，而是由 Mongoose 在加载文档时动态计算出来的属性。例如，前端代码必须基于 Twitter URL 字符串，但 Twitter URL 是用户的一个属性，就本其身而言应该属于用户文档。然而，由于该属性可以基于 Twitter 句柄很容易地被计算出来，所以可以创建一个 virtual 属性。在 data/schema/user.js 中的用户模式模块之前，紧接着该模块添加如下所示的代码，就可以创建 virtual 属性。

```js
//..
userSchema
  .virtual('twitter_url')
  .get(function () {
    if (this.twitter) {
      return 'http://twitter.com/' + encodeURIComponent(this.twitter);
    }
  });
```

> **[info] 注意**
>
> 虚拟属性不会被存入文档

现在可以修改用户简介视图模板以使用所有的新属性，在 views/users/profile.jade 中使用虚拟属性的新版用户简介模板：

```jade

```

还可以为虚拟属性定义赋值器，例如，也许你想在文档中分割用户的名和姓，但是需要在用户界面中保留姓名作为单个的输入域。此时可以重定义文件data/schemas/user.js 中的用户模式部分，如下所示：

```js
```

在上面的代码中，采用一个内嵌对象定义了一个包含 `name` 字段的用户文档，这个嵌入式对象既包含名又包含姓。然后规定任何一个文档都有一个虚拟属性 `full_name`，它的值是名和姓通过空格连接起来的结果。该属性同样可被赋值，在赋值器中进行的是相反的操作，即将全名分割成名和姓。

现在需要对 views/users/new.jade 视图模板进行少许修改，将 `name` 修改为 `full_name`，如下所示：

```jade
h1 New User

form(method='POST', action='/users')
  p
    label(for='username') Username <br/>
    input#username(name='username')
  //- 修改name 输入框
  p
    label(for='full_name') Full Name (first and last) <br/>
    input#full_name(name='full_name')
  p
    label(for='email') email <br/>
    input#email(name='email')
  p
    label(for="gender") gender <br/>
    select#gender(name='gender')
      option(value='M') male
      option(value='F') female
  p
    label(for='birthday') birthday <br/>
    input#birthday(name='birthday')
  p
    label(for='password') Password <br/>
    input#password(type='password', name='password')
  //- 新增 twitter
  p
    label(for='twitter') Twitter Handle <br/>
    input#twitter(name='twitter')
  p
    label(for='bio') Bio <br/>
    textarea#bio(name='bio')
  p
    input(type='submit', value='Create')


```

要在 views/users/profile.jade 用户简介视图模板中进行同样的修改，如下所示：

```jade
h1= user.full_name

h2 Bio
p= user.bio

h2 Email
p= user.email

h2 Gender
p= user.gender

h2 Birthday
p=user.birthday

if user.twitter
  h2 Twitter
  p
    a(href='user.twitter_url')='@' + user.twitter

form(action='/users/' + encodeURIComponent(user.username), method='POST')
  input(name='_method', type='hidden', value='DELETE')
  input(type='submit', value='Delete')
```

还需要更新 views/users/index.jade 中的用户列表模板，在这个模板中抓住机会将 `for` 循环转换成 `each` 迭代，如下所示：

```jade
extends ../layout

block content
  h1 Users

  p
    a(href='users/new') Create new profile

  ul
    each user in users
      li
        a(href='/users/' + encodeURIComponet(user.username))=user.full_name
  if (page > 0)
    a(href='?page=' + (page - 1)) Previous
    &nbsp;
  //-添加判断
  if (!lastPage)
    a(href='?page=' + (page + 1)) Next
    &nbsp;
```

此外，还需要修改用户登录时在页面顶端显示用户名的试图部分，即要将文件 views/session/user.jade 修改为：

```jade
- if (session &&  session.user) {
  
  p
    span Hello&nbsp
    span=session.user.name.first
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

也许你还拥有之前的文档，在这些文档中，`name` 字段仍旧是字符串值，而不是一个嵌入式的 `name` 文档。这样的文档不具有 `name.firt` 属性或者 `name.last` 属性。相反 `name` 属性包含一个表示全面的字符串。

为了解决这种不一致性，需要进行三处修改。首先，需要在文件 data/schemas/user.js 中声明 `name` 字段是一个混合类型。这样 Mongoose 就允许 `name` 字段可以被赋值为字符串，也可以被赋值为一个对象（实际上可以是任何值）。

```js
var userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  // 修改 name 的类型
  name: mongoose.Schema.Types.Mixed,
  password: String,
  email: {
    type: String,
    required: true,
    match: emailRegExp
  },
  gender: {
    type: String,
    required: true,
    upperCase: true,
    enum: ['M', 'F']
  },
  birthday: {
    type: Date,
    validate: [
      validate_18_years_old_or_more,
      'You must be 18 years old or more'
    ]
  },
  twitter: {
    type: String,
    validate: [twitterHandleExists, 'Please provide a valid twitter handle'],
    set: filterTwitterHandle,
    get: filterTwitterHandle
  }
});
```

另外，还需要修改 `full_name` 虚拟函数的取值器函数，使得原有文档中的 `name` 字段仍然可以是字符串。在这种情况下，只要让取值器函数返回字符串即可：

```js
userSchema
  .virtual('full_name')
  .get(function () {
    if(typeof this.name === 'string') {
      return this.name;
    }
    return [this.name.first, this.name.last].join(' ');
  })
  .set(function (fullName) {
    var nameComponents = fullName.split(' ');
    this.name = {
      last:nameComponents.pop(),
      firt: nameComponents.join(' ')
    }
  });
```

还需要修改 `full_name` 虚拟属性的赋值器，以便在给该属性赋值时可以创建内嵌的 `name` 文档。之所以要这样做，是因为现在 `Mongoose` 没有假定一个前提——在前面的例子中 Mongoose 知道内嵌文档必定存在，所以才能预先将内嵌文档对象赋值给 `name` 属性。既然还没有定义这种对象类型， 就只能亲力而为了。

现在按下 `Ctrl+C `键重启应用程序并重新启动 Node:

```bash
DEBUG=myapp npm start
```

现在可以刷新最初的 URL(http://localhost:3000/users), 尝试创建和显示用户的名，同时查看数据库的相应内容。

> **[info] 注意**
> 
> 上文中对 twitter 字段的异步验证函数现已无法获取从服务器获取信息。在测试中，请将 URL 地址改到其他，本人亲测知乎的很好用


### 使用默认值

也许你想跟踪用户记录创建的日期和时间，此时可以插入一个日期类型的 `create_at` 字段，该字段必须能够自动赋值——你不希望用户提交甚至修改该字段的值。可以将 `create_at` 字段插入到用户创建路由监听器上的用户文档中，但是对于代码而言这并不是合适的插入位置。如果想在应用程序中别的地方创建用户，就必须再次执行插入操作，这样会导致重复代码，有可能还会造成一些不一致性。

正确的位置是文件 data/schemas/user.js 中的用户模式，这需要进行一些修改：

```js
var userSchema = mongoose.Schema({
  // 重新定义username
  username: {
    type: String,
    unique: true
  },
  name: mongoose.Schema.Types.Mixed,
  password: String,
  email: {
    type: String,
    required: true,
    match: emailRegExp
  },
  gender: {
    type: String,
    required: true,
    upperCase: true,
    enum: ['M', 'F']
  },
  birthday: {
    type: Date,
    validate: [
      validate_18_years_old_or_more,
      'You must be 18 years old or more'
    ]
  },
  twitter: {
    type: String,
    validate: [twitterHandleExists, 'Please provide a valid twitter handle'],
    set: filterTwitterHandle,
    get: filterTwitterHandle
  },
  // 新增
  meta: {
    create_at: {
      type: Date,
      default: Date.now
    },
    update_at: {
      type: Date,
      default: Date.now
    }
  }
});
```

在上面的代码中，`meta.created_at` 和 `meta.updated_at` 字段在默认情况下被赋值为当前时间戳（在保存之前会被转换成合适的日期值）。

但是上述方法存在一个问题：如果用户提交的表单修改了 `meta.created_at` 记录，修改后的值会被存入文档中，而且会覆盖初始值，但是我们并不希望初始值发生改变。 为了不改变该值，需要在保存文档之前删除 `meta.created_at` 和 `meta.updated_at` 的值，并插入默认值。为此，在模块导出之前，需要将如下所示的一段代码添加到文件 data/schemas/user.js 的末尾：

```js
UserSchema.pre('save', function (next) {
  if (this.isNew) {
    this.meta.update_at = undefined;
  }
  this.meta.create_at = undefined;
  next();
});
```

用户模式会在保存或删除对象的前后发射事件。本例中添加了一个监听器，该监听器会在保存对象之前被调用，监听器函数中的关键字 `this` 是指当前文档。

通过观察 `isNew` 属性，还可以确定文档是否是首次被保存。本例只是想在创建文档对象时删除 `meta.create_at` 的值。

> **[info] 注意**
>
> 如果在更新文档对象时用户用某种方法成功改写了 `meta.created_at` 值，上面的代码仍旧起不了什么作用。为了避免这种情况，可以创建一个属性 setter, 这个属性不允许 `meta.created_at` 的值发生任何改变：
> 
> ```js
> meta: {
>     create_at: {
>       type: Date,
>       default: Date.now,
>       set: function (value) {
>           return undefined;
>       }
>     },
>     update_at: {
>       type: Date,
>       default: Date.now
>     }
>   }
> ```

### 定义索引

与一些其他的面向文档的数据库不同，MongoDB 可以让你执行一些特殊的查询，在这些查询中，数据库会创建一个计划来执行查询，并尝试对查询进行优化。为了加速查询需要创建索引。既可以在单个字段上创建索引，也可以结合两个或者多个字段创建符合索引。

索引可以是唯一的，也可以不是。在用户模式中，用户名有一个选项 [`unique`](https://tuzhu008.github.io/gitbook-Node_cn/Library/mongoose/docs/SchemaTypes.html#indexes) 被设置为 `true`，这就是告诉 Mongoose, 在查询执行之前，必须保证已经为用户名字段创建了一个唯一索引。恰好在用户的用户名属性上已经有了一个唯一性索引：

```js
//...
  username: {
    type: String,
    unique: true
  },
//...
```

正如前面所讨论的那样，唯一性索引确保所有文档中的用户名字段值都不相同。

此外，索引既可以是稀疏的，也可以不是。如果在某个字段上定义了索引，普通索引会包含一个针对所有文档的入口：这些文档既可包含该字段，也可以不包含该字段。但是，如果将字段上的 [`sparse` 选项](https://tuzhu008.github.io/gitbook-Node_cn/Library/mongoose/docs/SchemaTypes.html#indexes)设置为 `true` , Mongoose 只能保证创建的索引只包含那些具有指定字段的文档。

使用稀疏索引会对利用对应字段的查询结果造成影响。 例如，如果在用户模式的 Twitter 句柄上定义稀疏索引，然后根据 Twitter 句柄进行查询， 并对查询结果进行排序，那么查询结果只会包含那些定义了 Twitter 句柄的文档。试着修改 data/schemas/user.js 中的用户模式模块，将 `sparse` 属性设置为 `true`: 

```js
//...
twitter: {
    type: String,
    sparse: true,
    validate: [twitterHandleExists, 'Please provide a valid twitter handle'],
    set: filterTwitterHandle,
    get: filterTwitterHandle
  },
//...
```

执行如下所示的查询，只会获得包含 twitter 字段的文档：

```js
User.find({}).sort({'twitter': 1}, callback)
```

可以结合稀疏索引和唯一性索引来创建唯一性约束，唯一性约束会忽略那些缺少对应字段的文档。 例如，如果希望 `email` 字段是唯一的，但不强制要求文档中必须有该字段，可以通过设置文档 data/schemas.user.js 中用户模式内的下列属性，为其创建一个稀疏的唯一性索引：

```js
  email: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    match: emailRegExp
  },
```

在模块导出之前，如果通过将下面的代码插入到文件，data/schemas/user.js 的结尾处，还可以在模式层面定义结合了两个或多个字段值的索引：

```js
UserSchema.index({username: 1, 'meta.create_at': -1});
```

上面的代码创建了一个结合了 `usemame` 和 `meta.created_at` 值的索引，其中，用户名按照升序编制索引，而 `meta.created_at` 按照降序编制索引。当采用这两个字段进行过滤或排序的查询操作时，这个索引会加快查询速度。


> **[info] 注意**
>
> 如果现在尝试重启应用程序，也许会遇到下面的问题：
>
> 若果在数据库中的多个用户具有相同的 e-mail 地址，就会出现该问题。要顺利启动应用程序，必须修改复制次序。


### 使用 DB Refs 引用其他文档

在 Mongoose 中，文档可能还包含指向其他文档的引用。例如，可能想要有一个文章集合，除了其他字段之外，它还有一个作者字段，作者可能是一个用户。此时，可以规定作者字段的值是一个对象 ID，而不是用户名。在 data/schemas/article.js 下定义如下模式：

```js
var mongoose = require('mongoose');

var ArticleSchema = mongoose.Schema({
  title: {
    type: String,
    unique: true
  },
  body: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  create_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = ArticleSchema;
```

在上面的代码中，定义了一个简单的文章模式，该模式包含一个作者字段，类型为 `Schema.ObjectId`，并引用了 `User` 模型。

在文件 data/models/artical.js 下定义模型，如下所示：

```js
var mongoose = require('mongoose');
var AticleSchema = require('../schemas/article');

var Article = mongoose.model('Article', AticleSchema);

module.exports = Article;
```

现在，需要在文件 routes/articles.js 中创建一组简单的监听器，以响应路径 /articles 下的 URL，如下：

```js
/*
 * 文章路由
 */

var router = require('express').Router();
var async = require('async');

var Article =  require('../data/models/article');
var noteLoggedIn = require('./middlewares/not_logged_in');
var loadArticle = require('./middlewares/load_article');
var loggedIn = require('./middlewares/logged_in');

var maxArticlesPerPage = 5;

router.get('/', function (req, res, next) {
  var page = req.query.page && parseInt(req.query.page, 10) || 0;
  async.parallel([
    function (next) {
      Article.count(next);
    },
    function (next) {
      Article
        .find()
        .sort({'title': 1})
        .skip(page * maxArticlesPerPage)
        .limit(maxArticlesPerPage)
        .exec(next)
    }
  ], function (err, results) {
    if (err) {
      return next(err);
    }

    var count = results[0];
    var articles = results[1];

    var lastPage = (page + 1) * maxArticlesPerPage > count;

    res.render('articles/index', {
      title: 'Article',
      articles: articles,
      page: page,
      lastPage: lastPage
    });
  });
})

router.get('/new', loggedIn, function (req, res) {
  res.render('articles/new', {title: 'New Article'});
});

router.get('/search', function (req, res, next) {
  console.log('search for', req.query.q);
  Article.search(req.query.q, function (err, articles) {
    if (err) {
      return next(err);
    }
    res.render('articles/index', {
      title: 'Article search results',
      articles: articles,
      page: 0,
      lastPage: true
    });
  });
});

router.get('/:title', loadArticle, function (req, res, next) {
  res.render('articles/article', {title: req.article.title, article: req.article});
});

router.post('/', loggedIn, function (req, res, next) {
  var article = req.body;
  article.author = req.session.user._id;
  Article.create(article, function (err) {
    if (err) {
      if (err.code === 11000) {
        res.send('Conflict', 409);
      } else {
        if (err.name === 'ValidationError') {
          return res.send(Object.keys(err.errors).map(function (errField) {
            return err.errors[errField].message;
          }).join('. '), 406);
        } else {
          next(err);
        }
      }
      return;
    }
    res.redirect('/articles');
  });
});

router.delete('/:title', loggedIn, loadArticle, function (req, res, next) {
  req.article.remove(function (err) {
    if (err) {
        return next(err);
    }
    res.redirect('/articles');
  });
});

module.exports = router;

```

上述的代码主要用于创建、移除、更新和删除应用程序（除了为简单起见，没有提供更新方法），所以这些路由监听器在某种程度上与 `User` 中的路由监听器类似，但有一点除外，即在新建文章时，会根据如下代码，将作者的用户 ID 赋值给 `author`。

```js
article.author = req.session.user._id;
```

> **[info] 注意**
>
> 在 MongoDB 中，每个对象在创建之后都有一个 `_id` 字段，该字段包含对象在集合中的唯一 ID，与一些数据库不同， `_id` 字段不是连续的数字，而是随机字符串。

这些路由监听器用到了两个新的路由中间件——loggedIn 和 loadArticle，后者会加载在 routes/midllewares/load_article.js 下创建的文章，如下所示：

```js
var Article = require('../../data/models/article');

function loadArticle (req, res, next) {
  Article
    .findOne({title: req.params.title})
    .populate('author')
    .exec(function (err, article) {
      if (err) {
        return next(err);
      }
      if (!article) {
        res.send('Not Found', 404);
      }
      req.article = article;
      next();
    });
}

module.exports = loadArticle;

```

上面这个新的路由中间件组件与 load_user.js 中的路由中间件组件非常相似，但有一点除外，即它会使用如下代码，让 Mongoose 加载作者：

```js
 .findOne({title: req.params.title})
 .populate('author') 
```

以上代码使得用户对象可用于属性 `article.author`，这样一来就可以在 views/articles/article.jade 下的文章模板中使用该对象，如下所示：

```jade
h1= article.title

div!=article.body

hr

p
  span Author:
  &nbsp;
  a(href='/users/' + encodeURIComponent(article.author.username))=article.author.full_name

p
  a(href='/articles') Back to all articles

```

此外，还必须在 routes/middlewares/logged_in.js下添加 loggedIn 中间件组件，如下所示：

```js
function loggedIn (req, res, next) {
  if (!req.session.user) {
    res.send('Forbidden. Please log in first.', 403);
  } else {
    next();
  }
}

module.exports = loggedIn;
```

为了让上述代码起作用，还要向 app.js 添加路由监听器，如下所示：

```js
app.use('/', index);
app.use('/users', users);
app.use('/session', sessionRouter);
// 新增文章监听器
app.use('/articles', sessionRouter);
```

此外，还需要两个新的视图模板：

* views/articles/index.jade 包含文章列表

    ```jade
    h1 Article

    p
    a(href='/articles/new') Create new article

    ul
    each article in articles
        li
        a(href='/articles/' + encodeURIComponent(article.title))=article.title

    if page > 0
    a(href='?page=' + (page -1)) Previous
    &nbsp;

    if !lastPage
    a(href='?page=' + (page + 1)) Next

    ```
* views/articles/new.jade 包含文章创建

    ```jade
    h1 New Article

    form(method="POST", action='/articles')
    p
        label(for='title') Title <br/>
        input#title(name='title')
    p
        label(for='body') Body <br/>
        input#body(name='body')
    p
        input#body(type='submit' value='Create')
    
    ```

### 定义实例方法

现在，也许你想列出某个指定用户最近的一些文章。为此，可以在用户路由监听器中直接新建查询，但用户路由监听器并不是完成这项任务的合适场所。另一种方法在文件 data/schemas/user.js 末尾的模块导出之前，将一个方法附加到用户模式中，从而创建一个实例方法，如下所示：

```js
UserSchema.methods.recentArticles = function (callback) {
  return this.model('Article')
    .find({author: this._id})
    .sort({'create_at': 1})
    .limit(5)
    .exec(callback);
}
```

现在可以用上述实例方法获得某个指定用户最近 5 篇文章的列表。修改文件 routes/users.js 中的路由监听器 GET '/users/:name'，以便获得该用户最新的文章，并列出它们：

```js
router.get('/:name', loadUser, function (req, res, next) {
  req.user.recentArticles(function (err, articles) {
    if (err) {
      return next(err);
    }
    res.render('users/profile', {
      title: 'User profile',
      user:req.user,
      recentArticles: articles
    });
  });
});
```

现在需要修改模板 views/users/profile.jade，将如下所示的一小段代码添加到末尾：

```jade
h1= user.full_name

h2 Bio
p= user.bio

h2 Email
p= user.email

h2 Gender
p= user.gender

h2 Birthday
p=user.birthday

if user.twitter
  h2 Twitter
  p
    a(href='user.twitter_url')='@' + user.twitter

form(action='/users/' + encodeURIComponent(user.username), method='POST')
  input(name='_method', type='hidden', value='DELETE')
  input(type='submit', value='Delete')

h2 Recent Article
//- 导入 list.jade，设置变量，导入的 list.jade 可以访问该变量
-var articles=recentArticles
include ../articles/list
```

述代码用到了必须创建的部分模板 views/articles/list.jade，如下所示：

```jade
ul
  each article in articles
    li
      a(href='/articles/' + encodeURIComponent(article.title))=article.title

```

由于经决定让这个部分模板显示列表，因此可以用对这个部分模板的调用来替换模板 views/articls/inedx.jade 的显示列表，如下所示：

```jade
h1 Article

p
  a(href='/articles/new') Create new article

//-list.jade 可以访问该作用域的 articles 变量
include list.jade

if page > 0
  a(href='?page=' + (page -1)) Previous
  &nbsp;

if !lastPage
  a(href='?page=' + (page + 1)) Next

```

现在是测试文章创建和显示的好时机，重启应用程序并转向 http://localhost:3000/articles ，尝试登录、创建文章并浏览。


### 定义静态方法

还可以在模型上对外暴露方法，提供更高级的操作或者查询。例如，也许你想提供一个查找函数，它能返回标题或者正文中包含某个字符串的文章，为此，可以在 data/schemas/article.js 中的模块导出之前，在文章模式模块的末尾定义该函数。

```js
ArticleSchema.statics.search = function (str, callback) {
  var regexp = new RegExp(str, 'i');
  return this.find({'$or': [{title: regexp}, {body: regexp}]}, callback);
}
```

现在可以在 routes/articles.js 文件中创建一个路由监听器来暴露该功能：

```js
router.get('/search', function (req, res, next) {
  console.log('search for', req.query.q);
  Article.search(req.query.q, function (err, articles) {
    if (err) {
      return next(err);
    }
    res.render('articles/index', {
      title: 'Article search results',
      articles: articles,
      page: 0,
      lastPage: true
    });
  });
});
```

可以重启服务器、登录、创建些文章，并尝试使用类似 http://localhost:3000/articles/search?q=something 的URL 来测试上述代码，其中 `somestring` 可以用某篇文章或者正文的一部分代替。


## 本章小结

Mongoose 是个数据库访问库，允许将对象映射成 MongoD B数据库中的集合和文档。虽然面向文档的数据库允许非结构化数据，但是 Monogoose 需要为每个集合定义一个模式，在模式中指定数据类型、索引、默认值、多种验证函数以及其他操作。

然后就可以在集合模型中使用这些模式，这些模式提供了查找、插入和修改文档的方法。此外，还可以在已有方法的基础上，定义新的方法，以丰富集合模型和返回文档对象。

此外，还可以使用 
[Schema.ObjectId 类型](https://tuzhu008.github.io/gitbook-Node_cn/Library/mongoose/docs/SchemaTypes.html#objectids)，
并定义目标集合，以便在一个文档中引用位于相同或者不同集合中的其他文档。
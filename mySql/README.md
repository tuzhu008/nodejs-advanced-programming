# 使用 node-mysql 连接 MySql 数据库

**本章提要**

* 从 Node 中连接 MySQL 数据库

* 借助 Node 的异步和非阻塞风格与数据库交换数据

* 避免安全和性能陷阱

与在其他很多编程环境中一样，迟早都要持久化应用程序产生的某些类型的数据，对于多用户的服务器－客户端应用程序更是如此，在这类应用程序中，一个用户提供的信息需要在稍后提交给另外一个或者多个用户。

虽然与在其他环境中一样，在 Node 中将数据存入普通文件中或者内存中能够运行得很好，但是当需要对大量数据进行结构化访问时，上述方法就不具备可伸缩性。

类似 MySQL 这样的关系数据库，通过将数据存储在硬盘上并用标准的 SQL 语言访问数据，为以结构化的方式存储和获取信息提供了可靠快速的解决方案。

如果 Node 应用程序需要能跟 MySQL 数据库通信并与其交换数据，下面几节有关使用 github 的 [mysql 库](https://github.com/mysqljs/mysql)，从MySQL数据库中高效读取数据以及以安全的方式传递数据的内容能够让你完成这些任务。

## 应用库与 MySQL 数据库进行连接和通信

因为安装和设置 MySQL 数据库并不在本书的学习范围之内，所以假设在本地主机或者其他可访问的主机上已经有一个正在运行的 MySQL 实例。

要能够连接到数据库，必须用如下所示的命令在本地目录中安装 mysql 包：

```bash
$ npm install mysql
```

一旦安装完整，你就可以编写一个简单的应用程序来连接服务器，如下所示：

```js
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost', // 数据库所在主机名
  user     : 'root',  // mysql 账号
  password : '123456', // mysql 密码
});

connection.connect();

connection.query('SELECT "Hello World!"', function (error, results, fields) {
  if (error) throw error;
  console.log(results);
  console.log(fields);
});

connection.end();

```

在存储和运行这个程序清单之前，需要修改第3行、第4行和第5行，为访问 MySQL 服务器指定主机和身份凭证。如果 mysql 模块是以本地模式安装的，那么连接 MySQL 服务器时就不需要任何身份凭证，此时可以从 `createConnection` 函数的参数选项中删除用户和密码字段。

然后可以将上述代码保存为文件 hello_world.js 并运行它：

```
[ RowDataPacket { 'Hello World!': 'Hello World!' } ]
[ FieldPacket {
    catalog: 'def',
    db: '',
    table: '',
    orgTable: '',
    name: 'Hello World!',
    orgName: '',
    charsetNr: 33,
    length: 36,
    type: 253,
    flags: 1,
    decimals: 31,
    default: undefined,
    zeroFill: false,
    protocol41: true } ]
```

甚至通过这个基本的示例，都能看到典型的异步回调流程如何再次被用来使得数据库请求非阻塞化。在处理数据库请求时这一点尤其重要，因为这取决于查询结果和结果集合的大小，数据库请求有点慢，所以如果采用同步处理方式会导致应用程序的响应性存在风险隐患。在之后的章节中，你将学习一种更为有效的从数据库获取结果的方法。

当使用 `mysql.createConnection()` 函数连接数据库时，可以提供以下一组选项：

* host: 要连接的服务器的 IP 地址或者域名，如果忽略的话默认是 localhost。
* port: 要连接的 TCP 端口，如果忽略的话默认是 3306。
* user: 服务器用来进行身份验证的用户名，如果忽略的话是root。
* password: 服务器用来进行身份验证的密码，如果忽略的话，则尝试无密码的连接。
* database: 成功连接上所使用的数据库，如果忽略的话就没有选择数据库，那么就必须用 `SELECT` 数据库查询语句选择一个数据库。
* debug: 如果将该参数设置为 `true` 的话，mysql 模块就会 将所有的输入和输出的数据包打印到控制台上，默认是 `false`。
* flags: MySQL 连接协议支持几个影响底层连接握手细节的标志位，例如使用的协议版本、是否采用压缩等等。因为 mysql 模块中的这些标志位具有合理的默认，所以，除非服务器是以非标准的方式配置的，否则就不必设置这些标志位。 在[这里]()可以看到可用标志位的列表。

你还没有查询真正的数据，为此需要创建一个带一张数据表的数据库，然后向数据表中添加数据行：

```js
connection.query('CREATE DATABASE node', function (err) {
  if (err) {
    throw err;
    connection.end();
  }
  console.log('datbase is created.')
});
```

上面的代码展示了错误如何触发回调函数，在本例中，如果触发了错误，就会关闭服务器的连接。可以通过多次运行该脚本来触发一个错误实例。数据库在代码第一次运行之后就已经存在了，所以它不能再次被创建，因而第二次查询会失败。


## 想数据添加数据时请记住安全性

现在创建一张数据表，并向其中插入两行数据：

```js
connection.query('USE node');

connection.query('CREATE TABLE test' + 
                '(id INT(11) AUTO_INCREMENT,' +
                'content VARCHAR(255),' +
                'PRIMARY KEY(id))'
);

connection.query('INSERT test (content) VALUES ("Hello")');
connection.query('INSERT test (content) VALUES ("World")');

connection.end();
```

上面的代码会运行得很好，但是存在一个问题，如果查询不是用这种方式创建的，而又没有对查询所使用的数据值进行直接的控制(也许时因为 content 的值是用户通过网页表单输入提供的)， 应用程序就容易遭受 SQL 注入攻击。恶意用户会向应用程序提交数据，如果在这些数据不经过过滤就传递给数据库，就会破坏想要执行的 SQL 语句，并允许攻击者执行任意可能造成危害的语句。

下面是执行 SQL 注入的示例：

```js
connection.query('USE node');

var userInput = '"); DELETE FROM test WHERE id = 1; -- ';

connection.query('INSERT INTO test (content) VALUES ("' + userInput + '")');

connection.end();
```

要看出实际发生什么有些复杂，但是它确实发生。

编写上述代码的目的是提供一个由用户输入的文本字符串来查询 content 字段的值，当然，实际的用户只能被模拟，但是可以假定 userInput 的值是来自于某个 HTTP 表单中的输入域。

在这个例子中，攻击者并不提供简单的文本字符串，而代之以用结尾处的引号和括号来提前结束查询语句，然后开始执行自定义查询，删除 id 为 1 的数据行。由于原来查询的第二部分——结尾的引号和括号，将导致无效的 SQL，所以攻击者在前面加上了两个破折号作为前缀，结果这两个破折号之后的语句都被当作是注释而被忽略。

因此，服务器接收到的完整语句是：

```sql
INSERT INTO test (content) VALUES (""); DELETE FROM test WHERE id = 1; --")
```

> **[info] [注意]**
>
> 注意，在当前版本的 mysql 库中多语句查询是禁用的，因此想要尝试上面的代码，请在创建连接时加上下面的选项：
> ```js
> var connection = mysql.createConnection({multipleStatements: true});
> ```
这将导致会向表中插入新的一行，而 id 为 1 的那一行数据则会被删除。

你能够也应该在几个层次上保护应用程序免受这种类型的攻击，要做的最重要的事就是总是将传入的数据当作是潜在有害的，尽早拒绝任何不能匹配 “无害” 严格定义的数据。

在应用程序中，有一个额外的预防措施，来保护由外部数据组成的数据库查询部分免受攻击。通过可赋值的占位符，就可以保证查询中任何应该被视为值的部分确实被数据库解释为值，而绝不会被解释成其他东西，例如DELETE命令。

占位符能够起到这一作用，是因为不再将自定义命令与用户输入连接到一起组成最终的的 SQL 语句（这样做会允许攻击者破坏 SQL 语句的结构），这样一来，所编写语句只包含计划之中的命令，而不包含任何值。占位符只表示值的位置，而值本身是单独提供的，数据库将两者结合起来形成可执行的语句。

这样，查询就不会被当作一个整体处理，而是变得语义丰富——数据库知道查询的哪一部分被当做值处理，而哪一部分仅仅就是值本身。看下面一个例子，缺少这种语义就会允许攻击者执行一条命令，而不是输入一个值。

下面可以发布—条包含占位符和值替换的语句：

```js
connection.query('USE node');

var userInput = '"); DELETE FROM test WHERE id = 1; -- ';

connection.query('INSERT INTO test (content) VALUES (?)', [userInput]);

connection.end();
```

虽然用户的输入仍旧是恶意的，但是它再也不会对数据库造成危害， 因为服务器知道 userInput 中的任何内容都应被视为 content 字段的值，所以查询不是以删除 id 为 1 的数据行结束，而是以插入一个新数据行结束，新数据行的 content 字段值为 `'"); DELETE FROM test WHERE id = 1; -- '`。

尽管也许不是你所希望的内容，但是这阻止了攻击行为。

要在 mysql 中进行赋值，就需要编写带引号的 SQL 语句，其中引号是可赋值的占位符，此外还要提供一个值数组来按顺序替换每个占位符。只要按照键值从低到高的顺序遍历值数组，就可以在多个占位符和值之间进行匹配。因此，下面的语句会导致写入相同的数据。

```js
var data = [100, 'the content'];

connection.query('INSERT INTO test (id, content) VALUES (?, ?)', data);
```

这等同于：

```js
var data = [];
data[1] = 'the content';
data [0] = '100';

connection.query('INSERT INTO test (id, content) VALUES (?, ?)', data);

```

有时，在插入或者更新数据行时，需要获取某些信息，比如最后插入记录的 ID 或者查询影响的数据行数目，mysql 将这类信息提交给一个可选的回调函数：

```js
connection.query('INSERT INTO test (content) VALUES (?)', ['the content'], function (err, info) {
    if (err) {
        return handle_err(err);
    }
    console.log(info);
});

connection.query('UPDATE test SET content = ?', ['new content'], function (err, info) {
    if (err) {
        return handle_err(err);
    }
    console.log(info.affectedRows);
});
```

可以看到，像往常一样，上面代码中的回调函数所提供的第一个参数包含一个错误对象，以便处理出现的错误。如果没有出现错误，那么第二个参数包含一个对象，即查询的结果，如果向数据表中插入一个自动增长字段，那么该对象将包含一个 insertId 属性，该属性即自动增长字段的值。如果查询执行的是删除、更新或者移除数据行，那么 `affectedRows` 属性就包含受影响的数据行数。

> **[info]**
> 
> 回调函数接收到的第二个参数包含如下属性:
> ```
> OkPacket {
>   fieldCount: 0,
>   affectedRows: 1,
>   insertId: 13,
>   serverStatus: 2,
>   warningCount: 0,
>   message: '',
>   protocol41: true,
>   changedRows: 0 }
> ```

## 高效读取数据

还可以用占位符从数据库中读取数据，mysql 模块用两种不同的方式提供结果集，其中，向查询调用提供回调函数是最简单的：

```js
query = connection.query('SELECT id, content FROM test WHERE id IN (?, ?)', [1, 100], function (err, results, fields) {
    if (err) {
        throw err;
    }
    console.log(results);
});
```

如下所示的输出就是查询结果：

```
[ RowDataPacket { id: 1, content: 'new content' },
  RowDataPacket { id: 10, content: 'new content' } ]
```

如你所见，在上面的代码中一口气接收了所有数据行，并将其当作 个对象数组，当查询返回大的结果集合时，这样就可能产生问题， 因为 Node.js 必须在内存中缓存整个结果集合。

为了避免这个问题，可以通过应用 mysql 模块的数据流 API 逐行处理结果集合。

当使用 `connection.query` 函数向服务器发送一个查询时，会返回个 Query 对象，它会发射一些事件：error，field，row，end，可以监听这些事件。

可以利用这些事件，如下所示：

```js
var query = connection.query('SELECT id, content FROM test WHERE id IN (?, ?)', [1, 10]);

function processRow (row, callback) {
  // 其他带有 I/O 的操作
  console.log('Receive row:');
  console.log(row);
  callback();
}

query
  .on('error', function (err) {
    throw err;
})
  .on('fields', function (field) {
    console.log('Received filed:');
    console.log(field);
})
  .on('result', function (row) {

    connection.pause();

    processRow(row, function () {
      connection.resume();
    });
    
})
  .on('end', function () {
    console.log('Finished retrieving resulst');
});

```


上述代码的运行结果如下：

```
 decimals: 0,
    default: undefined,
    zeroFill: false,
    protocol41: true },
  FieldPacket {
    catalog: 'def',
    db: 'node',
    table: 'test',
    orgTable: 'test',
    name: 'content',
    orgName: 'content',
    charsetNr: 33,
    length: 765,
    type: 253,
    flags: 0,
    decimals: 0,
    default: undefined,
    zeroFill: false,
    protocol41: true } ]
Receive row:
RowDataPacket { id: 1, content: 'new content' }
Receive row:
RowDataPacket { id: 10, content: 'new content' }
Finished retrieving resulst
```

>**[danger] 与当前版本不符合**
>
> 为什么要将 result 参数传递给 end 事件的回调函数？只有在查询不会返任何结果，并且包含 MySQL OK 数据包的内容时，result 参数才会被传递。

在现在的版本中，`end` 事件的回调不会接收到任何的参数。上述的不返回任何结果的查询（如 `INSERT`）现在会返回 OK 数据包，这个 OK 数据包也在  `result` 事件中作为参数传递给回调。 

学习了流式查询 API 以及用占位符创建查询之后，就可以将前述内容组合到一起，形成一个完整的应用程序，如下所示：

```js
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123456'
});

connection.connect();

connection.query('DROP DATABASE IF EXISTS node');
connection.query('CREATE DATABASE node');
connection.query('USE node');

connection.query('CREATE TABLE test' + 
                '(id INT(11) AUTO_INCREMENT,' +
                'content VARCHAR(255),' +
                'PRIMARY KEY(id))'
);

for (var i = 0; i < 10000; i++) {
  connection.query('INSERT test (content) VALUES (?)', ['content for row' + (i + 1)]);
}

connection.query('UPDATE test SET content = ? WHERE id >= ?', ['new content', 9000], function (err, info) {
    if (err) {
        return handle_err(err);
    }
    console.log('Changed content of ' + info.affectedRows + ' rows');
});

function processRow (row, callback) {
  // 其他带有 I/O 的操作
  console.log('Content of row #' + row.id + 'is: "' + row.content +'"');
  callback();
}

var query = connection.query('SELECT id, content FROM test WHERE id >= ? AND id <= ?', [8990,9010]);

query
  .on('error', function (err) {
    throw err;
})
  .on('fields', function (field) {
    console.log('Received filed:');
    console.log(field);
})
  .on('result', function (row) {

    connection.pause();

    processRow(row, function () {
      connection.resume();
    });
})
  .on('end', function () {
    console.log('Finished retrieving resulst');
});

connection.end();

```

再次重申，要在文件的开始处修改主机名和身份认证，然后将其保存为文件 app.js 并运行：

```bash
$ node app.js
```

之后会输出如下信息：

```
Changed content of 1001rows
Received filed:
[ FieldPacket {
    catalog: 'def',
    db: 'node',
    table: 'test',
    orgTable: 'test',
    name: 'id',
    orgName: 'id',
    charsetNr: 63,
    length: 11,
    type: 3,
    flags: 16899,
    decimals: 0,
    default: undefined,
    zeroFill: false,
    protocol41: true },
  FieldPacket {
    catalog: 'def',
    db: 'node',
    table: 'test',
    orgTable: 'test',
    name: 'content',
    orgName: 'content',
    charsetNr: 33,
    length: 765,
    type: 253,
    flags: 0,
    decimals: 0,
    default: undefined,
    zeroFill: false,
    protocol41: true } ]
Content of row #8990is: "content for row8990"
Content of row #8991is: "content for row8991"
Content of row #8992is: "content for row8992"
Content of row #8993is: "content for row8993"
Content of row #8994is: "content for row8994"
Content of row #8995is: "content for row8995"
Content of row #8996is: "content for row8996"
Content of row #8997is: "content for row8997"
Content of row #8998is: "content for row8998"
Content of row #8999is: "content for row8999"
Content of row #9000is: "new content"
Content of row #9001is: "new content"
Content of row #9002is: "new content"
Content of row #9003is: "new content"
Content of row #9004is: "new content"
Content of row #9005is: "new content"
Content of row #9006is: "new content"
Content of row #9007is: "new content"
Content of row #9008is: "new content"
Content of row #9009is: "new content"
Content of row #9010is: "new content"
Finished retrieving resulst
```

## 本章小结

幸好有了 [mysql 模块](https://github.com/mysqljs/mysql)，与MySQL数据库交换数据才变得简单、高效。然而，心处理外部潜在恶意数据时，必须谨慎小心和密切关注。通过监听异步事件，大型结果集今可以被高效地逐行处理。
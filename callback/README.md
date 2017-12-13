# 控制回调流程

**本章提文**

* 理解飞去来器效应

* 避免深度嵌套回调

* 创建异步流程控制例程

* 使用 async 控制回调流程

* 使用 async 进行异步迭代

当 Node 执行异步操作时，操作的结果并不是通过函数的返回值来反馈。相反，异步程序依赖于回调函数，回调函数通常作为参数传入。

如果需要离开进程并进行一些 I/O 操作，大多数时候需要指定一个在操作结束时被调用的回调函数。

如果任务涉及大量的 I/O 操作，要把这些回调函数的流程安排得井井有条就很棘手，也许还会导致一种被称作“ 回调汤” 或“ 飞去来器效应” 的模式。

## 理解飞去来效应

[“飞去来器” ](https://baike.baidu.com/item/飞去来器/886134?fr=aladdin) 效应发生在一组回调按序执行时——当一个 I/O 操作结束时，下一个操作就开始。”飞去来器” 的名称来源于代码中有很多嵌套回调函数时的形状，递增的左缩进以及左缩进的回退构成了一个类似飞去来器的形状。

为了说明飞去来器效应，需要创建一个脚本， 向文件 a.txt 附加 0~10 个字节，并存入文件b.txt。这两个文件都存在于当前目录下， 如下所示：

```js
var fs = require('fs');

function append_some_a_to_b (callback) {
    fs.open(__dirname + '/a.txt', 'r', function(err, aFd) {
        if (err) {
            return callback(err);
        }

        var buffer = new Buffer(10);

        fs.readFile(aFd, buffer, 0, buffer.length, 0, function (err) {
            if (err) {
                return callback(err);
            }

            fs.close(aFd, function (err) {
                if (err) {
                    return callback(err);
                }
            });

            fs.open(__dirname + '/b.txt', 'a', function(err, bFd) {
                if (err) {
                    return callback(err);
                }

                fs.stat(bFd, function (err, stat) {
                    if (err) {
                        return callback(err);
                    }

                    fs.write(bFd, buffer, 0, buffer.length, bStat.size, function (err) {
                        if (err) {
                            return callback(err);
                        }
                    });
                    fs.close(bFd, callback);
                });
            });

        });
    });
}

console.log('starting...');

append_some_a_to_b(function (err) {
    if (err) {
        throw err;
    }

    console.log('done');
});
```

注意 append\_some\_ a\_ to\_b 函数，该函数为本任务实现了回调流程，内联声明回调函数将导致深层嵌套代码，对于未经训练的程序员，用这种方式编写的代码难以阅读。

更糟糕的是，如果需要在最终操作之前有条件地执行一些 I/O 操作，用这种方式构­的代码会造成大量重复。

> **\[info\] 注意**
>
> 虽然以内联形式声明回调函数至少有一个优点，但是，如果将回调函数代码直接放在 I/O 调用之后，你更能感受到操作是串行进行的。
>
> 与编程中遇到的大多数情况一样，这并不是非此即彼的建议——只要不滥用嵌套的回调函数，它们有时也是说得过去的。

## 通过声明函数避免飞去来器效应

可以通过给函数命名，并且在同一作用域声明它来避免飞去来器效应。下面的代码使用了声明的命名函数重构了上面的例子：

```js
var fs = require('fs');

function append_some_a_to_b (callback) {
    var aFd, bFd;
    var buffer = new Buffer(10);

    function open_a () {
        fs.open(__dirname + '/a.txt', 'r', read_from_a);
    }

    function read_from_a (err, fd) {
        if (err) {
            return callback(err);
        }
        aFd = fd;
        fs.read(aFd, buffer, 0, buffer.length, 0, close_a);
    }

    function close_a (err) {
        if (err) {
            return callback(err);
        }
        fs.close(aFd, open_b);
    }

    function open_b (err) {
        if (err) {
            return callback(err)
        }

        fs.open(__dirname + '/b.txt', 'a', stat_b);
    }

    function stat_b (err, fd) {
        if (err) {
            return callback(err);
        }
        bFd = fd;
        fs.stat(bFd, write_b);
    }

    function write_b (err, bStats) {
        if (err) {
            return callback(err);
        }

        fs.write(bFd, buffer, 0, buffer.length, bStats.size, close_b); 
    }

    function close_b (err) {
        if (err) {
            return callback(err);
        }
        fs.close(bFd, callback);
    }

    open_a();
}

console.log('starting...');

append_some_a_to_b(function (err) {
    if (err) {
        throw err;
    }

    console.log('done');
});
```

上面的代码声明了处于同一作用域的函数，应用这项技术摆脱了闭包嵌套效应，现在必须在处于每个函数上层的作用域中存储必要的值。

你也许已经注意到了，尽管这样做了，代码至少还存在两个问题：

* 每个函数都必须知道流程中的下一个函数名

* 必须总是处理错误，这意味着存在大量的重复代码。

在下面的代码中，因为将所有回调函数都串接起来了， 所以可以让代码变得更加通用和灵活：

```js
var fs = require('fs');

function cascade (callbacks, callback) {
    // 复制函数数组
    var functions = callbacks.slice(0);

    function processNext (err) {
        // 
        if (err) {
            return callback(err);
        }
        // 将参数对象转为数组
        var args = Array.prototype.slice.call(arguments);
        // 取出当前函数数组中位于第一位的函数
        var func = functions.shift();

        if (func) {
            // 删除包含错误的第一个参数,因为不管怎么样都存在 err 参数
            args.shift();
        } else {
            // 当函数数组中的函数值行完毕时
            func = callback;
        }

        // 将next函数添加到参数列表
        args.push(processNext);

        func.apply(this, args);
    }
    // 执行回调函数
    processNext.call(this);
}

function append_some_a_to_b (callback) {
    var aFd,bFd;
    var buffer = new Buffer(10);

    cashcade([
        function open_a (next) {
            fs.open(__dirname + '/a.txt', 'r', next);
        },

        function read_from_a (fd, next) {
            aFd = fd;
            fs.read(aFd, buffer, 0, buffer.length, 0, next);
        },

        function close_a(bytesRead, buf, next) {
            fs.close(aFd, next);
        },

        function open_b (next) {
            fs.open(__dirname + '/b.txt', 'a', next);
        },

        function stat_b (fd, next) {
            bFd = fd;
            fs.stat(bFd, next);
        },

        function write_b (bStats, next) {
            fs.write(bFd, buffer, 0, buffer.length, bStats.size, next);
        },

        function close_b (bytesWritten, buf, next) {
            fs.close(bFd, next);
        }
    ], callback);
}

console.log('starting...');

append_some_a_to_b(function (err) {
    if (err) {
        throw err;
    }

    console.log('done');
});
```

上面的代码中声明了一个带有两个参数的函数 `casecade` ，它的第一个参数是包含所有将要被调用的回调函数的数组，第二个参数包含最终的回调函数，该回调函数在所有回调都完成时被调用，或者用来预防错误。

`cascade` 函数将会逐个调用回调函数，并向每个回调函数传入 `processNext` 函数，作为其最后一个参数。`processNext` 函数被传入到正在执行的回调函数中被用作其中的异步操作的回调函数。通过这种方法，每个回调函数不必知道下个调用的究竟是哪个函数。

然后，append\_some\_ a\_to\_b 函数用回调函数列表和最终回调函数来调用 `cascade` 函数。

## 使用 ASYNC 流程控制库

如前面的例子所示，有时可以回滚自定义的通用流程，然而，很多第三方库能够简化这项工作以及其他异步模式，其中一个就是 [async 模块](https://tuzhu008.github.io/async_cn/)。

安装 async 模块，并将其添加到 package.json 清单文件中，如下所示：

```js
$ npm install async --save;
```

下面的例子完成了一个返回给定数值求平方的 HTTP 服务器。如下所示：

```js
var port = process.argv[2] && parseInt(process.argv[2], 10) || 8080;

require('http').createServer(function(req, res) {
    var body = '';
    
    req.setEncoding('utf8');
    
    req.on('data', function (data) {
        body += data;
    });
    
    req.once('end', function () {
        var number = JSON.parse(body);
        var squared = Math.pow(number, 2);
        res.end(JSON.strigify(squared);
    });
}).listen(port, function () {
    console.log('Squaring Server listening on port %d',port);
});
```

将上述脚本保存为 server.js 文件，并启动它：

```bash
$ node server.js

Squaring Server listening on port 8080
```

下面介绍 async 中几个有用的辅助函数。

### 串行执行

可以串行执行一组异步返回结果的函数。将使用上面的代码来学习。

为了运行这些例子，还需要安装 request 模块，如下：

```bash
$ npm install request
```

下面的代码展示了一个使用 [`async.series`](https://tuzhu008.github.io/async_cn/docs.html#series) 辅助函数将两个 I/O 操作执行串接起来的例子：

```js
var async = require('async');
var request = require('request');

function done (err, results) {
  if (err) {
    throw err;
  }
  console.log('results: %j', results);
}

async.series([
  function (callback) {
    request.post({
      uri: 'http://localhost:8080',
      body: '4'
    }, function (err, res, body) {
      callback(err, body && JSON.parse(body));
    })
  },
  function (callback) {
    request.post({
      uri: 'http://localhost:8080',
      body: '5'
    }, function (err, res, body) {
      callback(err, body && JSON.parse(body));
    })
  },
], done);
```

上面的代码执行了连个非常相似的函数，一次传递的 body 的值为 4，另一次传递的 body 值是5.

将上面的脚本保存为文件 series.js 并运行

```js
$ node series.js

results: [16,25]
```

所有函数都结束后， 会调用回调函数 `done`, 此时 `done` 函数带有每个回调函数的异步结果，在本例中，异步结果包含每次调用平方运算服务器后的输出结果， 即包含4和5的平方。

> **[info] 「编者注」：**
>
> 上面的代码与原书稍有出入，使用 `callback` 替换了 `next` 。这样做的目的一是与 async 的官方文档对应，二是语义化。

### 并行执行

在前面的例子中，回调函数逐个被执行， 然而这些回调函数也可以并行执行， 为此，只需要将 [`async.series`](https://tuzhu008.github.io/async_cn/docs.html#series) 调用修改为 [`async.parallel`](https://tuzhu008.github.io/async_cn/docs.html#parallel)调用 。 如下所示：

```js
var async = require('async');
var request = require('request');

function done (err, results) {
  if (err) {
    throw err;
  }
  console.log('results: %j', results);
}

async.parallel([
  function (callback) {
    request.post({
      uri: 'http://localhost:8080',
      body: '4'
    }, function (err, res, body) {
      callback(err, body && JSON.parse(body));
    })
  },
  function (callback) {
    request.post({
      uri: 'http://localhost:8080',
      body: '5'
    }, function (err, res, body) {
      callback(err, body && JSON.parse(body));
    })
  },
], done);
```

如果将上面的代码保存为 parallel.js 并运行，将会得到跟前面的例子相同的结果：

```bash
$ node parallel.js

results: [16,25]
```

### 连续传递

同样还可以执行一串函数，其中下一个回调函数的执行取决千前一个回调函数的结果。例如，如果想用平方运算服务器计算3的4次方，用 `async.waterfall` 函数就能轻松进行这项工作，如下所示：

```js
var async = require('async');
var request = require('request');

function done (err, results, body) {
  if (err) {
    throw err; 
  }
  console.log('3^4 = %d', body);
}

async.waterfall([
  function (callback) {
    request.post({
      uri: 'http://localhost:8080',
      body: '3'
    }, callback)
  },
  function (res, body, callback) {
    request.post({
      uri: 'http://localhost:8080',
      body: body
    }, callback)
  },
], done);
```

可以看到，除了第一个错误参数之外，每个回调函数都会得到最后一个操作的回调参数。如果出现错误，就会调用最后一个回调函数（本例中为done),此时其错误参数的值就是出现的错误。

### 排队

如果需要进行一些重复性的异步作业并想控制并发数——在给定时刻同时存在的正在进行的作业的最大数量——就可以使用 [`async.queue`](https://tuzhu008.github.io/async_cn/docs.html#queue) 函数。

该函数创建一个队列，该队列将基于一个函数处理其中的元素，队列的客户端可以将作业和并发作业的最大数量传入这个函数， 按照顺序执行每个作立。

下面的代码创建了一个队列，用平方运算服务器来计算数值的平方。

```js
var async = require('async');
var request = require('request');

function done (err, results) {
  if (err) {
    throw err; 
  }
  console.log('3^4 = %d', body);
}

var maximumConcurrency = 5;

function worker (task, callback) {
  request.post({
    uri: 'http://localhost:8080',
    body: JSON.stringify(task)
  }, function (err, res, body) {
    callback(err, body && JSON.parse(body));
  });
}

var queue = async.queue(worker, maximumConcurrency);

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(function (i) {
  queue.push(i, function (err, result) {
    if (err) {
      throw err;
    }

    console.log(i + '^2 = %d', result);
  });
});
```

上面的代码创建了一个函数 `worker`, 用这个函数来接受和处理任务，本例中任务就是一个数值，`worker` 函数调用平方运算服务器来获取这个数的平方值。

然后基于 `worker` 函数创建了一个队列，并定义了最大并发数，本例中最大并发数被议立为 5, 但是它可以是任意值，可以根据自己的情况来定义它。

然后用 `queue.push` 将10个作业，也即数值 1~10 传入队列，`queue.push` 函数接受了个回调函数， 这个回调函数会在每一个作业完成时接受其结果。

将上面的脚本保存为文件 queue.js 并运行：

```bash
$ node queue.js            
1^2 = 1
3^2 = 9
2^2 = 4
4^2 = 16
5^2 = 25
6^2 = 36
7^2 = 49
10^2 = 100
9^2 = 81
8^2 = 64
```

> **[info] 注意：**
>
> 在上面的输出信息中可以看到，输出结果的顺序与传入数值的顺序并不一致，这是异步的特性：结果是按照计算完成的顺序进行显示的。如果要对结果进行排序，那么应该使用 `async.foreach` 函数或者类似的函数一一在本章 的后面将会介绍。

> **[info] 「编者注」：**
>
> 与原书中对于为什么输出顺序不规则持有不同意见，如 [async 文档](https://tuzhu008.github.io/async_cn/docs.html#queue)所说，任务在被添加到队列后是并发执行的。因此结果与执行的时间有关。
>
> 我们再次运行
>
> ```bash
> $ node queue.js
> 1^2 = 1
> 5^2 = 25
> 4^2 = 16
> 3^2 = 9
> 2^2 = 4
> 6^2 = 36
> 9^2 = 81
> 8^2 = 64
> 7^2 = 49
> 10^2 = 100
> ```
>
> 会发现，两次运行结果不一样。

使用队列的优点之一是它限制了并发请求的数量，可以用它限制对类似数据库等资源的并发访问、避免出现泛滥。 但是如何才能确定和适应最优的最大并发数呢？最大并发数是根据应用程序确定的，例如，它可能是具有可察觉延迟的函数，或者由外部设置。不管怎么做，知道在队列被创建之后，可以通过修改其 `concurrency` 属性来修改最大并发数都且都是有好处的：

```js
queue.concurrency = 10;
```

队列还会发射一些与其状态有关的事件，可以通过将一个函数插入队列的 `saturated` 属性中，它是一个回调函数，在队列到达最大并发数限制时被调用，此时后面的任务必须等待，如下所示：

```js
queue.saturated	= function () {
    console.log('queue is saturated'); 
}
```

同样，也可以通过监听 `empty` 事件，了解到何时队列中的最后一项被分配给了一个作业，如下所示：

```js
queue.empty = function () {
    console.log('queue is empty'); 
}
```

当返回队列中的最后一项作业时，队列会发射 `drain` 事件：

```js
queue.drain = function () {
    console.log('queue is drained, no more work!'); 
}
```

`drain` 事件和其他事件在队列的生命周期内会被发射多次，因为有可能在未来某个时间会向队列添加作业。

### 迭代

JavaScript有些精巧的函数，用来在集合上进行同步迭代， async 提供了其中一些函数，但是这些函数具有异步语义。例如，如果在 JavaScript 中有一个数组，就可以使用  `array.forEach` 对它进行迭代：

```js
[1, 2, 3, 4].forEach(function (i) {
    var squared = Math.pow(i, 2);
    console.log('%d ^ 2 is %d', i ,squared);
});
```

如果在每个元素值上执行一些 I/O 操作，而不是一些同步函数，那么这种方法就不会产生任何效果。

可以使用 `async.forEach` 在对象集合上进行异步迭代，如下所示：

```js
var async = require('async');
var request = require('request');

var results = {};

function done (err) {
  if (err) {
    throw err; 
  }
  console.log('done！results: %j', results);
}

var collection = [1, 2, 3, 4];

function iterator (value, callback) {
  request.post({
    uri: 'http://localhost:8080',
    body: JSON.stringify(value)
  }, function (err, res, body) {
    if (err) {
      return callback(err);
    }
    results[value] = JSON.parse(body);
    callback();
  });
}

async.forEach(collection, iterator, done);
```

这个例子定义了一个 `iteiator` 函数，在 `async.forEach` 中用到了该函数。`iterator` 函数利用集合中的元素来执行必要的 I/O 操作，并且在 I/O 操作结束后会调用回调函数。当在所有元素上完成了一步迭代时，就会调用最后一个回调函数（本例中为 done）。

如果心到了 `async.forEach` 函数，就会针对每个元素并行调用响应的迭代器。如果希望 async 模块在一个迭代结束之后再开始下一个迭代，可以使用 `async.forEachOfSeries` 函数，在本例中，只需要用如下所示的代码替换：

```js
async.forEachSeries(collection, iterator, done); 
```

你也可以在进行并行迭代的同时控制最大并发数，通过使用 `forEachOfLimit`， 就可以设置任意时刻运行迭代器的最大数量。如下所示：

```js
var maximumConcurrency = 5;
async.forEachOfLimit(collection, maximumConcurrency, iterator, done);
```

### 映射

JavaScript 还提供了一个 `array.map` 函数，用来同步迭代所有元素，并获得一个新数组。

可以用 `async.map` 完成同样的任务，不同的是迭代不是同步而是异步的，如下所示：

```js
var async = require('async');
var request = require('request');

function done (err, results) {
  if (err) {
    throw err; 
  }
  console.log('done！results: %j', results);
}

var collection = [1, 2, 3, 4];

function iterator (value, callback) {
  request.post({
    uri: 'http://localhost:8080',
    body: JSON.stringify(value)
  }, function (err, res, body) {
   callback(err, body && JSON.parse(body));
  });
}

async.map(collection, iterator, done);

```

除了不必手工获得结果外，这个例子和前面的例子很相似 —— 只要将每个结果传递给迭代函数中的回调函数即可。每次迭代都可能耗费任意时间完成，但是 `async.map` 在获得所有结果之后，可以按照正确的顺序将结果提交给回调函数 `done`。

### 规约

JavaScript还有一个 `array.reduce` 函数，它将一个初始值和一个迭代函数作为参数，并返回一个新值，并将这个新值和新元素一并传入下一次迭代。

例如，`reduce` 函数的典型应是对元素求和：

```js
var collection = [1, 2, 3, 4];

function iterator (sum, elm) {
    return sum += elm;
}

var sum = collection.reduce(iterator, 0);

console.log('sum is %d', sum);
```

`asvnc.reduce` 函数提供了相同的语义，但他是进行异步迭代的。

如果想用平方运算服务器来计算一个集合中所有值的平方和， 可以使用如下代码：

```js
var async = require('async');
var request = require('request');

function done (err, result) {
  if (err) {
    throw err; 
  }
  console.log('done！result: %j', result);
}

var collection = [1, 2, 3, 4];

function iterator (memo, item, callback) {
  request.post({
    uri: 'http://localhost:8080',
    body: JSON.stringify(item)
  }, function (err, res, body) {
    console.log(JSON.parse(body))
   callback(err, body && memo + JSON.parse(body));
  });
}

async.reduce(collection, 0, iterator, done);

```

与同步版本的 `array.reduce` 函数类似，`async.reduce` 函数将初始值作为其第二个参数，本例中为0。然后在集合中的每个元素上进行迭代，当次迭代结束时，都将一个新的 `memo` 值传入回调函数。在本例中，这个新 `memo` 值是集合元素的平方值加上原来 `memo`的值。

### 过滤

在 JavaScript 中，可以基于一个过滤函数 `filter` 对集合进行过滤，如下所示：

```js
var collection = [1, 2, 3, 4];

function isEven (value) {
    return value % 2 === 0;
}

var evenElements = collection.filter(isEven);

console.log('even element of %j are: %j', collection, eventElements);
```

上面的例子对一个数值集合进行了过滤，并返回了奇数值。

`async.filter` 函数可以异步执行相同的操作，例如，可以过滤平方运算服务器计算出的平方值大于 10 的元素，如下所示：

```js
var async  = require('async');
var request = require('request');

var collection = [1, 2, 3, 4];

function done (err, results) {
  if (err) {
    throw err; 
  }
  console.log('even element of %j are: %j', collection, results);
}

function test (value) {
    return value > 10;
}

function iterator (item, callback) {
  request.post({
    uri: 'http://localhost:8080',
    body: JSON.stringify(item)
  }, function (err, res, body) {
   callback(err, body && test(JSON.parse(body)));
  });
}

async.filter(collection, iterator, done);
```

> **[info] 「编者注：」**
>
> 此处与原书中有差异！

上面的例子中使用了一个 `test` 函数来检测计算后的值是否大于 10，然后将一个错误对象和一个布尔值传入回调。

async 中还提供了一个与 `filter` 函数作用想法的函数 `reject` ，这个函数会排除满足条件的项。放在上面的中，就会过滤掉那些计算后的值大于 10的数。

`async.filter` 和 `async.reject` 会针对每个元素并行调用 `filter` 函数，`async` 还提供了这两个函数的串行版本：

```js
async.filterSeries(collection, filter, done); 
```

和

```js
async.rejectSeries(collection, filter, done); 
```

使用这两个函数中的任何一个，在任意给定时刻都只会调用一个过滤函数。

### 检测

当满足某个条件时，也许你想停止迭代。例如，也许想检测集合中第一个平方值大于 10 的数，如下所示：

```js
var async  = require('async');
var request = require('request');

var collection = [1, 2, 3, 4];

function done (err, result) {
  if (err) {
    throw err; 
  }
  console.log('The first element on %j whose square value' + 
              'is greater than 10: %j', collection, result); 
}

function test (value) {
    return value > 10;
}

function iterator (item, callback) {
  request.post({
    uri: 'http://localhost:8080',
    body: JSON.stringify(item)
  }, function (err, res, body) {
   callback(err, body && test(JSON.parse(body)));
  });
}

async.detect(collection, iterator, done);
```

在上面的代码中，`async.detect` 针对每个元素并行调用 `detect` 函数，也就说有可能无法得到按照集合顺序满足条件的第一个元素——这取决于异步操作完成的顺序。

如果顺序很重要，或者在任给定时刻只想调用一个 `detect` 函数，可以使用它的串行版本 `async.detectSeries`。如下：

```js
async.detectSeries(collection, iterator, done);
```

在的代码中，`async.detectSeries` 调用了 `detect` 函数，并等待函数执行结束。如果元素检测失败，`async.detectSeries` 会针对下一个元素进行检测，直到检测到一个元素或者所有的元素都已检测完毕。

## 本章小结

异步流程难以控制，它容易导致缺乏结构的代码，免该问题的方法之一是事先将回调函数声明为命名函数，并避免对它们进行嵌套。

可以创建一个通用的流程控制例程，或者使用第三方模块 [`async`](https://github.com/caolan/async) 提供的众多辅助函数，使用这些辅助函数可以串行或并行地执行函数调用，或者以异步方式在集合上进行遍历。本章介绍了一些使用最频繁的函数，但是 `async` 提供的函数远不止这些。如有兴趣，可以参阅其 [官方文档](http://caolan.github.io/async/) 或者 [中文文档](https://tuzhu008.github.io/async_cn/index.html)。
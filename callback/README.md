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

如前面的例子所示，有时可以回滚自定义的通用流程，然而，很多第三方库能够简化这项工作以及其他异步模式，其中一个就是 [async 模块](https://github.com/caolan/async)。




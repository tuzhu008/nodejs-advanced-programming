# 创建和控制外部流程

**本章提要：**

* 执行命令和子进程

* 子进程发送和接收数据

* 向子进程发送信号后终止子进程

  
Node 是被设计来高效处理 I/O 操作的，但正如你所见，某些类型的程序并不适用于这种模式。比如当用 Node 处理一个 CPU 密集型任务时可能会阻塞事件循环，并会因此降低使用程序的响应能力。替代的办法是，CPU 密集型任务应该被分配给另一个进程处理，从而释放事件循环。Node 允许创建进程，并将这些进程当作「启动它们的进程」（父进程）的子进程。在 Node 中， 子进程和父进程能够进行**双向**通信， 并且在一定程度上， 父进程可以监视视和控制子进程。

另一种要使用子进程的情况只是执行一个外部命夕，并在执行结束后让 Node 获得返回的结果。例如，你也许想执行一个 UNIX 命令、脚本或者其他不能在 Node 直接执行的实用程序。

本章将向你展示如何生成外部命令、创建子进程、与子进程通信以及终止子进程， 重点是在 Node 进程之外实现多任务操作。

## 执行外部命令

当需要执行一个外部 shell 命令或者可执行文件时， 可以使用 [`child_process`](http://nodejs.cn/api/child_process.html) 模块，可以像下面这样导入该模块：

```js
var child_process = require('child_process');
```

然后像下面这样使用该模块中的 [`exec`](http://nodejs.cn/api/child_process.html#child_process_child_process_exec_command_options_callback) 函数：

```js
var exec = child_process.exec;
exec(command, callback);
```

`exec` 函数的第一个参数是一个字符串，它表示你准备执行的 shell 命令。第二个参数是一个回调函数，它会在命令结束或者发生错误的时候被 `exec` 函数调用，回调函数有三个参数：error、stdout 和 stderr。这里有一个例子：

```js
exec('ls', function (err, stdout, stderr) {
    //...
});
```

如果出现错误，第一个参数是 Error 类的一个实例，如果第一个参数不包含错误，第二个参数 stdout 将会包含命令的输出信息，最后一个参数包含命令的错误输出信息。

下面的展示了一个较为复杂的执行外部命令的例子：

```js
// 导入child_process 模块中的 exec 函数
var exec = require('child_process').exec;
// 执行命令
exec('cat *.js | wc -l', function (err, stdout, stderr) {
  // 发生错误
  if (err) {
    console.log('child process exited with error code: ', err);
    return;
  }
  console.log(stdout);
});
```

在第4行中将字符串 `cat *.js | wc -l`作为第一个参数传递给 `exec` 函数，也可以使用它执行其他命令， 就跟你在 shell 命令行中输入命令一样。

然后传递一个回调函数作为 `exec` 函数的第二个参数，当发生错误或者子进程终止后出调用该回调函数。

还可以向 `exec` 函数传递一个包含若干配置选项的可选参数，该参数应放在回调函数之前， 如下所示：

```js
var exec = require('child_process').exec;
var options = {
    timeout: 1000,
    killSignal: 'SIGKILL'
};
exec('cat *.js | wc -l', function (err, stdout, stderr) {
    //...
});
```

更多可选的选项请参考：



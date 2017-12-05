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

* `cwd`[&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) 子进程的当前工作目录。如果想强制进入当前工作目录， 就应使用该选项。

* `env`[&lt;Object&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) 传递给子进程的环境变量键值对。默认值是null，这意味着子进程会继承所有父进程的环境变量，这些环境变量在子进程创建之前就已经被定义好了。

* `encoding`[&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) 子进程输出所使用的编码格式，默认为`'utf8'`。也可以使用其他格式：`'ascii'`、`'utf8'`、`'ucs2'`、`'base64'`。想要了解更多，请参见[第4章](/Buffer/README.md)。

* `shell` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) 用于执行命令的 shell。 在 UNIX 上默认为`'/bin/sh'`，在 Windows 上默认为`process.env.ComSpec`。 详见

[Shell Requirements](http://nodejs.cn/api/child_process.html#child_process_shell_requirements)与[Default Windows Shell](http://nodejs.cn/api/child_process.html#child_process_default_windows_shell)。

* `timeout` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) 命令执行的超时时间， 单位为毫秒，默认为`0`，即无限等待下去，直到子进程终止。

* [`maxBuffer`](http://nodejs.cn/api/child_process.html#child_process_maxbuffer_and_unicode) [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) stdout 或 stderr 允许的最大字节数。 默认为 `200*1024`。 如果超过限制，则子进程会被终止。 查看警告： [`maxBuffer`and Unicode](http://nodejs.cn/api/child_process.html#child_process_maxbuffer_and_unicode)。

* `killSignal` [&lt;string&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) \| [&lt;integer&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)  如果超时或者超出缓存容量，该信号就会被发送到子进程。默认为 `'SIGTERM'`，它会向进程发送一个终止信号，这通常是终止进程的一种有序方法。当使用 `SIGTERM` 信号时，进程可以处理和重载默认行为。 如果目标进程需要， 还可以将其他信号（例如 `SIGUSRl` \)与 `SIGTERM`  一并发送给它。 还可以向目标进程发送 `SIGKILL` 信号， 该信号由操作系统处理，并且不会对被触发的程序做任何清理就立即强制终止进。如果想进一步控制进程的终止，可以用`child_process.spawn` 函数代替发送终止信号，该函数在后面会有介绍。

* `uid` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) 设置该进程的用户标识。（详见 [setuid\(2\)](http://man7.org/linux/man-pages/man2/setuid.2.html)）

* `gid` [&lt;number&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) 设置该进程的组标识。（详见[setgid\(2\)](http://man7.org/linux/man-pages/man2/setgid.2.html)）

* `windowsHide` [&lt;boolean&gt;](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)Hide the subprocess console window that would normally be created on Windows systems.默认值**:**`false`

> ** \[info\] 注意：**
>
> 通过 `killSignal` 选项可以以字符串的形式向目标进程发送信号， 信号在 Node 中是用字符串标识的，此处列出了 UNIX 中的所有信号以及它们的 默认行为：
>
> | 名称 | 默认行为 | 描述 |
> | :--- | :--- | :--- |
> | SIGUP | 终止进程 | 终端挂起 |
> | SIGINT | 终止进程 | 中断程序 |
> | SUGQUIT | 创建核心映像 | 退出程序 |
> | SIGILL | 创建核心映像 | 非法指令 |
> | SIGTRAP | 创建核心映像 | 跟踪捕获 |
> | SIGABRT | 创建核心映像 | 中止程序 |
> | SIGEMT | 创建核心映像 | 模拟执行命令 |
> | SIGFPE | 创建核心映像 | 浮点异常 |
> | SIGKILL | 终止进程 | 终止程序 |
> | SIGBUS | 创建核心映像 | 总线错误 |
> | SIGSEGV | 创建核心映像 | 段违规 |
> | SIGSYS | 创建核心映像 | 调用了不存在的系统调用 |
> | SUGPIPE | 终止进程 | 软件终止信号 |
> | SIGALRM | 终止进程 | 实时定时器到时 |
> | SIGTERM | 终止进程 | 软件终止信号 |
> | SIGURG | 丢弃信号 | 套接字上出现紧急状况 |
> | SIGSTOP | 停止进程 | 停止（无法捕获或忽略） |
> | SIGTSTP | 停止进程 | 键盘产生的停止信号 |
> | SIGCONT | 忽略该信号 | 停止之后继续 |
> | SIGCHLD | 忽略该信号 | 子进程状态发生改变 |
> | SIGTTIN | 停止进程 | 后台进程试图从控制终端读取数据 |
> | SIGTTOU | 停止进程 | 后台进程试图向控制终端写入数据 |
> | SIGIO | 丢弃信号 | 某个描述符上的 I/O 可行 |
> | SIGXCPU | 终止进程 | 超过 CPU 事件限制 |
> | SIGXFSZ | 终止进程 | 超过文件大小限制 |
> | SIGVTALRM | 终止进程 | 虚拟定时器到时 |
> | SIGPROF | 终止进程 | 统计分布图定时器到时 |
> | SIGWINCH | 忽略该信号 | 窗口大小发生改变 |
> | SIGINFO | 忽略该信号 | 键盘产生的状态请求 |
> | SIGUSR1 | 终止进程 | 用户自定义信号1 |
> | SIGUSR2 | 终止进程 | 用户自定义信号2 |

也许你想给子进程提供一组环境变量，作为父进程环境变量的扩展， 如果直接修改 `process.env` 对象，就会改变 Node 进程中每个模块的环境变量，这样做会招致很多不便。可以创建一个新对象作为 `process.env` 对象的增强复制版本代替上述做法，如下所示。

```js
var env = process.env,
    varName,
    envCopy = {},
    exec = require('child_process').exec; 
// 将 process.env 对象的内容复制到 envCopy 中
// 可以采用 es6 的Object.assign()
for (varName in env) {
    envCopy[varName] = env[varName];
}
// 分配一些自定义变量
enCopy['CUSTOM ENV VAR'] = 'some value';
enCopy['CUSTOM ENV VAR 2'] = 'some other value';
//结合process_env 对象和自定义变量执行命令
exec('ls -la', { env: envCopy}, function (err, stdout, stderr) {
    if (err) {
        throw err;
    }
    console.log('stdout: ', stdout);
    console.log('stderr: ', stderr);
});
```

在上面的例子中，创建了一个保存 `envCopy` 变量的对象，该对象在初始化时复制了 `process.env` 对象的内容，然后就可以添加环境变量或者替换掉你希望修改的环境变量。最后在执行命令时将环境变量对象 `envCopy` 传递给 `exec` 函数。

请记住，环境变量是通过操作系统在进程之间传递的，因此所有环境变量值都是以字符串的形式传入子进程的。 例如，如果父进程将数字 123 作为环境变量进行传递， 那么子进程接收的则是字符串形式的123。

可以在同一文件夹中创建两个 Node 脚本作为示例， 一个命名为 parent.js，另一个命名 为 child.js，由 parent.js 启动 child.js。 为此， 必须将这两个脚本放在合适的位置。

**parent.js:**

```js
var env = process.env,
varName,
envCopy = {},
exec = require('child_process').exec;
// 将 process.env 对象的内容复制到 envCopy 中
// 可以采用 es6 的Object.assign()
for (varName in env) {
envCopy[varName] = env[varName];
}

envCopy.number = 100;

exec('node child.js', {env: envCopy}, function (err, stdout, stderr) {
if (err) {
throw err;
}
console.log('stdout: ' , stdout);
console.log('stderr: ' , stderr);
});
```

**child.js:**

```js
var number = process.env.number;
console.log(typeof(number)); // -> "string"
number = parseInt(number, 10); 
console.log(typeof(number)); // -> "number 
```

进入存放这两段源代码所在的文件夹， 使用命令行运行它：

```bash
$ node parent.js
```

此时终端会输出以下信息：

```bash
% node parent.js                                                     
stdout:  string
number

stderr:
```

在上面的信息中可以看到，尽管父进程传递了一个数字型的环境变量， 但是子进程接收的却是一个字符串。

## 生成子进程

如你所见， 可以使用 `child_process.exec()` 函数启动外部进程，并在进程结束时调用回调函数。该方法十分简单，不过也有一些缺点：

* 除了命令行参数和环境变量之外，`exec()` 函数不允许与子进程通信。

* 子进程的输出是被缓存的，结果是无法对其进行流操作，它可能会耗尽内存。

幸运的是，Node 的 `child_process` 模块允许对子进程的启动、终止以及与其进行交互进行更精细的控制。你也许会在程序（也就是父进程）中新建一个进程（也就是子进程）一旦启动了一个新的子进程，Node 就创建了一个双向通信通道，两个进程可以利用这条通道互相收发字符串形式的数据，父进程还可以对子进程施加一些控制、向其发送信号或者强制终止子进程。




# 查询和读写文件

**本章提要：**

* 处理文件路径

* 从文件路径中提取信息

* 理解文件描述

* 应用 fs.stat 获取文件同级信息

* 打开、读写和关闭文件

* 避免文件描述符泄露

Node 中有一组流 API，它们可以像处理网络流那样处理文件。流 API 用起来非常方便，但是它**只允许**以**连续的方式**处理文件。如果需要在文件的指定位置进行读写， 流 API 就行不通了。所以， 必须使用一些更底层的操作来对文件系统自身进行处理。

本章内容囊括了文件处理的基础，包括如何打开文件、读取文件的指定部分、写入文件以及关闭文件。

Node 的很多文件 API 几乎是 UNIX\(POSIX\) 中对应文件 API 的翻版， 比如， 使用文件描述符的方式就和 UNIX 中的一样。文件描述符句柄在 Node 中也是一个整数， 代表进程文件描述符表的某个入口的索引。

有三个特殊的文件描述符－— 1、2和3。它们分别表示标准输入文件、标准输出文件和标准错误文件的描述符。顾名思义，标准输入是一个只读流， 进程可以用它读取控制台的输入或者其他进程传送的数据。标准输出和标准错误是只对外输出的文件描述符，它们可以向控制台、其他进程或文件输出数据。标准错误专门用作输出错误信息， 而标准输出负责输出普通的进程信息。

一旦进程启动完毕，就能使用上述几个文件描述符了，它们其实并不对应实际的文件。与操作网络数据流非常相似，你不能在文件内指定的位置读写。使用这些文件描述符，只能连续地读写，已写入的数据就不能再修改了。

文件则不受这样的限制。例如，在 Node 中可以创建只能向尾部追加数据的文件，也能在指定的位置写入数据。

几乎所有处理文件的代码都会涉及处理文件路径，本章首先会介绍这些实用函数，然后再深入讲解文件读取和文件内容操作。

## 处理文件路径

文件路径用来表示具体的文件，它可以分为相对路径和绝对路径。可以连接文件路径、提取文件名信息，甚至可以检测文件是否存在。

在 Node 中，可以使用字符串来处理文件路径， 但是这样做会使问题变得难以处理。例如， 当你想连接路径的不同部分时，有些部分是以 "/" 结尾的，有些却不是， 而且在不同的操作系统中路径分隔符也不同，考虑到这些情况， 问题就会变得十分麻烦。

幸好， Node 中有一个 _path_ 模块可以帮助你规范化、连接和解析路径， 还可以将绝路径转换成相对路径、提取路径的组成部分以及确定路径是否存在。总而言之，path模块只是对字符串模板进行处理，而并不需要通过和文件系统交互来验证字符串（path.exists\(\) 函数除外）。

### 规范化路径

在存储和使用路径之前对其进行规范化通常是个好主意， 比如由用户输入或者由即配置文件获得的文件路径，还有由两个或多个路径连接得到的路径通常都需要规范化。为此，可以使用 path 模块中的 `normalize()`  函数来规范化路径字符串，而且它还能处理 `..`、`.`以及`//`。

```js
var path = require('path');
path.normalize('/foo/bar/baz/asdf/quux/..');
// -> '/foo/bar/baz/asdf'
```

### 连接路径

通过使用 `path.join()` 函数，可以连接任意多个路径字符串，此时需要将所有路径字符串**依次**传递给 `path.join()` 函数作为其参数， 如下所示：

```js
var path = require('path');
path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// -> '/foo/bar/baz/asdf'
```

如你所见，`path.join()` 函数同时也对路径进行了规范化。

### 解析路径

可以使用 `path.resolve()` 函数将多个路径解析为一个规范化的绝对路径， 该函数的作用就好像是对这些路径挨个进行 `cd` 操作， 但与 `cd` 操作不同的是， 这些路径可以是文件， 并且可以不必实际存在——即它不会利用底层的文件系统来尝试判断路径是否存在， 而只是对路径字符串进行处理。

例如：

```js
var path = require('path');
path.resolve('/foo/bar', './baz'); // -> /foo/bar/baz
path.resolve('/foo/bar', './tmp/file'); // -> /tmp/file
```

如果解析的结果不是绝对路径，那么 `path.resolve` 函数会将当前工作目录附加到解析结果的前面，下面是一个例子：

```js
path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
// 如果当前工作目录是 /home/myself/node/，那么上面的语句将返回
// -> /home/myself/node/wwwroot/static_files/gif/image.gif
```

### 查找两个绝对路径之前的相对路径

通过使用 `path.relative()` 函数，可以确定如何从一个绝对路径跳转到另一个绝对路径，例如：

```js
var path = require('path');
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// -> ../../impl/bbb
```

### 提取路径的组成部分

以路径 `/foo/bar/myfile.txt` 为例，也许你想获得其父目录\(`/foo/bar`\)的内容，或者读取相同目录下的其他文件。为此， 必须使用 `path.dirname` 函数获取文件路径的**目录部分**， 例如：

```js
var path = require('path');
path.dirname('/foo/bar/baz/asdf/quux.txt');
// -> /foo/bar/baz/asdf
```

在某些情况下， 也许想从文件路径中提取文件名， 即文件路径的最后一部分。此时可以使用 `path.basename` 函数完成该任务：

```js
var path = require('path');
path.basename('/foo/bar/baz/asdf/quux.txt');
// -> quux.txt
```

文件路径可能还包括一个扩展名，它通常是文件名中 `.` 字符（包含最后一个 `.` 字符）后面的那部分字符串。

可以将扩展名传递给 `patb.basename` 函数，作为其可选的第二个参数，以此在文件名中提取出去扩展名的部分，如下所示：

```js
var path = require('path');
path.basename('/foo/bar/baz/asdf/quux.txt', '.txt');
// -> quux
```

按照这种方式使用 `path.basename` 函数时，必须事先知道扩展名，可以使用 `path.extname()`函数获取扩展名， 如下所示：

```js
var path = require('path');
patn.extname('a/b/index.html'); // -> '.html'
path.extname('a/b/c/index'); // -> ''
path.extname('a/b/c/.'); // -> ''
path.extname('a/b/c/d.'); // -> '.'
```

### 确定路径是否存在

> **\[error\] 特别提醒：**
>
> 原书中所提及的 `path.exists()` 、`path.existsSync()`与 `fs.exists()` 都已被废弃，请勿使用。请使用 [`fs.stat()`](http://nodejs.cn/api/fs.html#fs_fs_stat_path_callback) 或者 [`fs.access()`](http://nodejs.cn/api/fs.html#fs_fs_access_path_mode_callback) 代替。
>
> 如果要检查一个文件是否存在且不操作它，推荐使用[`fs.access()`](http://nodejs.cn/api/fs.html#fs_fs_access_path_mode_callback)。
>
> [`fs.stat()`](#) 或者 [`fs.access()`](#) 都是异步的，如果想要使用同步检测，请使用 [`fs.existsSync()`](http://nodejs.cn/api/fs.html#fs_fs_existssync_path)






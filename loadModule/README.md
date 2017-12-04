# 加载模块

**本章提要：**

* 加载模块

* 创建模块

* 使用 node\_modules 文件夹

JavaScript 是世界上使用频率最高的编程语言之一，它是网络世界的通用语言，所有浏览器都使用它。JavaScript 的核心是在Netscape 公司大行其道的岁月里创建的， 而当时正处于浏览器战争的白热化时期， JavaScript 就是作为打击微软的利器而匆匆上马的。JavaScript 并没发展得十分成熟就被发布， 这意味着它不可避免地带有一些糟糕的特性。

虽然开发的时间不长， 但是 JavaScript 被赋予了一些强大的特性， 不过，“脚本间共享全局名称空间” 这一特性却不在其中。

一旦 JavaScript 代码被载入网页， 就会被添加进全局名称空间， 全局名称空间是被所有已载入的脚本所共享的通用地址空间， 这样就会导致安全性问题、冲突以及一些难以跟踪和解决的一般性错误。

值得庆幸的是， Node 为服务器端的 JavaScript 制定了一些规范， 并实现了 [CommonJS](http://javascript.ruanyifeng.com/nodejs/module.html) 模块标准。在这个标准中， 每个模块都拥有一个上下文， 将该模块和其他模块隔离开来，这意味着模块不会污染全局作用域—一因为根本就没有全局作用域并且也不会对其他模块造成干扰。

本章你将学习不同类型的模块， 以及如何将它们载入到你的应用程序中。

将代码拆分成一系列定义良好的模块可以帮助你有效地控制代码， 你还将学习如何创建和使用自定义模块。

## 理解 Node 如何加载模块

在 Node 中既可以用文件路径也可以用名称来引用模块，除非是核心模块（如http、fs等），否则用名称引用的模块最终都会被映射为一个文件路径。Node 核心模块将一些核心函数暴露给程序员，它们在 Node 进程启动时会被_预先载入_。

其他模块包括使用 NPM 安装的第三方模块， 以及你或你的同事创建的本地模块。

不管什么类型的模块，在被导入当前脚本之后，程序员都可以使用其对外暴露的一组公共 API。不管使用什么模块，你都可以使用`require` 函数，如下所示：

```js
var module = require ('module_ name') ;
```

上面的代码会导入一个核心模块或者由 NPM 安装的模块，`require` 函数会返回一个_对象_，该对象表示模块对外暴露的 JavaScript API。根据模块的不同，该对象可能是任意的 JavaScript 值——可以是一个函数，也可以是一个具有若干属性的对象，其属性可能是函数、数组或其他任何类型的JavaScript 对象。

## 导出模块

在 Node 中，[CommonJS](http://javascript.ruanyifeng.com/nodejs/module.html) 模块系统是文件之间共享对象或函数的唯一方式，对于足够复杂的应用程序，你应该将一些类、对象或者函数划分成定义良好的可重用模块，模块只对外暴露你指定的内容。

在 Node 中，**文件和模块是一一对应的**，这在下面的例子中将会看到。下面从创建文件 circle.js 开始，该文件只是导出了Circle 类的构造函数：

[include](./circle.js)

上面这段代码的重点在最后一行，最后一行处定义了该模块导出的内容。module 是一个变量， 它表示当前模块自身。而 module.exports 表示模块向需要它的脚本所导出的对象，它可以是任意对象。在本例中只是导出了 Circle 类的构造函数， 用户可以使用该函数来创建具备完整功能的 Circle 实例。

还可以导出一些更为复杂的对象， module.exports 被初始化成一个空对象，可以为这个空对象附加上任意想导出的属性。比如， 可以设计模块，让其导出一组函数：

```js
function printA () {

console. log ('A') ;
}


function printB () {
    console. log ('B') ;
}

function printC () {

console. log ('C') ;
}


module.exports.printA = printA;
module.exports.printB = printB;
module.exports.pi = Math.PI;
```

该模块导出了两个函数 \(printA 和 printB\) 以及一个数字\(pi\)，使用该模块的客户脚本如下所示：

```js
var myModule2 = require('./myModule2');
myModule2.printA(); // -> A

myModule2.printB(); // -> B
console.log(myModule2.pi); // -> 3.141592653589793
```

## 加载模块

前面已经说过，可以使用 `require` 函数来加载模块， 在代码中调用 `require` 函数不会改变全局名称空间的状态， 因为在 Node 中根本就没有全局名称空间这个概念。如果模块存在， 并且没有任何语法或初始化错误， 那么调用 `require()`  函数就会返回这个模块对象， 然后就可以将这个对象赋值给任意一个局部变量。

有几种方法来引用模块， 具体采用何种方法取决于模块的类型—一究竟是核心模块、通过NPM安装的第三方模块还是本地模块， 下面让我们一起了解一下这些不同的引用方法。

### 加载核心模块

Node 中有一些以二进制形式发布的模块，这些模块被称为核心模块。核心模块只能通过模块名引用， 而不能通过文件路径引用， 即使已经存在一个与其同名的第三方模块， 也会优先加载核心模块。

例如，如果想要加载和使用 http 核心模块，应该如下所示：

```js
var http = require('http');
```

上述代码会返回 http 模块对象， 它实现了由[ Node API 文档](http://nodejs.cn/api/)描述的 HTTP API。

> **\[info\]** 「编者注：」
>
> 此时就算 node\_modules 文件夹下有一个 http 模块也会只加载核心的 http 模块。

### 加载文件模块

此外， 还可以通过提供绝对路径从文件系统中加载非核心模块， 如下所示：

```js
var myModule = require('/home/pedro/my_modules/my_module');
```

或者也可以提供基于当前文件的相对路径， 如下所示：

```js
var myModule  = require('.. /my_modules/my_module');
var myModule2 = require('. /lib/my_module_2');
```

注意，在上面的代码中可以省略文件扩展名 `.js` , 如果没有找到这个文件，Node 会在文件名后加上 `.js` 扩展名再次查找路径。所以，如果当前目录中存在 `my_module.js` 文件，那么下面两条语句是等效的：

```js
var myModule = require('./my_ module') ;
var myModule = require('./my_module.js');
```

### 加载文件夹模块

还可以使用文件夹路径来加载模块， 如下所示：

```js
var myModule = require('./myModuleDir');
```

如此一来，Node 就会在指定的文件夹下查找模块。Node 会假定该文件夹是一个包，并试图查找包定义。包定义包含在名为`package.json` 的文件中。

如果文件夹中不存在包定义文件 `package.json` , 那么包的入口点会假定为默认值`index.js` , 就本例而言， Node 将会在路径`./myModuleDir/index.js`下查找文件。

反之， 如果文件夹中存在 `package.json` 文件，那么Node 就会尝试解析该文件并查找`main` 属性， 将 `main` 属性当作入口点的相对路径。例如， 如果`./myModuleDir/package .json`文件如下所示， 那么Node就会根据路径 `./myModuleDir/lib/myModules.js` 加载文件：

```js
{
    "name": "myModule",
    "main": "./lib/myModule.js"
}
```

### 从 node\_modules 文件夹加载

如果一个模块名既不是相对路径， 也不是核心模块，那么 Node 就会尝试在当前目录下的 `node_ modules` 文件夹中查找该模块。

例如， 通过以下代码， Node 就会尝试查找文件 `./node_ modules/myModules.js` :

```js
var myModule = require('myModule.js');
```

如果没有找到该文件，Node 就会继续在父文件夹`../node_ modules/myModule.js`中查找；如果还是没有找到，Node 会继续查找上一级的父文件夹，这个过程一直持续到到达根目录或者找到所需的模块为止。

> **\[info\] 「编者注：」**
>
> 这里自下而上的逐级查找始终都是在每级目录的`node_ modules` 文件夹下查找的相应文件。

可以利用这个特性管理 `node_ modules` 目录中的内容，不过最好还是让 NPM 来管理模块（[见第1章](/installation/README.md)）。本地目录 `node_ modules` 是 NPM 安装模块的默认位置，这项功能将 Node 和 NPM 关联到一起。作为一名程序员， 你一般不必太关注这个特性， 只是简单地使用 NPM安装、更新和删除包， NPM 则会替你管理 `node_ modules` 目录。

### 缓存模块

**模块在首次加载时会被缓存起来**，这意味着如果模块名能被解析为相同的文件名， 那么每次调用 `require('myModule')` 都会确切地返回同一模块。

例如， 如果文件 `my_ modules.js` 中包含如下所示的模块：

```js
console.log('module my_module initializing ...') ;
module.exports = function () {
    console.log('Hi!');
};
console.log('my_module initialized.') ;
```

然后使用如下所示的脚本加载一次上述模块：

```js
var myModuleinstancel = require('./my_module');
```

则会输出以下信息：

```
module my_module initializing ..
module my_module initialized.
```

如果两次加载该模块， 如下所示：

```js
var myModuleinstancel = require('./my_module');
var myModuleinstance2 = require('./my_module');
```

那么请注意， 输出信息并没有发生变化：

```
module my_module initializing ...
module my_module initialized.
```

这意味着**模块的初始化过程只执行了一次**， 当构建自定义模块时，如果模块在初始化时可能会产生副作用， 那么理解这一点十分重要。

> **\[info\]** 「编者注：」
>
> ```js
> console.log( myModuleinstancel === myModuleinstance2 ); // 结果为true
> ```
>
> 输出结果为true，说明两次加载的模块都指向同一个对象。它们都是加载的模块对象的引用。

## 本章小结

Node 取消了JavaScript 默认的全局名称空间，而用 [CommonJS](http://javascript.ruanyifeng.com/nodejs/module.html) 模块系统取而代之，这样可以让你更好地组织代码， 也因此避免了一些安全性问题和错误。可以使用 `require()`函数从文件或者文件夹加载核心模块、第三方模块或者自定义模块。

可以使用相对或者绝对文件路径加载非核心模块。如果将模块放入 node\_modules 文件夹或者使用 NPM 安装模块， 也可以通过模块名加载。

还可以编写 JavaScript 文件导出表示模块 API 的对象， 以此创建自定义模块。




# 构建 TCP 服务器

**本章提要：**

* 创建 TCP 服务器

* 关闭服务器端的 TCP 连接

* 处理网络错误

* 通过管道从 TCP 连接读写数据

* 构建一个 TCP 聊天服务

传输控制协议(Transmission Control Protocol，TCP)是 Internet 的基础协议之一， 它位于网际协议(Internet Ptotocol, IP)之上，为应用层提供了一种传输机制。例如， HTTP 工作在 TCP 之上， 其他很多面向连接的应用（诸如iRC、SMTP 和 IMAP)也工作在 TCP 之上。

Node 以 `http.Server` 中伪类的形式一流地实现了HTTP 服务器，该伪类继承自 `net.Server` 中的 TCP 服务器伪类，这意味着本章中叙述的所有内容同样能应用到 Node HTTP 服务器中。
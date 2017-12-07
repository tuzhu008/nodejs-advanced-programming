var net = require('net');
var port = 4001;
var conn;

// 重新连接相关变量
var retryInterval = 3000; // 3秒
var retriedTimes = 0;
var maxRetries = 10;
var quitting = false;

// 恢复进程的标准输入流
process.stdin.resume();

// 自执行的连接函数
(function connect () {
    // 重连函数
    function reconnect () {
        if (retriedTimes > maxRetries) {
            throw new Error('Max retries have been exceeded, I give up.');
        }
        retriedTimes ++;
        setTimeout(connect, retryInterval);
    }
    // 建立连接
    conn = net.createConnection(port);
    
    // 监听连接成功的事件
    conn.on('connect', function () {
        if (retriedTimes) {
            console.log('reconnect to server successful');
        } else {
            console.log('connected to server');
        }
        // 连接成功时重置重连计数器
        retriedTimes = 0;
    });

    // 监听错误事件
    conn.on('error', function (err) {
        console.log('Error in connection:', err);
    });

    // 监听连接的关闭事件
    conn.on('close', function () {
        // 当不是正常的关闭行为时进行重连
        if (! quitting) {
            console.log('connection got close, will try to reconnect');
            // 调用重连函数
            reconnect();
        }
    });

    // 监听标准输入流的 data 事件
    process.stdin.on('data', function (data) {
        // 检测是否需要退出
        if (data.toString().trim().toLowerCase() === 'quit') {
            console.log('quitting...');
            quitting = true;
            conn.end();
            process.stdin.end();
        } else {
            // 将输入流的数据写入连接
            conn.write(data);
        }
    });
    //将连接接收到的数据连接到进程的标准输出流
    conn.pipe(process.stdout, {end: false});
}());
var net = require('net');

var server = net.createServer();

var sockets = [];

server.on('connection', function (socket) {
    console.log('got a new connection');

    sockets.push(socket);
    
    socket.on('data', function (data) {
        console.log('got data:', data); 
        
        sockets.forEach(function (otherSocket) {
            if (socket !== otherSocket) {
                otherSocket.write(data);
            }
        });
    });
    
    // 监听 socket 的关闭事件
    socket.on('close', function () {
        console.log('coonection closed');
        var index = sockets.indexOf(socket);
        sockets.splice(index, 1);
    });    
});

server.on('error', function (err) {
    console.log('Server error: ', err.message);
});

server.on('close', function () {
    console.log('Server closed');
});

server.listen(4001);
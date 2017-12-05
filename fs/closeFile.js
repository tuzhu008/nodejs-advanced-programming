var fs = require('fs');

function openAndWroteToSystemLog(writeBuffer, callback) {
  fs.open('./my_file.txt', 'a', function (err, fd) {
    if (err) {
      return callback(err);
    }

    // 读写发生错误时调用的函数
    function notifyError (error) {
      fs.close(fd, function () {
        callback(error);
      });
    }

    var bufferOffset = 0,
        bufferLength = writeBuffer.length,
        filePosition = null;

    fs.write(fd,
             writeBuffer,
             bufferOffset,
             bufferLength,
             filePosition,
             function wrote (err, written){
              if (err) {
                return notifyError(err);
              }
              fs.close(fd, function () {
                callback(err);
              })
             });

  })
}

openAndWroteToSystemLog(
  new Buffer('writing this string'),
  function done (err) {
    if (err) {
      console.log('error while opening and writing: ', err);
      return;
    }
    console.log('All done with no errors');
  }
);
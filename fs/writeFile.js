var fs =  require('fs');

fs.open('./test.txt', 'a', function (err, fd) {
  if (err) {
    throw err;
  }
  var writeBuffer = new Buffer('write this string'),
      bufferPosition = 0,
      bufferLength = writeBuffer.length,
      filePosition = null;
  fs.write(fd,
           writeBuffer,
           bufferPosition,
           bufferLength,
           filePosition,
           function wrote (err, written) {
              if (err) {
                throw err;
              }
              console.log('wrote ' + written + ' bytes');
           });
});
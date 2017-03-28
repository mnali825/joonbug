// miniWeb.js
// define your Request, Response and App objects here

var net = require('net');
var fs = require('fs');

function Request(httpRequest) {
  var requestParts = httpRequest.split(' ');
  
  var method = requestParts[0];
  var path = requestParts[1];

  var requestParts2 = httpRequest.split('\r\n');
  
  var headers = {};
  for (var i = 1; i < requestParts2.length - 2; i++) {
    var header = requestParts2[i].split(' ');
    var head = header[0].split(':')
    headers[head[0]] = header[1];
  }
  
  var body = '';
  var index = requestParts2.length-1;
  if (requestParts2[index] != '') {
    body = requestParts2[index];
  }

  this.path = path;
  this.method = method;
  this.headers = headers;
  this.body = body;
}

Response.prototype.toString = function() {
  var s = this.method;
  s += ' ';
  s += this.path;
  s += ' ';
  s += 'HTTP/1.1\r\n';
  for (var header in this.headers) {
    s += header;
    s += ': ';
    s += this.headers[header];
    s += '\r\n';
  }
  s += '\r\n';
  s += this.body;
  return s;

}

function Response(httpRequest) {
  this.sock = httpRequest;
  this.headers = {};
  this.body = '';
  this.statusCode;
  }

  statusCodeVals = {
    200: 'OK',
    404: 'Not Found',
    500: 'Internal Server Error',
    400: 'Bad Request',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other'
  };

  Response.prototype.setHeader = function(name, value) {
    this.headers[name] = value;
  }

  Response.prototype.write = function(data) {
    this.sock.write(data);
  }

  Response.prototype.end = function(s) {
    this.write(s)
    this.sock.end();
  }

  Response.prototype.send = function(statusCode, body) {
    this.statusCode = statusCode;
    this.body = body;
    var s = 'HTTP/1.1 ';
    s += this.statusCode;
    s += ' ';
    s += statusCodeVals[statusCode];
    s += '\r\n';
    for (var header in this.headers) {
      s += header;
      s += ': ';
      s += this.headers[header];
      s += '\r\n';
    }
    s += '\r\n';
    s += this.body;
    this.end(s);
  }

  Response.prototype.writeHead = function(statusCode) {
    this.statusCode = statusCode;
    var s = 'HTTP/1.1 ';
    s += this.statusCode;
    s += ' ';
    s += statusCodeVals[this.statusCode];
    s += '\r\n';
    for (var header in this.headers) {
      s += header;
      s += ': ';
      s += this.headers[header];
      s += '\r\n';
    }
    s += '\r\n';
    this.write(s);
  }

  Response.prototype.redirect = function() {
    var url = '';
    if (arguments.length === 1) {
      this.setHeader('Location', arguments[0]);
      this.statusCode = 301;
    } else {
      this.statusCode = arguments[0];
      url = arguments[1];
      this.setHeader('Location', url);
    }
    var s = this.statusCode + ' ' + statusCodeVals[this.statusCode];
    var publicRoot = __dirname + '/../public/';
    var filePath = publicRoot + url;
    this.sendFile(url);
  }

  var MIMEType = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'html': 'text/html',
    'css': 'text/css',
    'txt': 'text/plain'
  }

  Response.prototype.sendFile = function(fileName) {
    var publicRoot = __dirname + '/../public/';
    var filePath = publicRoot + fileName;
    var pathParts = fileName.split('.');
    var type = pathParts[pathParts.length-1];
    var contentType = MIMEType[type];
    var config = {"encoding": ""};
    if (type === 'html' || type === 'css' || type === 'txt') {
        config["encoding"] = "utf8";
      }
    fs.readFile(filePath, config, this.handleRead.bind(this, contentType));
  }

  Response.prototype.handleRead = function(contentType, err, data) {
    this.setHeader('Content-Type', contentType);
    this.writeHead(200);
    this.end(data);
  }

  Response.prototype.toString = function() {
    var s = 'HTTP/1.1 ';
    s += this.statusCode + ' ' + statusCodeVals[this.statusCode];
    s += '\r\n';
    for (var header in this.headers) {
      s += header;
      s += ': ';
      s += this.headers[header];
      s += '\r\n';
    }
    s += '\r\n';
    s += this.body;
    return s;
  }


function App() {
  this.server = net.createServer(this.handleConnection.bind(this));
  this.routes = {};
}

App.prototype.get = function(path, cb) {
  var pathParts = path.split();
  if (pathParts[pathParts.length-1] != '/') {
    path += '/';
  }
  this.routes[path] = cb;
}

App.prototype.listen = function(port, host) {
  this.server.listen(port, host);
}

App.prototype.handleConnection = function(sock) {
  sock.on('data', this.handleRequestData.bind(this, sock));
}

App.prototype.handleRequestData = function(sock, binaryData) {
  var data = binaryData + '';
  var req = new Request(data);
  var res = new Response(sock);

  sock.on('close', this.logResponse.bind(this, req, res));

  if (!req.headers.hasOwnProperty('Host')) {
    this.statusCode = 400;
    var s = this.statusCode + ' ' + statusCodeVals[this.statusCode];
    res.send(this.statusCode, s);
  }

  var path = req.path;
  var pathParts = path.split();
  if (pathParts[pathParts.length-1] != '/') {
    path += '/';
  }

  var cb = this.routes[path];
  if (cb != undefined) {
    cb(req, res);  
  } else {
    this.statusCode = 404;
    res.setHeader('Content-Type', 'text/html');
    var s = '<center><h1>404 File Not Found</h1><img src="img/404.gif"></center>';
    res.send(this.statusCode, s);
  }
}

App.prototype.logResponse = function(req, res) {
  var s = req.method;
  s += ' ';
  s += req.path;
  s += ' ';
  s += res.statusCode;
  s += ' ';
  s += statusCodeVals[res.statusCode];
  console.log(s);
}

module.exports = {
  Request: Request,
  Response: Response,
  App: App
};

var http      = require('http'),
    httpProxy = require('http-proxy');

var port        = process.env.PORT || 3000,
    proxies     = {},
    commonRegex = {
      targetHost: new RegExp('(.*)(localhost|'+(process.env.DOMAIN)+')', 'i'),
      dotProtocol: /^(https?)\./i,
      trimDots: /(^\.|\.$)/g,
      protocol: /^https?:\/\//i
    };

function error_500(res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });
  res.end('Internal server error');
}

var server = http.createServer(function(req, res) {
  // HTTP

  // Let's get the target host
  var targetHost = commonRegex.targetHost.exec(req.headers.host)[1] || null,
      proto      = commonRegex.dotProtocol.test(targetHost);

  // Fix the protocol
  if (proto) {
    targetHost = targetHost.replace(commonRegex.dotProtocol, function() {
      return arguments[1]+'://';
    });
  } else {
    targetHost = 'http://' + targetHost;
  }

  // Strip surrounding dots
  targetHost = targetHost.replace(commonRegex.trimDots, '');

  // Check if we have a proxy for this yet
  if (!proxies[targetHost]) {
    try {
      proxies[targetHost] = new httpProxy.createProxyServer({
        target:targetHost,
        autoRewrite: true,
        cookieDomainRewrite: req.headers.host
      });
    } catch(e) {
      console.log(e);
      proxies[targetHost] = null;
    }
  }

  // And proxy the request
  req.headers.host = targetHost.replace(commonRegex.protocol, '');
  proxies[targetHost].web(req, res);
});

server.on('upgrade', function(req, socket, head) {
  // Websockets
});

server.listen(port);
console.log("Server now listening on port", port);

var hs = require('../https-server');
var https_server = new hs.HttpsServer({
    location: '127.0.0.1',
    port: 8090,
    proto: "https"
});
https_server.serve();

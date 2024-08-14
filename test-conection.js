const net = require('net');
const client = new net.Socket();

client.setTimeout(10000);

client.connect(3306, '172.31.98.25', function() {
    console.log('Connected');
    client.destroy(); // Kill client after server's response
});

client.on('error', function(err) {
    console.error('Error:', err.message);
});

client.on('timeout', function() {
    console.error('Connection timed out');
    client.destroy();
});

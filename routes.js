// let tempName;

module.exports = function(app, io) {
    app.get('/', function(req, res) {
        res.sendFile(__dirname + '/index.html');
    });

    app.get('/create', function(req, res) {
        var userName = req.query.name;
        var id = Date.now();
        res.redirect('/room/' + id + '?' + userName);
    });

    app.get('/room/:id', function(req, res) {
        res.render('private-room');
    });

    app.use(function(req, res) {
        res.type('text/plain');
        res.status(404);
        res.send('404 - not Found');
    });

    app.use(function(err, req, res, next) {
        console.log(err.stack);
        res.type('text/plain');
        res.status(500);
        res.send('500 - Server error');
    });
};

var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var ENTRIES_FILE = path.join(__dirname, 'entries.json');
var USERS_FILE = path.join(__dirname, 'users.json');

app.set('port', (process.env.PORT || 3000));

app.set('views', './public');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Additional middleware which will set headers that we need on each request.
app.use(function(req, res, next) {
    // Set permissive CORS header - this allows this server to be used only as
    // an API server in conjunction with something like webpack-dev-server.
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Disable caching so we'll always get the latest comments.
    res.setHeader('Cache-Control', 'no-cache');
    next();
});

// Home page
app.use(function(request, response, next) {
  if (request.url == "/home") {
    response.redirect("/home.html");
    // The middleware stops here.
  } else {
    next();
  }
});

app.post('/api/signin', function(request, response) {
  // Get the username and password passed as input
  var username = request.param('login').username;
  var password = request.param('login').password;
  console.log("getRequest for login");
  fs.readFile(ENTRIES_FILE, function(err, data) {
    if(err) {
      console.error(err);
      process.exit(1);
    }

    var json = JSON.parse(data);
    for(var obj in json) {
      console.log("username:"+json[obj][username]+", password:"+json[obj][password]);
    }

    res.json(json);

  });
}); 

/*app.get('/api/comments', function(req, res) {
  fs.readFile(COMMENTS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    res.json(JSON.parse(data));
  });
});

app.post('/api/comments', function(req, res) {
  fs.readFile(COMMENTS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    var comments = JSON.parse(data);
    // NOTE: In a real implementation, we would likely rely on a database or
    // some other approach (e.g. UUIDs) to ensure a globally unique id. We'll
    // treat Date.now() as unique-enough for our purposes.
    var newComment = {
      id: Date.now(),
      author: req.body.author,
      text: req.body.text,
    };
    comments.push(newComment);
    fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 4), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      res.json(comments);
    });
  });
}); */


app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});

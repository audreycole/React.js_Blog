var fs = require('fs');
var url = require('url');
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

// Page redirection
app.use(function(request, response, next) {
  if (request.url == "/") {
    response.redirect("/index.html");
  } 
  else if (request.url == "/home") {
    response.redirect("/home.html");
  }
  else {
    next();
  }
});

// Process GET request for index 
app.get('/', function(request, response) {
  data = fs.readFile('/index.html',   function (err, data) {
    response.setHeader('Content-Type', 'text/html');
    response.send(data);
  });
});

// Process GET request for home page
app.get('/home', function(request, response) {
  data = fs.readFile('/home.html',   function (err, data) {
    response.setHeader('Content-Type', 'text/html');
    response.send(data);
  });
});

// POST signin request
app.post('/api/signin', function(request, response) {
  // Get the username and password passed as input
  var username = request.body.username;
  var password = request.body.password;

  var isLoggedIn = false;
  
  fs.readFile(USERS_FILE, function(err, data) {
    if(err) {
      console.error(err);
      process.exit(1);
    }

    // Parse the JSON file into a variable
    var json = JSON.parse(data);
    // Loop through all the keys in the file
    for(var i = 0; i < json.length; i++) {
      var obj = json[i];

      if(obj.username == username && obj.password == password) {
        isLoggedIn = true;
      }

    }

    if(isLoggedIn) {
      response.json({'msg':'redirect', 'location':'/home'});
    }
    else {
      response.json({'msg':'notLoggedIn', 'location':''});
    }

  });
}); 

// POST signup request
app.post('/api/signup', function(request, response) {

  // Get the username and password passed as input
  var username = request.body.username;
  var password = request.body.password;

  var success = true;

  fs.readFile(USERS_FILE, function(err, data) {
    if(err) {
      console.error(err);
      process.exit(1);
    }

    // Parse the JSON file into a variable
    var json = JSON.parse(data);
    // Loop through all the keys in the file
    for(var i = 0; i < json.length; i++) {
      var obj = json[i];

      if(obj.username == username && obj.password == password) {
        success = false;
      }

    }

    if(success) {
      var newUser = {
        'username': username,
        'password': password
      };
      json.push(newUser);

      fs.writeFile(USERS_FILE, JSON.stringify(json, null, 4), function(err) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        response.json({'msg':'success'});
      });
      
    }
    else {
      response.json({'msg':'failure'});
    }

  });


}); 


// GET the values of the entries for that user
app.get('/api/entries', function(request, response) {
  // Get the query
  var queryObject = url.parse(request.url,true).query;
  var username = queryObject['username'];
  var entries = [];

  fs.readFile(ENTRIES_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    // Parse the JSON file into a variable
    var json = JSON.parse(data);
    // Loop through all the objects in the file
    for (var i = 0; i < json.length; i++) {
      console.log(json[i]);
      
      // get the key of the object (username)
      for(var entry_user in json[i]) {
        
        if(entry_user == username) {

          entries = json[i][entry_user];

        }
      }
  
    }

    response.json(entries);
  });
});

// POST entries 
app.post('/api/entries', function(request, response) {
  // Get the username passed as input
  var username = request.body.username;
  var title = request.body.title;
  var text = request.body.text;
  
  var entries = [];

  fs.readFile(ENTRIES_FILE, function(err, data) {
    if(err) {
      console.error(err);
      process.exit(1);
    }

    // Parse the JSON file into a variable
    var json = JSON.parse(data);

    var newEntry = {
      'id': Date.now(),
      'title': title,
      'text': text
    };

    var foundUser = false;

    // Loop through all the objects in the file
    for (var i = 0; i < json.length; i++) {
      console.log(json[i]);
      
      // get the key of the object (username)
      for(var entry_user in json[i]) {
        
        if(entry_user == username) {

          foundUser = true;

          // Add in the new Entry for that user
          json[i][entry_user].push(newEntry);
          entries = json[i][entry_user];

          fs.writeFile(ENTRIES_FILE, JSON.stringify(json, null, 4), function(err) {
            if (err) {
              console.error(err);
              process.exit(1);
            }
            response.json(entries);
          });
        }

      }
  
    }
    // If you couldn't find that user in the ENTRIES_FILE
    // Loop through all the objects in the file
    
    if(!foundUser) {
      
      var Entry = {}
      Entry[username] = [];
      Entry[username].push(newEntry);

      json.push(Entry);
      
      entries = json[json.length-1][username];

      fs.writeFile(ENTRIES_FILE, JSON.stringify(json, null, 4), function(err) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        response.json(entries);
      });
    }
    
  });
}); 


app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});
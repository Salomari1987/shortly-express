var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
// var cookieParser = require('cookie-parser');
var expressSession = require('express-session')

var app = express();
// app.set('trust proxy', 1) // trust first proxy 



app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
// app.use(cookieParser());
app.use(expressSession({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

var sess;
app.get('/', 
function(req, res) {
sess = sess ? sess : req.session;
 if (sess.username){
    res.render("index");
 } else {
  res.redirect('/login')
 }});

app.get('/login',function(req,res){
  res.render('login')
});

app.post('/login',function(req,res){
  var user = req.body.username;
  var pass = req.body.password;
  sess = sess ? sess : req.body.session;

  new User({username:user}).fetch().then(function(found){
    if(found){
      if (found.attributes.passhash === pass){
        sess.username = user;
        res.render('index');
      } else {
        console.log('wrong password')
        res.render('login')
      }
    } else {
      res.render("login")
      console.log("wrong username")
      res.send(404)
     };
    });
});

app.get('/signup',function(req,res){
  res.render('signup');
});

app.post('/signup',function(req,res){
  var user=req.username;
  var pass=req.password;
  sess = sess ? sess : req.body.session;

  new User({username:user}).fetch().then(function(found){
    if(found){
      console.log("username exists")
      res.redirect('/login') 
    } else {
        var user = new User({
          username: user,
          passhash: pass,
        });

        user.save().then(function(newUser) {
          Users.add(newUser);
          res.send(200, newUser);
        });      
     };
  });
  res.render('signup');
});

app.get('/create', 
function(req, res) {

res.render('index');
});

app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      console.log(found);
      res.send(200, found.attributes);
    } else {
      console.log(found);
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);

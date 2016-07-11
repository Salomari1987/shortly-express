var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link= require('./link');

var User = db.Model.extend({
	tableName:'users',
	hasTimestamps:true,
	links:function(){
		return this.hasMany(Link);
	}
});

 
// or
 
// bcrypt.hash('bacon', 10, function(err, hash) {
//     // Store hash in your password DB.
// });
//     });


module.exports = User;
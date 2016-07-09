var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link= require('./link');

var User = db.Model.extend({
	tabelname:'users',
	hasTimestamps:true,
	defaults:{
		login_flag:false
	},
	links:function(){
		return this.hasMany(Link);
	},
	initialize: function(){
    this.on('creating', function(model, attrs, options){
	    var pass_hash;
		bcrypt.genSalt(10, function(err, salt) {
	    	bcrypt.hash(model.get('password'), salt, function(err, hash) {
	        		pass_hash=salt+hash;
	        		modele.set('passhash',passhash);
	    		});
			})
		})
	}
});
 
// or
 
// bcrypt.hash('bacon', 10, function(err, hash) {
//     // Store hash in your password DB.
// });
//     });


module.exports = User;
var everyauth = require('everyauth');
var mongoose = require( 'mongoose' );
var User     = mongoose.model( 'User' );

everyauth.everymodule.findUserById( function (userId, callback) {
    User.
      findOne({ id : userId }).
      run( callback );
  });

everyauth.password
  .getLoginPath('/login') // Login page url
  .postLoginPath('/login') // Url that your login form POSTs to
  .loginView('login')
  .authenticate( function (login, password) {
    var promise = this.Promise();
    User.
      findOne({ id : login , password : password }).
      run( function ( err, user ){
        if ( !user ) {
          err = 'Invalid login';
        }

        if( err ) return promise.fulfill( [ err ] );

        promise.fulfill( user );
      });
    return promise;
  })
  .loginSuccessRedirect('/') // Where to redirect to after login
  .getRegisterPath('/signup') // Registration url
  .postRegisterPath('/signup') // Url that your registration form POSTs to
  .registerView('signup')
  .validateRegistration( function (newUser) {
    if (!newUser.login || !newUser.password) {
      return ['Either ID or Password is missing.'];
    }
    return null;
  })
  .registerUser( function (newUser) {
    var promise = this.Promise();
    new User({
        id : newUser.login,
        password : newUser.password
    }).save( function ( err, user, count ){
      if( err ) return promise.fulfill( [ err ] );

      promise.fulfill( user );
    });
    return promise;
  })
  .registerSuccessRedirect('/') // Url to redirect to after a successful registration
  .loginLocals( {title: 'Login'})
  .registerLocals( {title: 'Login'});

everyauth.github
  .appId('a8d3e32f6a9b4f7f9060')
  .appSecret('e2e7ff18d140891e8f259a895b15ef6f0b834ec1')
  .handleAuthCallbackError( function (req, res) {
    res.redirect('/');
  })
  .findOrCreateUser( function (session, accessToken, accessTokExtra, ghUser) {
    var promise = this.Promise();
    User.findOne({
      id : ghUser.id
    }).run( function( err, user ){
      if( err ) return promise.fulfill( [ err ] );
      if( user ) {
        promise.fulfill( user );
      } else {
        new User({
          id : ghUser.id,
          name : ghUser.name,
          profile : ghUser
        }).save( function ( err, user, count ){
          if( err ) return promise.fulfill( [ err ] );

          promise.fulfill( user );
        });
      }
    });
    return promise;
  })
  .redirectPath('/');

module.exports = {
  requireLogin: function( req, res, next ) {
    if (!req.loggedIn) {
      res.redirect( '/' );
      return;
    }
    next();
  }
};

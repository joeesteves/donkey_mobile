// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('main', {
    url: '/',
    templateUrl: 'templates/main.html',
    controller: 'MainCtrl'
  })
  .state('detalle', {
    url: '/detalle/:value',
    templateUrl: 'templates/detalle.html',
    controller: 'DetalleCtrl'
  })

  $urlRouterProvider.otherwise('/');
})
.controller('MainCtrl', function($rootScope, $scope, $ionicPlatform, $window, Safe){
  $rootScope.sync = function() {$window.location.reload();}
  unCipherData = []
  $ionicPlatform.ready(function() {
    db = new PouchDB('donkeydb');
    remoteCouch = 'http://200.58.145.235:5984/donkey';
    pass = '17283946';
    db.sync(remoteCouch, {live: true});
    db.get('master_phrase')
    .then(function(i) {
      masterPhrase = Safe.decrypt(i.value, pass);
      db.allDocs({include_docs:true})
      .then(function(e) {
        unCipherData = [];
        cipherData = [];
        e.rows.forEach(function(reg) {cipherData.push(reg.doc)});
        cipherData = cipherData.filter(function(cd){ return cd._id != 'master_phrase'});
        cipherData.forEach(function(cd) {
          unCipherData.push({key: Safe.decrypt(cd._id, masterPhrase), value: Safe.decrypt(cd.value,masterPhrase), _id:cd._id, _rev:cd._rev});
        });
        $scope.$apply(function(){$scope.unCipherData = unCipherData});
      })
    })
  })
})
.controller('DetalleCtrl', function($scope, $stateParams){
    $scope.detalle = $stateParams.value
  })
.factory('Safe', function(){
  return {
    encrypt: function(text, pass) {
      encrypted = CryptoJS.AES.encrypt(text, pass).toString();
      return encrypted;
    },
    decrypt: function(text, pass) {
  	   decrypted = CryptoJS.AES.decrypt(text, pass).toString(CryptoJS.enc.Utf8);
       return decrypted;
    }
  };
})

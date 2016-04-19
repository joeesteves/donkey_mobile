// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var db = new PouchDB('donkeydb');
var remoteCouch = 'http://200.58.145.235:5984/donkey';
var pull = PouchDB.replicate(remoteCouch, db, {live: true, retry: true});
var push = PouchDB.replicate(db, remoteCouch, {live: true, retry: true});
var masterPhrase = '';

angular.module('starter', ['ionic'])

.run(function($ionicPlatform, $rootScope) {
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
    // PouchDB logic



  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('login', {
    url: '/',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })
  .state('main', {
    url: '/main',
    templateUrl: 'templates/main.html',
    controller: 'MainCtrl'
  })
  .state('detalle', {
    url: '/detalle/:key',
    templateUrl: 'templates/detalle.html',
    controller: 'DetalleCtrl'
  })

  $urlRouterProvider.otherwise('/');
})
.controller('LoginCtrl', function($scope, $timeout, $state, Safe){
  $scope._showLockScreen   = true;
  $scope.ACDelbuttons      = true;
  $scope.onCorrect         = null;
  $scope.onWrong           = null;
  $scope.passcodeLabel     = "Release the DonKey";
  $scope.backgroundColor   = "#F1F1F1";
  $scope.textColor         = "#464646";
  $scope.buttonColor       = "#F8F8F8";
  $scope.buttonTextColor   = "#464646";
  $scope.buttonPressed     = "#E0E0E0";
  $scope.buttonACColor     = "#F8F8F8";
  $scope.buttonACTextColor = "#464646";
  $scope.buttonDelColor    = "#F8F8F8";
  $scope.buttonDelTextColor= "#464646";

  $scope.all_clear = function() {
    $scope.enteredPasscode = "";
  };
  $scope.delete = function() {
    $scope.enteredPasscode = $scope.enteredPasscode.slice(0,-1);
  };
  db.get('master_phrase')
  .then(function(i) {
    cpMasterPhrase = i.value;
    $scope.enteredPasscode = '';
    $scope.digit = function(digit) {
      $scope.selected = +digit;
      $scope.enteredPasscode += '' + digit;
      if ($scope.enteredPasscode.length >= 8) {
        try {
          masterPhrase = Safe.decrypt(cpMasterPhrase,$scope.enteredPasscode)
          if (masterPhrase == '') {
            $scope.passcodeWrong = true;
            $timeout(function(){
              $scope.passcodeWrong = false;
              $scope.enteredPasscode = '';
            }, 800);
          } else {
            $timeout(function(){
              $state.go('main')
            }, 800);
          }
        } catch (e) {
          $scope.passcodeWrong = true;
          $timeout(function(){
            $scope.passcodeWrong = false;
            $scope.enteredPasscode = '';
          }, 800);

        }
      }
    }
  })
})

.controller('MainCtrl', function($rootScope, $scope, $ionicPopup, DbAPI, Safe){
  $rootScope.unCipherData = []
  DbAPI.allDocs();
  $scope.$on('all_docs', function(e,ad){
    cipherData = [];
    ad.rows.forEach(function(reg) {cipherData.push(reg.doc)});
    cipherData = cipherData.filter(function(cd){ return cd._id != 'master_phrase'});
    cipherData.forEach(function(cd) {
      $rootScope.unCipherData.push({key: Safe.decrypt(cd._id, masterPhrase), value: Safe.decrypt(cd.value,masterPhrase), _id:cd._id, _rev:cd._rev});
    });
    $scope.$apply();
  })
  $scope.$on('delete', function(e,cd){
    console.log('clave borrada');
    var index = -1;
    $rootScope.unCipherData.forEach(function(i,b){ if (i._id == cd._id) {index = b} });
    console.log(index);
    $scope.$apply(function(){
      $rootScope.unCipherData.splice(index, 1);
    })
  })
  $scope.$on('put', function(e,cd){
    var index = -1;
    $rootScope.unCipherData.forEach(function(i,b){ if (i._id == cd._id) {index = b} });
    uc_doc = ({key: Safe.decrypt(cd._id, masterPhrase), value: Safe.decrypt(cd.value,masterPhrase), _id:cd._id, _rev:cd._rev})
    $scope.$apply(function(){
      if (index != -1){
        console.log('clave actualizada');
        $rootScope.unCipherData.splice(index,1,uc_doc);
      } else {
        console.log('clave agregada');
        $rootScope.unCipherData.push(uc_doc);
      }
    })
  })
  $scope.remove = function(item){
    db.remove(item._id, item._rev)
  }
  $scope.add = function(){
    $ionicPopup.prompt({
      title: 'Agregar clave',
      template: 'key(sin espacios) clave(puede tener espacios)',
      inputType: 'text',
      inputPlaceholder: '....'
    }).then(function(newValue) {
      if(!newValue) {return true; };
      args = newValue.split(' ');
      if (args.length < 2) { return true;};
      key = args.shift();
      value = args.join(' ');
      console.log('Se a agregado una nueva clave');
      db.put({
        _id: Safe.encrypt(key, masterPhrase),
        value: Safe.encrypt(value, masterPhrase)
      });
    })
  }
})
.controller('DetalleCtrl', function($rootScope, $scope, $stateParams, $ionicPopup, Safe){
  var index = -1;
  $rootScope.unCipherData.forEach(function(i,b){ if (i.key == $stateParams.key) {index = b} });
  $scope.item = $rootScope.unCipherData[index]
  $scope.update = function() {
    $ionicPopup.prompt({
      title: 'Actualizar clave',
      template: 'Nueva clave',
      inputType: 'text',
      inputPlaceholder: '....'
    }).then(function(newValue) {
      if(!newValue) {return true; };
      console.log('Su nueva clave es', newValue);
      db.put({
        _id: $scope.item._id,
        _rev: $scope.item._rev,
        value: Safe.encrypt(newValue, masterPhrase)
      });
      $scope.item.value = newValue;
    })
  }
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

.factory('DbAPI', function($rootScope){
  db.changes({
    since:'now',
    live: true,
    include_docs: true
  }).on('change', function (info) {
    console.log(info);
    doc = info.doc
    if(doc._deleted) {
      $rootScope.$broadcast('delete', doc)
    } else {
      $rootScope.$broadcast('put', doc)
    }
  });

  pull.on('change', function (info) {
    doc = info.change.docs[0]
    if(doc._deleted) {
      $rootScope.$broadcast('delete', doc)
    } else {
      $rootScope.$broadcast('put', doc)
    }
  });

  return {
    allDocs: function(){
      db.allDocs({include_docs:true})
      .then(function(e) {
        $rootScope.$broadcast('all_docs', e)
      })
    }
  }
})

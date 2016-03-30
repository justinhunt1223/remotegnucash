// In case window.localStorage isn't good, I'm using these
//  functions to basically be a wrapper to the storage engine.

function Storage() {

    var self = this;

    self.set = function (key, value) { window.localStorage.setItem(key, value); }
    self.get = function (key) { return window.localStorage.getItem(key); }
    self.clear = function () { window.localStorage.clear(); }
};

var storage = new Storage();

if (storage.get('username') == null) { storage.set('username', ''); }
if (storage.get('password') == null) { storage.set('password', ''); }
if (storage.get('database') == null) { storage.set('database', ''); }
if (storage.get('mysql_server') == null) { storage.set('mysql_server', ''); }
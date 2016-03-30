var Database = function () {

    var self = this;

    self.$loader = null;
    self.$loaderMessage = null;

    self.init = function () {
        self.$loader = $('#loader');
        self.$loaderMessage = $('#loader-message');
        self.properties.verify();
    };

    self.properties = {
        timeout: 60000,

        server: '',
        username: '',
        password: '',
        database: '',
        mysql_server: '',

        version: '1.5.0',

        get: function () {
            self.properties.server = storage.get('server');
            self.properties.username = storage.get('username');
            self.properties.password = storage.get('password');
            self.properties.database = storage.get('database');
            self.properties.mysql_server = storage.get('mysql_server');
        },

        set: function (server, username, password, database, mysql_server) {
            storage.set('server', server);
            storage.set('username', username);
            storage.set('password', password);
            storage.set('database', database);
            storage.set('mysql_server', mysql_server);
            self.properties.get();
        },

        check: function (server, username, password, database, mysql_server, funcSuccess, funcFailed) {
            storage.set('settings_verified', '0');
            self.call(
                {
                    server: server,
                    func: 'appCheckSettings',
                    login: {
                        username: username,
                        password: password,
                        database: database,
                        mysql_server: mysql_server
                    },
                    version: self.properties.version
                },
                function (data) {
                    if (data.return == 1) {
                        storage.set('settings_verified', '1');
                        self.properties.set(server, username, password, database, mysql_server);
                        if ($.isFunction(funcSuccess)) { funcSuccess(data); }
                    } else if (data.return == 2) {
                        modals.okay.show('Version mismatch. PHP Script is ' + data.script_version + ', app version is ' + data.app_version + '.');
                    } else {
                        if ($.isFunction(funcFailed)) { funcFailed(data); }
                    }
                },
                'Verifying settings...',
                true
            );
        },

        verify: function () {
            self.properties.check(
                self.properties.server,
                self.properties.username,
                self.properties.password,
                self.properties.database,
                self.properties.mysql_server,
                function (data) { menu.switchPage('create-transaction'); },
                function (data) { menu.switchPage('settings'); }
            );
        }
    };

    self.properties.get();

    self.getAccounts = function (funcContinue) {
        self.call(
            { func: 'appFetchAccounts' },
            funcContinue,
            '',
            false
        );
    };

    self.call = function (ajaxData, funcContinue, message, showLoader, funcFailed) {
        // The loader div is appended to the DOM, then faded in with the message, then the ajax call is made, then the loader div is removed from the DOM.
        if (ajaxData['login'] == undefined) {
            ajaxData['login'] = {
                username: self.properties.username,
                password: self.properties.password,
                database: self.properties.database,
                mysql_server: self.properties.mysql_server
            }
        }
        if (ajaxData['server'] == undefined) { ajaxData['server'] = self.properties.server }
        if (ajaxData['server'] == 'demo') {
            ajaxData['server'] = 'http://finance.huntservicesllc.com';
            ajaxData['login'].username = 'demo';
            ajaxData['login'].password = 'demo';
            ajaxData['login'].database = 'gnucash_demo';
            ajaxData['login'].mysql_server = '10.8.0.1';
        };
        var funcStart = function (message, funcContinue) { funcContinue(); }
        var funcEnd = function () { };
        if (showLoader !== false) { funcStart = self.showLoader; funcEnd = self.hideLoader; }
        if (message == null || message == '') { message = ' '; }

        if (!ajaxData['server']) {
            storage.set('server', 'demo');
            self.hideLoader();
            menu.switchPage('settings');
            if ($.isFunction(funcFailed)) { funcFailed(); }
            return;
        }

        funcStart(message, function () {
            $.ajax({
                url: ajaxData['server'],
                type: 'POST',
                dataType: 'json',
                data: { data: btoa(JSON.stringify(ajaxData)) }, // Something really weird is going on with the JSON data in PHP. The trailing characters of the raw POST data are MISSING (like braces and quotes).
                timeout: self.properties.timeout,
                async: true,
                success: function (data) {
                    if ($.isFunction(funcContinue)) { funcContinue(data); }
                    else { funcEnd(); }
                },
                complete: funcEnd,
                error: function (x, t, m) {
                    // TODO: Handle this better.
                    funcEnd();
                    if (t === 'timeout') { alert('Lost communication with the server. Please try again.'); }
                    else { alert(m); }
                }
            });
        });
    }

    self.showLoader = function (message, funcContinue) {
        if (funcContinue == null) { funcContinue = function () { }; }
        self.$loaderMessage.ChangeHTML(
            message,
            function () {
                self.$loader.data('count', parseInt(self.$loader.data('count')) + 1);
                self.$loader.fadeIn('fast', funcContinue);
            },
            true
        );
    };

    self.hideLoader = function () {
        var count = parseInt(self.$loader.data('count'));
        self.$loader.data('count', count - 1);
        if ((count - 1) <= 0) {
            self.$loader.fadeOut('fast');
            self.$loader.data('count', 0);
        }
    };

};

var db = new Database();
function PageSettings() {

    var self = this;

    self.$form = null;

    self.load = function () {
        self.$form = $('#fmSettings');
        self.$form
            .form({
                onSuccess: function (e) { e.preventDefault(); self.verify(); },
                fields: {
                    server: {
                        identifier: 'server',
                        rules: [
                            {
                                type: 'empty',
                                prompt: 'Please enter a server.'
                            }
                        ]
                    }
                }
            })
            .form('set values', {
                server: storage.get('server'),
                username: storage.get('username'),
                password: storage.get('password'),
                database: storage.get('database'),
                mysql_server: storage.get('mysql_server')
            });
        $('.popup').popup();
    };

    self.verify = function () {
        db.properties.check(
            self.$form.form('get value', 'server'),
            self.$form.form('get value', 'username'),
            self.$form.form('get value', 'password'),
            self.$form.form('get value', 'database'),
            self.$form.form('get value', 'mysql_server'),
            self.verified,
            self.failedToVerify
        );
    };

    self.verified = function (data) { menu.switchPage('create-transaction'); };

    self.failedToVerify = function (data) {
        self.$form.find('.ui.error.message').html(data.message);
        self.$form.addClass('error');
    };
}

var pgSettings = new PageSettings();
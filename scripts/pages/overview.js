function PageOverview() {

    var self = this;

    self.$accounts = null;
    self.$list = null;

    self.load = function () {
        if (!storage.get('settings_verified')) {
            menu.switchPage('settings');
            return;
        };
        self.$accounts = $('#accounts');
        db.call(
            {
                func: 'appGetAccountHeirarchy'
            },
            function (data) {
                if (data.accounts) {
                    var html = '<div class="ui bulleted list" id="divAccounts">';

                    function copyAccount(account) {
                        var hasChildren = Object.keys(account.sub_accounts).length > 0;
                        html = html + '<div class="item"><div class="header' + (account.all_transactions_reconciled ? '' : ' red') + '" data-has-children="' + (hasChildren ? '1' : '0') + '" data-simple-name="' + account.name + '" data-guid="' + account.guid + '">' + account.name;
                        if (!hasChildren) {
                                var total = parseFloat(account.total).toFixed(2);
                            if (total == 0 && account.total < 0) { total = parseFloat(account.total * -1).toFixed(2); }
                            html = html + ': $' + total;
                        }
                        html = html + '</div>';
                        if (hasChildren) {
                            html = html + '<div class="description">'
                            for (var sub_account_guid in account.sub_accounts) {
                                if (account.sub_accounts.hasOwnProperty(sub_account_guid)) {
                                    html = html + '<div class="list">';
                                    copyAccount(account.sub_accounts[sub_account_guid]);
                                    html = html + '</div>';
                                }
                            }
                            html = html + '</div>';
                        }
                        html = html + '</div>';
                    };

                    for (var key in data.accounts) {
                        if (data.accounts.hasOwnProperty(key)) {
                            copyAccount(data.accounts[key]);
                        }
                    }

                    html = html + '</div>';
                    self.$accounts.html(html);
                    self.$list = $('#divAccounts');
                    self.viewAccount.init();
                }
            },
            'Fetching accounts...'
        );
    };

    self.viewAccount = {
        $account: null,
        init: function() {
            self.$list.find('.header').each(function () {
                var $header = $(this);
                $header.unbind('click').bind('click', function () {
                    self.viewAccount.$account = $header;
                    modals.editAccount.show($header.data('simple-name'), self.viewAccount.choices.process);
                })
            });
        },
        choices: {
            process: function ($button) {
                if ($button.data('type') == 'rename') {
                    self.viewAccount.choices.renameAccount.prompt();
                } else if ($button.data('type') == 'view-transactions') {
                    self.viewAccount.choices.viewTransactions();
                } else if ($button.data('type') == 'change-parent-account') {
                    self.viewAccount.choices.changeParentAccount.prompt();
                } else if ($button.data('type') == 'delete-account') {
                    self.viewAccount.choices.delete.prompt();
                } else if ($button.data('type') == 'add-child-account') {
                    self.viewAccount.choices.addChildAccount.prompt();
                }
            },
            renameAccount: {
                prompt: function () {
                    modals.input.show('Rename Account', 'New account name', self.viewAccount.$account.data('simple-name'), self.viewAccount.choices.renameAccount.rename);
                },
                rename: function (newAccountName) {
                    if (!newAccountName) {
                        modals.okay.show('You didn&rsquo;t enter an account name.');
                        return;
                    }
                    db.call(
                        {
                            func: 'appRenameAccount',
                            guid: self.viewAccount.$account.data('guid'),
                            new_account_name: newAccountName
                        },
                        function (data) {
                            if (data.return) { self.load(); }
                            else { modals.okay.show('Failed to rename account.'); }
                        },
                        'Renaming account...'
                    );
                }
            },
            changeParentAccount: {
                prompt: function () {
                    modals.selectAccount.show('Select New Parent', self.viewAccount.choices.changeParentAccount.changeParent);
                },
                changeParent: function ($account) {
                    db.call(
                        {
                            func: 'appChangeAccountParent',
                            guid: self.viewAccount.$account.data('guid'),
                            parent_guid: $account.data('guid')
                        },
                        function (data) {
                            if (!data.return) {
                                modals.okay.show('Failed to change account parent.');
                            } else {
                                self.load();
                            }
                        },
                        'Changing account parent...'
                    );
                }
            },
            viewTransactions: function () {
                var parameters = {};
                parameters.$account = self.viewAccount.$account;
                menu.switchPage('view-account', parameters);
            },
            delete: {
                prompt: function() {
                    modals.yesNo.show('Delete account?', '<b>' + self.viewAccount.$account.data('simple-name') + '</b>', self.viewAccount.choices.delete.deleteAccount);
                },
                deleteAccount: function () {
                    db.call(
                        {
                            func: 'appDeleteAccount',
                            guid: self.viewAccount.$account.data('guid')
                        },
                        function (data) {
                            if (!data.return) { modals.okay.show(data.message); }
                            else { self.load(); }
                        },
                        'Deleting account...'
                    );
                }
            },
            addChildAccount: {
                prompt: function () {
                    modals.createAccount.show(self.viewAccount.$account.data('simple-name'), self.viewAccount.$account.data('guid'), self.viewAccount.choices.addChildAccount.addAccount);
                },
                addAccount: function (form) {
                    db.call(
                        {
                            func: 'appCreateAccount',
                            name: form.name,
                            account_type: form.account_type,
                            commodity_guid: form.commodity_guid,
                            parent_guid: form.parent_guid
                        },
                        function (data) {
                            if (!data.return) {
                                modals.okay.show('Failed to create account.');
                            } else {
                                self.load();
                            }
                        },
                        'Creating account...'
                    );
                }
            }
        }
    };

}

var pgOverview = new PageOverview();
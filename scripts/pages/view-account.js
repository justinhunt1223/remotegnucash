function PageViewAccount() {

    var self = this;

    self.$account = null;
    self.$transactions = null;
    self.accountGUID = null;

    self.load = function (parameters) {
        self.$account = $('input[name="account"]');
        self.$transactions = $('#transactions');

        self.$account.bind('focus', self.selectAccount.show);
        if (parameters) { self.selectAccount.selected(parameters.$account); }
    };

    self.selectAccount = {
        show: function () {
            if (!storage.get('settings_verified')) {
                menu.switchPage('settings');
                return;
            }
            modals.selectAccount.show('Select account', self.selectAccount.selected, self.selectAccount.canceled);
            self.$account.blur();
        },
        selected: function ($account, accountDescriptions) {
            self.$account.val($account.data('simple-name'));
            self.accountGUID = $account.data('guid');
            self.loadAccount.start();
        },
        canceled: function () {
            return true;
        }
    };

    self.editTransaction = {
        $transaction: null,
        showPrompt: function ($transaction) {
            self.editTransaction.$transaction = $transaction;
            modals.editTransaction.show('What do you want to do?', self.editTransaction.processChoice, $transaction);
        },
        processChoice: function ($choice) {
            if ($choice.data('type') == 'reconcile') {
                self.editTransaction.reconcile.prompt();
            } else if ($choice.data('type') == 'delete') {
                self.editTransaction.delete.prompt();
            } else if ($choice.data('type') == 'change-description') {
                self.editTransaction.changeDescription.prompt();
            } else if ($choice.data('type') == 'change-amount') {
                self.editTransaction.changeAmount.prompt();
            } else if ($choice.data('type') == 'change-date') {
                self.editTransaction.changeDate.prompt();
            }
        },
        changeDate: {
            prompt: function () {
                modals.selectDate.show('New Transaction Date', self.editTransaction.changeDate.onApprove);
            },
            onApprove: function ($date) {
                db.call(
                    {
                        func: 'appChangeTransactionDate',
                        transaction_guid: self.editTransaction.$transaction.data('guid'),
                        new_date: $date.data('date')
                    },
                    function (data) {
                        if (data.return == 1) {
                            self.loadAccount.start();
                        } else {
                            alert('Failed to change transaction date.');
                        }
                    },
                    'Updating transaction...'
                );
            }
        },
        changeAmount: {
            prompt: function () {
                modals.input.show('New Transaction Amount', '', self.editTransaction.$transaction.data('amount'), self.editTransaction.changeAmount.onApprove);
            },
            onApprove: function (newAmount) {
                if (isNaN(newAmount)) {
                    alert('Please enter a number as the amount.');
                    return false;
                } else if (newAmount <= 0) {
                    alert('Please enter the amount as a positive quantity.');
                    return false;
                }
                db.call(
                    {
                        func: 'appChangeTransactionAmount',
                        transaction_guid: self.editTransaction.$transaction.data('guid'),
                        new_amount: newAmount
                    },
                    function (data) {
                        if (data.return == 1) {
                            self.loadAccount.start();
                        } else {
                            alert('Failed to change transaction amount.');
                        }
                    },
                    'Updating transaction...'
                );
            }
        },
        changeDescription: {
            prompt: function () {
                modals.input.show('New Transaction Description', '', self.editTransaction.$transaction.data('description'), self.editTransaction.changeDescription.onApprove);
            },
            onApprove: function (newTransactionDescription) {
                db.call(
                    {
                        func: 'appChangeTransactionDescription',
                        transaction_guid: self.editTransaction.$transaction.data('guid'),
                        new_description: newTransactionDescription
                    },
                    function (data) {
                        if (data.return == 1) {
                            self.loadAccount.start();
                        } else {
                            alert('Failed to change transaction description.');
                        }
                    },
                    'Updating transaction...'
                );
            }
        },
        delete: {
            prompt: function () {
                modals.yesNo.show('Delete transaction?', '', self.editTransaction.delete.onApprove);
            },
            onApprove: function () {
                db.call(
                    {
                        func: 'appDeleteTransaction',
                        guid: self.editTransaction.$transaction.data('guid')
                    },
                    function (data) {
                        if (data.return == 1) {
                            // TODO: Balance needs to be updated.
                            self.loadAccount.balance = self.loadAccount.balance - parseFloat(self.editTransaction.$transaction.data('amount'));
                            self.loadAccount.updateBalance();
                            self.editTransaction.$transaction.remove();
                        } else {
                            alert('Failed to delete transaction.');
                        }
                    },
                    'Deleting transaction...'
                );
            }
        },
        reconcile: {
            prompt: function () {
                var header = 'Reconcile transaction?';
                if (self.editTransaction.$transaction.data('reconciled') == true) { header = 'Unreconcile transaction?'; }
                modals.yesNo.show(header, '', self.editTransaction.reconcile.onApprove);
            },
            onApprove: function () {
                db.call(
                    {
                        func: 'appUpdateTransactionReconciledStatus',
                        guid: self.editTransaction.$transaction.data('guid'),
                        reconciled: self.editTransaction.$transaction.data('reconciled')
                    },
                    function (data) {
                        if (data.return == 1) {
                            if (self.editTransaction.$transaction.data('reconciled') == true) {
                                self.editTransaction.$transaction.data('reconciled', false);
                                self.editTransaction.$transaction.addClass('error');
                            } else {
                                self.editTransaction.$transaction.data('reconciled', true);
                                self.editTransaction.$transaction.removeClass('error');
                            }
                        } else {
                            alert('Failed to reconcile transaction.');
                        }
                    },
                    (self.editTransaction.$transaction.data('reconciled') == true ? 'Unreconciling transaction...' : 'Reconciling transaction...')
                );
            }
        }
    };

    self.loadAccount = {
        balance: 0,
        start: function () {
            self.$transactions.fadeOut('slow');
            db.call(
                {
                    func: 'appGetAccountTransactions',
                    guid: self.accountGUID
                },
                self.loadAccount.onSuccess,
                'Fetching transactions...'
            );
        },
        updateBalance: function () {
            if (self.loadAccount.balance.toFixed(2) == 0) { self.loadAccount.balance = 0; }
            var parts = self.loadAccount.balance.toFixed(2).toString().split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            $('#lblBalance').html('Balance: <b>$' + parts.join('.') + '</b>');
        },
        onSuccess: function (data) {
            var html = '';
            self.loadAccount.balance = 0;

            for (var i = 0; i < data.transactions.length; i++) {
                html = html + '<tr' + (data.transactions[i].reconciled != true ? ' class="error"' : '') + ' data-description="' + data.transactions[i].description + '" data-amount="' + data.transactions[i].amount + '" data-guid="' + data.transactions[i].guid + '" data-account-guid="' + self.accountGUID + '" data-reconciled="' + data.transactions[i].reconciled + '"><td>';

                html = html + data.transactions[i].description + '<br />';
                if (data.transactions[i].memo) { html = html + '<i>' + data.transactions[i].memo + '</i><br />'; }
                html = html + data.transactions[i].date + '<br />';
                html = html + data.transactions[i].amount + '<br />';

                html = html + '</td></tr>';

                self.loadAccount.balance = parseFloat(self.loadAccount.balance) + parseFloat(data.transactions[i].amount.replace(',', ''))
            }

            self.loadAccount.updateBalance();
            self.$transactions.find('tbody').html(html);
            self.$transactions.find('tr').each(function () {
                var $tr = $(this);
                $tr.unbind('click').bind('click', function () { self.editTransaction.showPrompt($tr); });
            });
            self.$transactions.slideDown();
        }
    };
}

var pgViewAccount = new PageViewAccount();
function PageCreateTransaction() {

    var self = this;

    self.$form = null;
    self.$to = null;
    self.$from = null;
    self.$date = null;
    self.$description = null;
    self.hiddenAmount = '';
    self.guidTo = '';
    self.guidFrom = '';

    self.load = function () {
        self.$form = $('#fmCreateTransaction');
        self.$form
            .form({
                onSuccess: function (e) { e.preventDefault(); self.submitTransaction(); },
                fields: {
                    name: {
                        identifier: 'amount',
                        rules: [
                            {
                                type: 'empty',
                                prompt: 'Please enter an amount.'
                            }
                        ]
                    },
                    from: {
                        identifier: 'from',
                        rules: [
                            {
                                type: 'empty',
                                prompt: 'Please select a transfer from account.'
                            }
                        ]
                    },
                    to: {
                        identifier: 'to',
                        rules: [
                            {
                                type: 'empty',
                                prompt: 'Please select a transfer to account.'
                            }
                        ]
                    },
                    description: {
                        identifier: 'description',
                        rules: [
                            {
                                type: 'empty',
                                prompt: 'Please enter a description.'
                            }
                        ]
                    }
                }
            });

        self.$to = self.$form.find('input[name="to"]');
        self.$from = self.$form.find('input[name="from"]');
        self.$date = self.$form.find('input[name="date"]');
        self.$description = self.$form.find('input[name="description"]');

        self.$to.unbind('focus');
        self.$from.unbind('focus');
        self.$date.unbind('focus');

        self.$to.bind('focus', self.selectToAccount.show);
        self.$from.bind('focus', self.selectFromAccount.show);
        self.$date.bind('focus', self.selectDate.show);

        // In order to make the amount entry better, here is a hack!
        var $amountHidden = self.$form.find('input[name="amount_hidden"]');
        var $amount = self.$form.find('input[name="amount"]');

        $('body').on('click', '*', function () {
            if ($amountHidden.is(':focus')) { return; }
            $amountHidden.blur();
            $amount.parent().removeClass('focus');
        });
        $amount.unbind('click');
        $amount.bind('click', function (e) {
            $amountHidden.focus();
            $amount.parent().addClass('focus');
        });

        self.hiddenAmount = $amount.val();
        $amountHidden.unbind('propertychange change keyup input paste');
        $amountHidden.bind('propertychange change keyup input paste', function (e) {
            $amountHidden.val($amountHidden.val().replace(/\D/g, ''));
            if (self.hiddenAmount != $amountHidden.val()) {
                self.hiddenAmount = $amountHidden.val();
                var fixedAmount = (parseFloat($amountHidden.val()) / 100.0).toFixed(2);
                if (isNaN(fixedAmount)) { fixedAmount = ''; }
                $amount.val(fixedAmount);
            }
        });
    };

    self.updateDescriptionSearch = {
        load: function () {
            db.call(
                {
                    func: 'appGetAccountDescriptions',
                    accountGUID: self.guidFrom
                },
                function (data) {
                    $('#descriptionSearch')
                      .search({
                          source: data.descriptions,
                          searchFields: [
                            'title'
                          ],
                          searchFullText: false,
                          onSelect: self.updateDescriptionSearch.onSelect
                      });
                },
                null,
                false
            );
        },
        onSelect: function (result, response) {
            self.selectToAccount.selectedByDescriptionSearch(result);
        }
    };

    self.selectFromAccount = {
        show: function () {
            if (!storage.get('settings_verified')) {
                menu.switchPage('settings');
                return;
            }
            modals.selectAccount.show('Transfer from', self.selectFromAccount.selected, self.selectFromAccount.canceled);
            self.$from.blur();
        },
        selected: function ($account, accountDescriptions) {
            self.$from.val($account.data('simple-name'));
            self.guidFrom = $account.data('guid');
            self.updateDescriptionSearch.load();
        },
        canceled: function () {
            return true;
        }
    };

    self.selectToAccount = {
        show: function () {
            if (!storage.get('settings_verified')) {
                menu.switchPage('settings');
                return;
            }
            modals.selectAccount.show('Transfer to', self.selectToAccount.selected, self.selectToAccount.canceled);
            self.$to.blur();
        },
        selectedByDescriptionSearch: function (item) {
            self.$to.val(item.description);
            self.guidTo = item.guid;
        },
        selected: function ($account) {
            self.$to.val($account.data('simple-name'));
            self.guidTo = $account.data('guid');
        },
        canceled: function () {
            return true;
        }
    };

    self.selectDate = {
        show: function () {
            if (!storage.get('settings_verified')) {
                menu.switchPage('settings');
                return;
            }
            modals.selectDate.show('Select date', self.selectDate.selected, self.selectDate.canceled);
            self.$date.blur();
        },
        selected: function ($date) {
            self.$date.val($date.data('date'));
            return true;
        },
        canceled: function () {
            return true;
        }
    };

    self.submitTransaction = function () {
        var date = self.$form.form('get value', 'date');
        if (date) { date = date + ' 12:00:00'; }
        else { date = ''; }
        self.$form.removeClass('error');
        db.call(
            {
                func: 'appCreateTransaction',
                amount: self.$form.form('get value', 'amount'),
                date: date,
                credit_guid: self.guidFrom,
                debit_guid: self.guidTo,
                description: self.$form.form('get value', 'description'),
                memo: self.$form.form('get value', 'memo')
            },
            function (data) {
                if (data.return == 1) { self.reset(); }
                else {
                    self.$form.find('.error.message').html(data.message);
                    self.$form.addClass('error');
                    alert(data.message);
                }
            },
            'Creating transaction...'
        );
    };

    self.reset = function () {
        self.guidTo = '';
        self.guidFrom = '';
        self.$form.form('reset');
    };
};

var pgCreateTransaction = new PageCreateTransaction();
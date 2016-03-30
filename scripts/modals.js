function Modals() {

    var self = this;

    self.modal = function ($modal, onApprove, onDeny) {
        if (!$.isFunction(onApprove)) { onApprove = function () { return true; }; }
        if (!$.isFunction(onDeny)) { onDeny = function () { return true; }; }
        $modal
            .modal({
                closable: false,
                allowMultiple: true,
                transition: 'fade',
                observeChanges: true,
                onDeny: onDeny,
                onApprove: onApprove
            })
            .modal('show');
        setTimeout(function () { $modal.modal('refresh'); }, 250);
    };

    self.createAccount = {
        $modal: null,
        $form: null,
        parentAccountGUID: null,
        show: function (parentAccountName, parentAccountGUID, onApprove, onDeny) {
            $('<div>').load('modals/create-account.html #modal-content', function () {
                if ($('#mdlCreateAccount').Exists()) { $('#mdlCreateAccount').remove(); }
                $('body').append($(this).html());
                self.createAccount.$modal = $('#mdlCreateAccount');
                self.modal(self.createAccount.$modal, function () { onApprove(self.createAccount.$form.form('get values')); }, onDeny);
                $('#modal-content').remove();
                self.createAccount.parentAccountGUID = parentAccountGUID;
                self.createAccount.load();
            });
        },
        load: function () {
            self.createAccount.$modal.find('.description').addClass('loading');
            db.call(
                {
                    func: 'appGetCreateAccountDialog'
                },
                function (data) {
                    self.createAccount.$modal.find('.description').html(data.html);
                    self.createAccount.$modal.find('.description').removeClass('loading');
                    self.createAccount.$form = $('#' + data.form_id);
                    self.createAccount.$form.form();
                    self.createAccount.$form.form('set value', 'parent_guid', self.createAccount.parentAccountGUID);
                },
                '',
                false
            );
        }
    }

    self.editAccount = {
        $modal: null,
        show: function (header, onApprove) {
            $('<div>').load('modals/edit-account.html #modal-content', function () {
                if ($('#mdlEditAccount').Exists()) { $('#mdlEditAccount').remove(); }
                $('body').append($(this).html());
                $modal = $('#mdlEditAccount');
                $modal.find('.header').html(header);
                self.modal($modal);
                $('#modal-content').remove();

                $modal.find('.action.button').each(function () {
                    var $button = $(this);
                    $button.unbind('click').bind('click', function () {
                        $modal.find('.button.approve').trigger('click');
                        onApprove($button);
                    });
                });
            });
        }
    }

    self.yesNo = {
        $modal: null,
        show: function (header, body, onApprove, onDeny) {
            $('<div>').load('modals/yes-no.html #modal-content', function () {
                if ($('#mdlYesNo').Exists()) { $('#mdlYesNo').remove(); }
                $('body').append($(this).html());
                $modal = $('#mdlYesNo');
                $modal.find('.header').html(header);
                $modal.find('.description').html(body);
                if (!body) { $modal.find('.description').hide(); }
                self.modal($modal, onApprove, onDeny);
                $('#modal-content').remove();
            });
        }
    };

    self.okay = {
        $modal: null,
        show: function (header, body, onApprove) {
            $('<div>').load('modals/okay.html #modal-content', function () {
                if ($('#mdlOkay').Exists()) { $('#mdlOkay').remove(); }
                $('body').append($(this).html());
                $modal = $('#mdlOkay');
                $modal.find('.header').html(header);
                $modal.find('.description').html(body);
                if (!body) { $modal.find('.description').hide(); }
                self.modal($modal, onApprove);
                $('#modal-content').remove();
            });
        }
    };

    self.input = {
        $modal: null,
        show: function (header, label, placeholder, onApprove, onDeny) {
            $('<div>').load('modals/input.html #modal-content', function () {
                if ($('#mdlInput').Exists()) { $('#mdlInput').remove(); }
                $('body').append($(this).html());
                $modal = $('#mdlInput');
                $('input[name="input"]').attr('placeholder', placeholder);
                $('input[name="input"]').focus();
                $modal.find('.ui.form').form();
                $modal.find('.ui.form').bind('submit', function () { return false; });
                $modal.find('.header').html(header);
                $modal.find('#label').html(label);
                self.modal($modal, function () { onApprove($modal.find('.ui.form').form('get value', 'input')); }, onDeny);
                $('#modal-content').remove();
            });
        }
    };

    self.editTransaction = {
        $modal: null,
        $description: null,
        show: function (header, onApprove, $transaction) {
            $('<div>').load('modals/edit-transaction.html #modal-content', function () {
                if ($('#mdlEditTransaction').Exists()) { $('#mdlEditTransaction').remove(); }
                $('body').append($(this).html());
                $modal = $('#mdlEditTransaction');
                $modal.find('.header').html(header);
                self.modal($modal);
                $('#modal-content').remove();

                if ($transaction.data('reconciled') == true) { $modal.find('.button[data-type="reconcile"]').html('Uncreconcile'); }

                $modal.find('.action.button').each(function () {
                    var $button = $(this);
                    $button.unbind('click').bind('click', function () {
                        $modal.find('.button.approve').trigger('click');
                        onApprove($button);
                    });
                });
            });
        }
    };

    self.selectDate = {
        $modal: null,
        $description: null,
        currentMonthNumber: null,
        currentYearNumber: null,
        onApprove: null,
        show: function (header, onApprove, onDeny) {
            $('<div>').load('modals/select-date.html #modal-content', function () {
                if ($('#mdlSelectDate').Exists()) { $('#mdlSelectDate').remove(); }
                $('body').append($(this).html());
                $modal = $('#mdlSelectDate');
                $modal.find('.header').html(header);
                $description = $modal.find('.description');
                self.selectDate.onApprove = onApprove;
                self.modal($modal, null, onDeny);
                $('#modal-content').remove();
                var date = new Date();
                self.selectDate.currentMonthNumber = date.getMonth() + 1;
                self.selectDate.currentYearNumber = date.getFullYear();
                self.selectDate.populateCalendar();
            });
        },
        previousMonth: function () {
            self.selectDate.currentMonthNumber -= 1;
            if (self.selectDate.currentMonthNumber < 1) {
                self.selectDate.currentMonthNumber = 12;
                self.selectDate.currentYearNumber -= 1;
            }
            self.selectDate.populateCalendar();
        },
        nextMonth: function () {
            self.selectDate.currentMonthNumber += 1;
            if (self.selectDate.currentMonthNumber > 12) {
                self.selectDate.currentMonthNumber = 1;
                self.selectDate.currentYearNumber += 1;
            }
            self.selectDate.populateCalendar();
        },
        populateCalendar: function () {
            $description.addClass('loading');
            db.call(
                {
                    func: 'appGetDateTimeSelect',
                    month: self.selectDate.currentMonthNumber,
                    year: self.selectDate.currentYearNumber
                },
                function (data) {
                    $description.html(data.html);
                    $description.removeClass('loading');
                    $('#btnPreviousMonth').unbind('click').bind('click', self.selectDate.previousMonth);
                    $('#btnNextMonth').unbind('click').bind('click', self.selectDate.nextMonth);
                    $description.find('.date').each(function () {
                        var $date = $(this);
                        $date.unbind('click').bind('click', function () { self.selectDate.onApprove($date); $modal.find('.button.approve').trigger('click'); });
                    });
                },
                '',
                false
            );
        }
    };

    self.selectAccount = {
        $modal: null,
        $description: null,
        onApprove: null,
        show: function (header, onApprove, onDeny) {
            $('<div>').load('modals/select-account.html #modal-content', function () {
                if ($('#mdlSelectAccount').Exists()) { $('#mdlSelectAccount').remove(); }
                $('body').append($(this).html());
                self.selectAccount.onApprove = onApprove;
                $modal = $('#mdlSelectAccount');
                $modal.find('.header').html(header);
                $description = $modal.find('.description');
                self.modal($modal, null, onDeny);
                $('#modal-content').remove();
                db.getAccounts(self.selectAccount.populateAccounts);
            });
        },
        populateAccounts: function (data) {
            var html = '<div class="ui segments">';
            for (var i = 0; i < data.accounts.length; i++) {
                html = html + '<div class="ui inverted segment account" data-is-parent="' + data.accounts[i].is_parent + '" data-simple-name="' + data.accounts[i].simple_name + '" data-guid="' + data.accounts[i].guid + '"><p>' + (data.accounts[i].is_parent ? '<i class="sitemap icon"></i>' : '') + data.accounts[i].name + '</p></div>';
            }
            html = html + '</div>';
            $description.html(html);
            $description.removeClass('loading');
            $modal.find('.account').each(function () {
                $(this).unbind('click');
                $(this).bind('click', function () { self.selectAccount.accountSelected($(this)); });
            });
        },
        accountSelected: function ($item) {
            $modal.find('.approve').trigger('click');
            self.selectAccount.onApprove($item);
        }
    };
};

var modals = new Modals();
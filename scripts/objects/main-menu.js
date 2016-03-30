function MainMenu() {

    var self = this;

    self.$menu = null;
    self.activeItem = '';

    self.load = function () {
        self.$menu = $('#main-menu');

        self.$menu.sidebar('setting', 'closable', false);
        $('body').unbind('click', '#btnMainMenu');
        $('body').on('click', '#btnMainMenu', function () {
            self.$menu.sidebar('show');
        });

        self.$menu.find('.item').each(function () {
            var $self = $(this);
            $self.unbind('click').bind('click', function () {
                var name = $self.attr('name');
                if (name == self.activeItem) {
                    self.$menu.sidebar('hide');
                    return;
                }

                self.switchPage(name);
                self.$menu.sidebar('hide');
            });
        });

        var page = 'create-transaction';
        if (!storage.get('settings_verified')) { page = 'settings'; }
        self.switchPage(page);
    }

    self.switchPage = function (page, parameters) {
        self.$menu.find('.item[name="' + self.activeItem + '"]').removeClass('active');
        self.activeItem = page;

        var $item = self.$menu.find('.item[name="' + page + '"]');
        $item.addClass('active');

        $('#page-title').ChangeHTML($item.data('title'), null, true);
        $('#page-content').fadeOut('fast', function () {
            $('#page-content').load('pages/' + $item.data('ajax') + '.html #page-content', function () {
                window.scrollTo(0, 0);
                $('#page-content').fadeIn('fast');
                if ($item.data('load-function')) {
                    var fnLoadFunction = eval($item.data('load-function'));
                    fnLoadFunction(parameters);
                }
            });
        });
    }
};

var menu = new MainMenu();
$.fn.IsVisible = function () { return this.is(':visible'); };
$.fn.Exists = function () { return this.length > 0; };

$.fn.ChangeHTML = function (html, funcContinue, useFade) {
    var $self = this;
    if (!$.isFunction(funcContinue)) {
        funcContinue = function () { }
    }
    if ($self.IsVisible()) {
        if (html) {
            if (useFade) {
                $self.fadeOut('fast', function () {
                    $self.html(html).fadeIn('fast', funcContinue);
                });
            } else {
                $self.slideUp('slow', function () {
                    $self.html(html).slideDown('slow', funcContinue);
                });
            }
        } else {
            if (useFade) {
                $self.fadeOut('fast', function () {
                    $self.html(html);
                    funcContinue();
                });
            } else {
                $self.slideUp('slow', function () {
                    $self.html(html);
                    funcContinue();
                });
            }
        }
    } else {
        $self.html(html);
        if (html == '' || html == null) {
            if (useFade) {
                $self.fadeOut('fast');
            } else {
                $self.slideUp('fast');
            }
        } else {
            $self.slideDown('slow', funcContinue);
        }
    }
};
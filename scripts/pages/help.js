function PageHelp() {
    var self = this;

    self.$phpLocation = null;

    self.load = function () {
        $('.ui.accordion').accordion();
        self.$phpLocation = $('#php-location');
        $('#php-location').unbind('click').bind('click', self.saveFile.start);
        self.$phpLocation.slideUp();
    };

    self.saveFile = {
        fileObj: null,
        start: function () {
            $.get('PHP/index.php', function (data) {
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
                    dir.getFile('RemoteGNUCashIndex.php', { create: true }, function (file) {
                        var pieces = file.nativeURL.replace('file://', '').split('/');
                        var urlHtml = '';
                        for (var i = 1; i < pieces.length; i++) {
                            urlHtml = urlHtml + '<br />';
                            for (var j = 0; j < i; j++) {
                                urlHtml = urlHtml + '&nbsp;&nbsp;';
                            }
                            urlHtml = urlHtml + '/' + pieces[i];
                        }
                        self.$phpLocation.html('<b>PHP file is located at: </b>' + urlHtml);
                        self.$phpLocation.slideDown('slow');
                        self.saveFile.fileObj = file;
                        self.saveFile.write(data);
                    });
                });
            });
        },
        write: function (string) {
            if (!self.saveFile.fileObj) { return; }
            self.saveFile.fileObj.createWriter(function (fileWriter) {
                fileWriter.seek(fileWriter.length);
                var blob = new Blob([string], { type: 'text/plain' });
                fileWriter.write(blob);
            });
        }
    }
};

var pgHelp = new PageHelp();
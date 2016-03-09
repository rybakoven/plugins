$(function() {
    jQuery.fn.showBlock = function (options) {
        function Link(link) {
            this.options = $.extend({
                animate: false,
                closeOnBody: false,
                callbackBefore: function () {
                },
                callbackAfter: function () {
                }
            }, options);

            this.$link = $(link);

            var that = this,
                data = this.$link.data();

            this.$block = $(data.showBlock);
            this.endAnimation = true;
            this.$textContainer = this.$link.find($(data.textContainer));

            this.$link.bind('click', function (e) {
                if (that.$block.length < 1 || !that.endAnimation) {
                    return false;
                }

                that.endAnimation = false;

                that.options.callbackBefore();

                if (that.$block.is(':visible')) {
                    setTimeout(function () {
                        that.hide();
                    }, 0);
                } else {
                    setTimeout(function () {
                        that.show();
                    }, 0);
                }

                e.preventDefault();
            });

            this.closeEvent = function (e) {
                var menuContainer = $(e.target).closest(data.showBlock).length > 0;
                if (!menuContainer || menuContainer && e.target.tagName == 'A') {
                    this.hide();
                }
            };

            this.show = function () {
                var url = this.$link.data('popup-href') || this.$link.attr('href') || '';

                $('body').find('.blue_popup:visible .close_button').trigger('click');

                if (url.length >= 2 && $.trim(this.$block.html()).length < 1) {
                    this.$link.attr('disabled', 'disabled');
                    $.get(url, function (data) {
                        if (data.length) {
                            that.$block.append(data);
                            show();
                        } else {
                            window.location.href = url;
                        }
                    }).error(function () {
                        that.endAnimation = true;
                        that.$link.removeAttr('disabled', 'disabled');
                        alert('Произошла ошибка!\nПопробуйте повторить попытку.');
                    });
                } else {
                    show();
                }

                function show() {
                    if (that.options.animate) {
                        that.$block.fadeIn(200, function () {
                            that.endAnimation = true;
                            that.options.callbackAfter();
                        });
                    } else {
                        that.$block.show();
                        that.endAnimation = true;
                    }

                    that.$link.removeAttr('disabled', 'disabled');
                    that.$link.addClass('hide_block__show');
                    if (that.$textContainer.length > 0) {
                        that.$textContainer.html(that.$textContainer.data('text-hide') || 'Скрыть');
                    }

                    if (that.options.closeOnBody) {
                        $('body').bind('click.showBlockClose', function (e) {
                            that.closeEvent(e);
                        });
                    }

                    if (!that.options.animate) {
                        that.options.callbackAfter();
                    }
                }
            };

            this.hide = function () {
                if (this.options.animate) {
                    this.$block.fadeOut(200, function () {
                        that.endAnimation = true;
                        that.options.callbackAfter();
                    });
                } else {
                    this.$block.hide();
                    this.endAnimation = true;
                }

                this.$link.removeClass('hide_block__show');
                if (this.$textContainer.length > 0) {
                    this.$textContainer.html(this.$textContainer.data('text-show') || 'Показать');
                }

                if (this.options.closeOnBody) {
                    $('body').unbind('.showBlockClose');
                }

                if (!this.options.animate) {
                    this.options.callbackAfter();
                }
            };
        }

        this.each(function (i, link) {
            return new Link(link);
        });
    };
});
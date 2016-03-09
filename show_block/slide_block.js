$(function() {
    jQuery.fn.slideBlock = function () {
        function Slide(link) {
            var $link = $(link),
                $block = $link.data('block') ? $($link.data('block')) : $link.siblings('.slider__hidden_block'),
                $textContainer = $link.find('.border'),
                defaultHideText = $link.data('hide-text') || $.trim($link.text()),
                defaultShowText,
                defaultVisible = $link.data('default-show') ? true : false,
                hover = $link.data('hover') ? true : false,
                url = $link.attr('href');

            $textContainer = $textContainer.length > 0 ? $textContainer : $link;
            defaultShowText = $textContainer.text();

            if (defaultVisible) {
                if ($.trim($block.html()).length < 1 && url.length >= 2) {
                    getData($link, 1);
                }
                $link.addClass('open_item');
                $block.show();
                $textContainer.text(defaultHideText);
            } else {
                $block.hide();
                $textContainer.text(defaultShowText);
            }

            $link.bind('click', function (e) {
                if ($block.length < 1) {
                    return false;
                }

                if ($.trim($block.html()).length < 1 && url.length >= 2) {
                    getData($link);
                } else {
                    $link.data('animation')();
                }

                e.preventDefault();
            });

            if (hover) {
                $link.bind('mouseleave', function () {
                    $link.css('background-color', '#fff');
                }).bind('mouseenter', function () {
                    $link.css('background-color', '#edf2f5');
                });
            }

            function getData($link, force) {
                $link.attr('disabled', 'disabled');
                $.get($link.attr('href'), function (data) {
                    $block.append(data);
                    $link.removeAttr('disabled');
                    if (!force) {
                        $link.data('animation')();
                    }
                });
            }

            $link.data('animation', function () {
                $block.slideToggle(200, function () {
                    var text = $block.is(':visible') ? defaultHideText : defaultShowText;
                    $textContainer.text(text);

                    if (hover) {
                        $link.css('background-color', 'transparent');
                    }
                    $link.toggleClass('open_item');
                });
            });
        }

        this.each(function (i, link) {
            return new Slide(link);
        });
    };
});
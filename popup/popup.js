$(function() {
    var Popup = function() {
        var load = false;
        var hideTimer;
        var callbacks = {
            type : ''
        };

        $('body').append(
            '<div class="blue_popup">' +
                '<div class="popup_title">' +
                    '<div class="popup_arrow"></div>' +
                    '<span class="popup_title_text"></span>' +
                    '<div class="button button_blue button_x button_ico close_button"><span class="ico close_ico"></span></div>' +
                '</div>' +
                '<div class="popup_content"></div>' +
            '</div>' +
            '<div class="popup_overlay"></div>'
        );

        var $popup = $('body').find('.blue_popup');
        var $popupContent = $popup.find('.popup_content');

        var $popupCloseButton = $popup.find('.close_button');
        $popupCloseButton.bind('click', closePopup);

        function closePopup(e) {
            callbacks.data = false;
            callbacks.invisible = false;
            var $target, $link, noAjaxContent;

            //если параметр
            if (e) {
                $target = $(e.target);
                //если кликнули на кнопку закрыть - закрываем и выходим
                if ($target.closest('.blue_popup').length > 0) {
                    if ($target.hasClass('close_button') || $target.parent().hasClass('close_button')) {
                        close();
                    }
                    //кликнули вне попапа по ссылке другого попапа
                } else {
                    $link = e.target.tagName == 'A' ? $target : $target.parent('a');
                    $link = $link.length > 0 ? $link : false;

                    if ($link) {
                        if ($link.hasClass('blue_popup__button') ||
                            $link.hasClass('blue_popup__link')) {
                            //кликнули на ссылку того же попапа - закрываем попап
                            if ($link.get(0) == $popup.data('$link').get(0)) {
                                close();
                                return false;
                                //кликнули на другую ссылку попапа - закрываем текущий, открываем новый
                            } else {
                                close(e);
                            }
                        }
                    } else if ($target.closest('.curd_select__drop_list__layout').length < 1) {
                        close();
                    }
                }
            } else {
                close();
            }

            function close(e) {
                var $popupContent = $popupContent || $popup.find('.popup_content');
                $(document).unbind('.popup');
                $(window).unbind('.popup');

                $popup.fadeOut(200, function() {
                    $link = $($popup.data('$link'));
                    noAjaxContent = $link.data('content-block');
                    if (noAjaxContent) {
                        $(noAjaxContent).append($popup.data('data'));
                    }
                    $popupContent.empty().removeAttr('style');
                    overlay.hide();
                    if (e) {
                        popup.show(e);
                    }
                });
                return false;
            }
        }

        function overlay() {}
        (function(){
            function show($link) {
                if (!$link.data('popup-overlay')) {
                    return false;
                }

                var $overlay = $('.popup_overlay');
                $overlay.show();
            }

            function hide() {
                var $overlay = $('.popup_overlay');
                $overlay.hide();
            }

            overlay.show = show;
            overlay.hide = hide;
        })();

        function preloader() {}
        (function() {
            var $popupContent = $popupContent || $popup.find('.popup_content');

            function show() {
                var $preloader = $popupContent.find('.popup_preloader');

                if ($preloader.length < 1) {
                    $preloader = $('<div class="popup_preloader"><img src="/bundles/bergsite/new/images/loading_blue.gif" alt="" /></div>');
                    $popupContent.append($preloader);
                }

                $preloader.show();
            }

            function hide() {
                var $preloader = $popupContent.find('.popup_preloader');

                $preloader.hide();
            }

            preloader.show = show;
            preloader.hide = hide;
        })();

        this.show = function(e) {
            var visible = $popup.is(':visible');

            if (load) {
                return false;
            }
            if (visible) {
                closePopup(e);
                return false;
            }

            load = true;
            preloader.show();

            var $link = e.target.tagName == 'A' ? $(e.target) : $(e.target).closest('a'),
                position,
                className = $popup.get(0).className,
                reg = /popup_wrapper__.+/,
                popupType = reg.exec(className);

            if (popupType) {
                $popup.get(0).className = className.replace(reg, 'popup_wrapper__' + $link.data('popup-type'));
            } else {
                $popup.addClass('popup_wrapper__' + $link.data('popup-type'));
            }

            callbacks.$link = $link;
            callbacks.init();
            callbacks.init('show_before_ajax');

            if ($link.data('popup-position')) {
                position = $link.data('popup-position');
                $popup.find('.popup_arrow').removeAttr('class').addClass('popup_arrow popup_arrow_' + position);
            } else {
                $popup.find('.popup_arrow').removeAttr('class').addClass('popup_arrow');
            }

            initPosition();

            var title = $link.prop('title');
            if (title && !$link.data('popup-notitle')) {
                $popup.find('.popup_title_text').text(title);
            } else {
                $popup.find('.popup_title').addClass('no_title_text');
            }

            if (!callbacks.invisible) {
                $popup.fadeIn(200);
            }

            $(document).bind('click.popup', closePopup);
            $(window).bind('resize.popup', initPosition);
            $(document).bind('keydown.popup', function(e) {
                if (e.keyCode == 27) {
                    closePopup();
                    return false;
                }
            });

            var href = $link.attr('href');

            $popup.data({
                'href'  : href,
                '$link' : $link
            });

            var $contentBlock = $($link.data('content-block')),
                data = $contentBlock.html();

            if ($contentBlock.length && $.trim($contentBlock).length > 0) {
                $contentBlock.empty();
                buildForm(data);
            } else {
                $.ajax({
                    url : $popup.data('href'),
                    type : 'GET',
                    success : buildForm,
                    error : buildFormError,
                    timeout : 10*1000
                });
            }

            overlay.show($link);

            function initPosition() {
                function callback() {
                    var style, $positionButton, left, top;

                    switch (position) {
                        case 'bottom' : {
                                style = {
                                    'top' : parseInt($link.offset().top + $link.height() + 10, 10),
                                    'left' : parseInt($link.offset().left - $popup.width() / 2 + $link.width() / 2, 10)
                                };
                            }
                            break;

                        case 'center' : {
                                style = {
                                    'left': '50%',
                                    'margin-left' : parseInt(0 - $popup.width() / 2, 10)
                                };
                            }
                            break;

                        case 'price_popup' : {
                                $positionButton = $('.price__add_to_price__button');
                                left = Math.round($positionButton.offset().left);
                                top = Math.round($positionButton.offset().top);

                                style = {
                                    'top' : top,
                                    'left' : left
                                };
                            }
                            break;

                        case 'share' : {
                                $positionButton = $link;
                                left = Math.round($positionButton.offset().left) - 2;
                                top = Math.round($positionButton.offset().top) + 3;

                                style = {
                                    'top' : top,
                                    'left' : left
                                };
                            }
                            break;

                        case 'margin' : {
                                $positionButton = $link;
                                left = Math.round($positionButton.offset().left);
                                top = Math.round($positionButton.offset().top);

                                style = {
                                    'top' : top,
                                    'left' : left
                                };
                            }
                            break;

                        case 'margin_left' : {
                                $positionButton = $link;
                                left = Math.round($positionButton.offset().left - $popup.width());
                                top = Math.round($positionButton.offset().top);

                                style = {
                                    'top' : top,
                                    'left' : left
                                };

                                $popup.addClass('popup_wrapper__margin_left');
                            }
                            break;

                        case 'manager_info' : {
                                $positionButton = $link;
                                left = Math.round($positionButton.offset().left);
                                top = Math.round($positionButton.offset().top);

                                style = {
                                    'top' : top,
                                    'left' : left
                                };
                            }
                            break;

                        case 'reserve_status' : {
                                style = {
                                    'top' : parseInt($link.offset().top, 10),
                                    'left' : parseInt($link.offset().left, 10)
                                };
                            }
                            break;

                        default: {//по умолчанию - справа
                            style = {
                                'top' : parseInt($link.offset().top - 6, 10),
                                'left' : parseInt($link.offset().left + parseInt($link.width()) + 10, 10)
                            };
                        }
                    }

                    style.display = 'block';

                    $popup
                        .removeAttr('style')
                        .css(style);
                }

                callback();
            }

            function buildForm(data) {
                $popup.buildForm = buildForm;
                $popup.submitError = submitError;
                load = false;
                preloader.hide();

                $popupContent.empty().append(data);
                $popup.data('data', data);
                callbacks.init('buildForm');

                var $form = $popupContent.find('form');
                clearTimeout(hideTimer);

                if ($form.length < 1) {
                    return false;
                }

                $popupContent.css('min-height', $form.height());

                var $input = $form.find('input[type="text"], textarea, input[type="button"], input[type="submit"]').eq(0);
                $input.focus().val($input.val());

                if ($form.data('noajax-submit')) {
                    return false;
                } else {
                    var $submitButtons = $form.find('[type="submit"]');
                    $submitButtons.bind('click', function(e) {
                        if (load){
                            return false;
                        }
                        load = true;
                        preloader.show();
                        $form.hide();
                        $.ajax({
                            url : $form.attr('action'),
                            data : (function() {
                                var data = $form.serialize(),
                                    $submitButton = $(e.target);
                                data += '&' + $submitButton.attr('name') + '=' + encodeURIComponent($submitButton.attr('value'));
                                return data;
                            })(),
                            type : 'POST',
                            success : submitCallback,
                            error : submitError,
                            timeout : 10*1000
                        });
                        e.preventDefault();
                        return false;
                    });
                }
            }

            function buildFormError() {
                submitError();
            }

            function submitCallback(data) {
                load = false;
                preloader.hide();
                $popupContent.empty().append(data);

                if ($popupContent.find('.field_error:visible').length < 1) {
                    var $form = $popupContent.find('form');
                    $form.show();
                    $popupContent.css('min-height',($form.height()));

                    hideTimer = setTimeout(function() {
                        closePopup();
                    }, 2000);
                    callbacks.init('submitCallback');
                } else {
                    buildForm(data);
                }
            }

            function submitError() {
                load = false;
                preloader.hide();

                var $form = $popupContent.find('form');
                $form.show();

                var $messageBlock = $popupContent.find('.popup_success');
                if ($messageBlock.length < 1) {
                    $popupContent.append('<div class="popup_success">' +
                            '<div class="complete_message"></div>' +
                            '<div class="content_overlay"></div>' +
                        '</div>');

                    $messageBlock = $popupContent.find('.popup_success');
                }

                $messageBlock.addClass('popup_success_enabled');

                var $message = $messageBlock.find('.complete_message');
                $message.text('Произошла ошибка, попробуйте еще раз.');
            }

            return false;
        };


        callbacks.init = function(name) {
            var type, _continue;

            if (!name) {
                type = callbacks.$link.data('popup-type');
                callbacks.type = type ? type : false;

            } else if (callbacks.type && typeof eval(callbacks[callbacks.type + '__' + name]) == 'function') {
                _continue = eval(callbacks[callbacks.type + '__' + name])();
                if (!_continue) {
                    return false;
                }
            }
        };


        callbacks.petition__buildForm = function() {
            var $radioButtons = $popupContent.find('.petition_type input');

            $radioButtons.bind('change', function(e) {
                var href = e.target.value;
                var $overlay = $popup.find('.popup_success');
                $overlay.addClass('popup_success_enabled');

                load = true;
                preloader.show();

                $popupContent.siblings('.popup_title').find('.popup_title_text').html($popupContent.find('.petition_type label[for="' + e.target.id + '"]').text());

                $.ajax({
                    url : href,
                    type : 'GET',
                    success : $popup.buildForm,
                    error : $popup.submitError,
                    timeout : 10*1000
                });
            });
        };


        callbacks.avia_delivery__buildForm = function() {
            var $form = $popup.find('form'),
                $inputs = $form.find('input[type="text"]'),
                $checkbox = $form.find('#resource_dimensions_agreeWithTerms'),
                $submitButton = $form.find('[type="submit"]'),
                $priceBlock = $form.find('#avia-delivery--price-block'),
                $price = $priceBlock.find('.price'),
                $dataBlock = $popup.find('.popup_success');

            $inputs.bind('keyup', calculatedPrice);
            $checkbox.bind('change', disabledSubmit);
            calculatedPrice();

            callbacks.avia_delivery__getPrice();

            function disabledSubmit() {
                if ($priceBlock.is(':visible') && $checkbox.is(':checked')) {
                    $submitButton.removeAttr('disabled');
                } else {
                    $submitButton.attr('disabled', 'disabled');
                }
            }

            function calculatedPrice() {
                var price, height, length, width, costRate, weight, onePrice, deliveryPrice;

                if (isCompleted()) {
                    height      = number_format($inputs.filter('#resource_dimensions_height').val(), 2, '.', '');
                    length      = number_format($inputs.filter('#resource_dimensions_length').val(), 2, '.', '');
                    width       = number_format($inputs.filter('#resource_dimensions_width').val(), 2, '.', '');
                    weight      = number_format($inputs.filter('#resource_dimensions_weight').val(), 2, '.', '');
                    costRate    = $dataBlock.data('costrate');
                    onePrice    = number_format(callbacks.$link.data('price'), 2, '.', '');

                    deliveryPrice = costRate * Math.max(167 * (height * length * width) / 1000000000 , weight);
                    if (deliveryPrice > 0.009) {
                        deliveryPrice = Math.max(Math.round(deliveryPrice / 0.59) * 0.59, 0.59); // NDS hack
                    } else {
                        deliveryPrice = 0;
                    }
                    price = deliveryPrice + onePrice;
                    $price.html(number_format(price, 2, ',', '&nbsp;'));

                    $priceBlock.show();
                } else {
                    $priceBlock.hide();
                }
                disabledSubmit();
            }

            function isCompleted() {
                if (!$inputs.get(0).validity || !'valid' in $inputs.get(0).validity) {
                    return false;
                }

                var completed = false;
                var length = $inputs.length;
                for (var i = 0; i < length; i++) {
                    if (!$inputs.get(i).validity.valid) {
                        completed = false;
                        break;
                    } else {
                        completed = true;
                    }
                }
                return completed;
            }

            return true;
        };


        callbacks.avia_delivery__getPrice = function() {
            var $dataBlock = $popupContent.find('.popup_success '),
                onePrice = number_format(callbacks.$link.data('price'), 2, '.', ''),
                price, deliveryPrice, $sumTD, $parentTR, quantity;

            if ($dataBlock.data('airdeliveryprice') > 0) {
                deliveryPrice = number_format($dataBlock.data('airdeliveryprice'), 2, '.', '');
                price = deliveryPrice + onePrice;
                callbacks.$link.html(number_format(price, 2, ',', '&nbsp;'));
            }

            //прибиваем ссылку и валим
            if ($dataBlock.data('airdeliveryistrusted') > 0) {
                callbacks.$link.replaceWith('<span>' + callbacks.$link.html() + '</span>');
                $popup.find('.close_button').trigger('click');

                //подчеркиваем ссылку пунктиром и продолжаем
            } else {
                callbacks.$link.css({
                    'text-decoration'   : 'none',
                    'border-bottom'     : '1px dashed'
                });
                $popup.fadeIn(200);
            }

            //считаем сумму, если есть соответствующий столбец в таблице
            $parentTR = callbacks.$link.closest('tr');
            $sumTD = $parentTR.find('td.final_price');
            if ($sumTD.length > 0 && price != undefined && typeof (parseInt(price, 10)) == 'number') {
                quantity = parseInt($parentTR.find('.input_spinner input').val(), 10);
                $sumTD.html(number_format(price * quantity, 2, ',', '&nbsp;'));
            }

            //убираем выделение бажной строки
            callbacks.$link.closest('tr').removeClass('avia_delivery_invalid');
        };


        callbacks.avia_delivery__show_before_ajax = function() {
            callbacks.invisible = true;
        };


        callbacks.avia_delivery__submitCallback = function() {
            callbacks.avia_delivery__getPrice();
        };

        callbacks.price__buildForm = function() {
            priceListPopupInit();
        };

        callbacks.pie__buildForm = function() {
            var data = $popup.data('data'),
                reliabilityHTML, deliveryHTML, updateDateHTML;

            reliabilityHTML = '<div class="pie_wrapper">' +
                '<p class="title">Вероятность наличия у поставщика ' + data.warehouseName + '</p>' +
                '<div class="graph_pie"></div>' +
                '<div class="pie__legend">' +
                (data.reliability ?
                    '<p><span class="legend__marker_red"></span> <b>' + (data.reliability > 100 ? 0 : (100 - data.reliability)) + ' %</b> &mdash; отказано</p>' +
                    '<p><span class="legend__marker_green"></span> <b>' + (data.reliability > 100 ? 100 : data.reliability) + ' %</b> &mdash; выдано</p>'
                :
                    '<p><span class="legend__marker_gray"></span> &mdash; нет статистики</p>'
                ) +
                '</div>' +
            '</div>';

            var assuredDay = getDayQuantity(data.period.assured),
                averageDay = getDayQuantity(data.period.average);

            deliveryHTML = '<div class="bar_wrapper">' +
                '<p class="title">Вероятность поставки в рабочих днях</p>' +
                '<div class="graph_bar"></div>' +
            '</div>' +
            (data.delivery.length > 0 && data.period && assuredDay && averageDay ?
                '<div class="bar__legend">' +
                    '<p><span class="legend__marker average_time"></span> <span class="time_text">Средний срок</span> ' + data.period.average + ' ' + averageDay + '<span class="average_value"></span></p>' +
                    '<p><span class="legend__marker guaranteed_time"></span> <span class="time_text">Гарантированный срок</span> ' + data.period.assured + ' ' + assuredDay + '<span class="guaranteed_value"></span></p>' +
                    '<p><span class="legend__marker expired_time"></span> Просрочка</p>' +
                '</div>'
            :
                ''
            );

            updateDateHTML = data.updateDate && data.updateDate.month ?
                '<p class="graph__refresh_data">Прайс-лист обновлен ' + data.updateDate.day + ' ' +
                    (function(monthNum) {
                        return [
                            'января',
                            'февраля',
                            'марта',
                            'апреля',
                            'мая',
                            'июня',
                            'июля',
                            'августа',
                            'сентября',
                            'октября',
                            'ноября',
                            'декабря'
                        ][monthNum - 1];
                    })(data.updateDate.month) +
                '</p>'
            : '';

            var html = '<div class="popup_content__wrapper">' +
                reliabilityHTML +
                deliveryHTML +
                updateDateHTML +
            '</div>';

            $popupContent.empty().append(html);

            piePopupInit($popup, data);
        };

        callbacks.reserve_status__buildForm = function() {
            $popup.find('.status_link__wrapper a').bind('click', function(e) {
                $popup.find('.close_button').trigger('click');
                e.preventDefault();
            });
        };

        callbacks.reserve_remove__buildForm = function() {
            $popupContent.find('.input_spinner input').inputSpinner(searchInputSpinner).trigger('changeValue', function() {return this.getAttribute('value');});
        };

        callbacks.reserve_remove__submitCallback = function() {
            var $newRow = $popup.find('.complete_request').html(),
                $statusContainer = callbacks.$link.closest('.status_col');

            callbacks.$link.closest('tr').addClass('with_reserve_remove_requests');
            $statusContainer.append($newRow);
        };

        callbacks.margin__submitCallback = function() {
            window.location.href = window.location.href + '';
        };

        callbacks.manager_info__buildForm = function() {
            $popupContent.find('.title').bind('click', function(e) {
                $popupCloseButton.trigger('click');
                e.preventDefault();
            });
        };

        return this;
    };

    var popup = new Popup();

    $(function(){
        $(document).on('click touchend', '.blue_popup__button, .blue_popup__link, .price_popup_button', popup.show);
    });
});

function getDayQuantity(dateDay) {
    var dayQuantity = {
        one : 'день',
        two : 'дня',
        many : 'дней'
    };

    if (dateDay % 100 == 1 || (dateDay % 100 > 20) && (dateDay % 10 == 1 )) return dayQuantity.one;
    if (dateDay % 100 == 2 || (dateDay % 100 > 20) && (dateDay % 10 == 2 )) return dayQuantity.two;
    if (dateDay % 100 == 3 || (dateDay % 100 > 20) && (dateDay % 10 == 3 )) return dayQuantity.two;
    if (dateDay % 100 == 4 || (dateDay % 100 > 20) && (dateDay % 10 == 4 )) return dayQuantity.two;

    return dayQuantity.many;
}

function piePopupInit($popup, data) {
    data = data || {
        delivery    : null,
        reliability : null
    };

    var
        $pieContainer = $popup.find('.graph_pie'),
        dataPie;

    if (data.reliability) {
        dataPie = [{data : data.reliability > 100 ? 0 : 100 - data.reliability, color: '#de4f37'}, {data: (data.reliability > 100 ? 100 : data.reliability), color : '#adca53'}];
    } else {
        dataPie = [{data : 100, color: '#ccc'}];
    }

    $.plot($pieContainer, dataPie, {
        series: {
            pie: {
                innerRadius: 0.5,
                show: true
            }
        }
    });

    var dataForBar = (function(data) {
        if (!data || data.length < 1) {
            return 0;
        }

        var aResult = [],
            value;

        for (var count in data) {
            value = data[count].completed > 100 ? 100 : data[count].completed;
            aResult.push([data[count].day, value]);
            //aResult.push([Number(count), data[count]]);
        };

        return aResult;
    })(data.delivery);

    var maxY = (function() {
        var max = 0;

        for (var i in dataForBar) {
            max = max >= dataForBar[i][1] ? max : dataForBar[i][1];
        }

        if (max > 4 && max < 100) {
            max = max % 10 == 0 ? max + 10 : max + (10 - (max % 10));
            if (max == 50 || max == 70 || max == 90) {
                max += 10;
            }
        } else if (max <= 4) {
            max = 5;
        }

        return max;
    })();

    var dataPeriod = (function(data){
        var average, assured, averageArr = [], assuredArr = [],
            fromZeroOX = true,
            averageSum = 0, assuredSum = 0;

        if (!data || (!data.average && data.average != 0) || (!data.assured && data.assured != 0) || !dataForBar) {
            return {
                average : 0,
                assured : 0
            };
        }

        if (fromZeroOX) {
            average = data.average + 1 || 0;
            assured = data.assured > data.average ? data.assured - average + 1 : 0;
        } else {
            average = data.average - dataForBar[0][0] + 1 > 0 ? data.average - dataForBar[0][0] + 1 : 0;
            assured = data.assured - dataForBar[0][0] + 1 > 0 ? data.assured - dataForBar[0][0] + 1 - average : 0;
        }

        if (fromZeroOX) {
            for (var i = 0; i < average; i++) {
                averageArr.push([i, maxY]);
            }
            for (i = average; i < average + assured; i++) {
                assuredArr.push([i, maxY]);
            }
        } else {
            for (var i = dataForBar[0][0]; i < dataForBar[0][0] + average; i++) {
                averageArr.push([i, maxY]);
            }
            for (i = dataForBar[0][0] + average; i < dataForBar[0][0] + average + assured; i++) {
                assuredArr.push([i, maxY]);
            }
        }

        for (i = 0; i <= dataForBar[dataForBar.length - 1][0]; i++) {
            for (var j = 0; j <= dataForBar[dataForBar.length - 1][0]; j++) {
                if (dataForBar[j] && dataForBar[j][0] == i) {
                    if (i <= averageArr[averageArr.length - 1][0]) {
                        averageSum += dataForBar[j][1];
                    } else if (i <= assuredArr[assuredArr.length - 1][0]) {
                        assuredSum += dataForBar[j][1];
                    }
                    break;
                }
            }
        }

        return {
            average : averageArr,
            assured : assuredArr,
            averageSum : averageSum,
            assuredSum : assuredSum
        };
    })(data.period);

    var ox = (function () {
        var barLength,
            startDay = 0,
            stopDay = 0,
            delta = 8; //ширина бара ~8px в секторе на 100px (по макету)

        if (dataPeriod && dataPeriod.average && dataPeriod.average.length > 0) {
            startDay = dataPeriod.average[0][0];
        } else if (dataForBar && dataForBar.length > 0 ) {
            startDay = dataForBar[0][0];
        }

        if (dataPeriod && dataPeriod.assured && dataPeriod.assured.length > 0) {
            stopDay = dataPeriod.assured[dataPeriod.assured.length - 1][0]
        }

        if (dataPeriod && dataForBar.length > 0 && stopDay < dataForBar[dataForBar.length - 1][0]) {
            stopDay = dataForBar[dataForBar.length - 1][0]
        }

        barLength = delta * 100 / (246 / (stopDay - startDay + 1)) * 0.01; //1 = 100%, поэтому приводим к 0.xx
        barLength = barLength < 1 ? barLength : 1;

        return {
            barWidth : barLength,
            dataLength : stopDay - startDay
        };
    })();

    var barData = {
        data : dataForBar,
        bars : {
            show : true,
            barWidth : ox.barWidth,
            align : 'center',
            fill : true,
            lineWidth : 1,
            fillColor : '#adca53'
        },
        color : hexToRgb('adca53', 1)
    };

    var averageData = {
        data : dataPeriod.average,
        bars : {
            show : true,
            align : 'center',
            lineWidth : 0,
            fill : true,
            fillColor : hexToRgb('adca53', .45)
        }
    };

    var guaranteedData = {
        data : dataPeriod.assured,
        bars : {
            show : true,
            align : 'center',
            lineWidth : 0,
            fill : true,
            fillColor : hexToRgb('adca53', .2)
        }
    };
    var fontParams = {
        size: 12,
        family: '"Trebuchet MS", sans-serif',
        color: '#272727'
    };

    var $barContainer = $popup.find('.graph_bar');
    $.plot($barContainer, [barData, averageData, guaranteedData], {
        xaxis   : {
            tickLength : 0,
            font : fontParams,
            ticks : function() {
                var maxTick = ox.dataLength,
                    result = [],
                    step;

                step = Math.ceil(maxTick / 10);

                for (var i = 0; i <= maxTick; i++) {
                    if (i == 0 || i == maxTick || (i % step == 0 && i + step <= maxTick)) {
                        result.push([i, String(i)]);
                    }
                }

                return result;
            }
        },
        yaxis   : {
            show : true,
            autoscaleMargin : 0,
            font : fontParams,
            min : 0,
            ticks : function (axis) {
                var maxTick = axis.max,
                    step = 0,
                    result = [];

                switch (true) {
                    case maxTick <= 5:
                        step = 1;
                        break;

                    case maxTick == 10:
                        step = maxTick / 5;
                        break;

                    case maxTick == 20 || maxTick >= 40:
                        step = maxTick / 4;
                        break;

                    case maxTick == 30:
                        step = maxTick / 3;
                        break;

                    default:
                        step = maxTick;
                        break;
                }

                for (var i = 0; i <= maxTick; i++) {
                    if (i == 0 || i % step == 0 || i == maxTick) {
                        result.push([i, i + '%']);
                    }
                }

                return result;
            }
        },
        grid    : {
            borderWidth : {
                top : 0,
                right : 0,
                bottom : 1,
                left: 1
            },
            borderColor : {
                top : 'transparent',
                right : 'transparent',
                bottom : '#c5cbb3',
                left: '#c5cbb3'
            },
            labelMargin : 9
        }
    });

    if (dataPeriod && (dataPeriod.averageSum || dataPeriod.averageSum == 0) && (dataPeriod.assuredSum || dataPeriod.assuredSum == 0)) {
        $popup
            .find('.average_value').html('&mdash; ' + (dataPeriod.averageSum > 100 ? 100 : dataPeriod.averageSum) + '%')
            .end().find('.guaranteed_value').html('&mdash; ' + (dataPeriod.averageSum + dataPeriod.assuredSum > 100 ? 100 : dataPeriod.averageSum + dataPeriod.assuredSum) + '%');
    }

    if (!barData.data) {
        $barContainer.append('<div class="no_bar_data">Нет статистики</div>');
    }
}
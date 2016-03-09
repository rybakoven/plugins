$(function() {
    $.fn.curd = function(){
        this.each(function(i, select) {
            if (typeof select.hideList === 'function') {
                return false;
            }

            (function() {
                var $select = $(select);
                if ($select.hasClass('curd_select')) {
                    $select
                        .removeClass('curd_select')
                        .wrap('<div class="curd_select"></div>');
                }
            })();

            var obj = new Create(select);

            select.hideList = function() {
                return obj.dropMenuHide.call(obj);
            };

            select.reposition = function() {
                return obj.dropMenuReposition.call(obj);
            };

            select.rollback = function(params) {
                return obj.userValueSelect.call(obj, params);
            };

            select.disabledTrigger = function() {
                return obj.disabledTrigger.call(obj);
            };
        });
    };

    function Create(select) {
        var mainObj = function() {
            var $select = $(select);

            this.nodes = {
                $select             : $select,
                $selectContainer    : $select.parent('.curd_select'),
                $selectOptions      : $select.children(),
                $dropListWrap       : $('.curd_select__drop_list__wrap'),
                $emptyNode          : $select.children().filter('[value="-1"]')
            };

            this.options = {
                autocomplete    : $select.data('autocomplete') ? true : false,
                multiple        : $select.prop('multiple') ? true : false,
                placeholder     : this.nodes.$select.attr('placeholder') || false,
                isDisabled      : function() {
                    return $select.prop('disabled') ? true : false;
                },
                buildComplete   : false
            };

            this.buildNodes();
            this.init();
        };

        mainObj.prototype.buildNodes = function() {
            //обертка для всех выпадающих списков
            if (this.nodes.$dropListWrap.length < 1) {
                this.nodes.$dropListWrap = $('<div class="curd_select__drop_list__wrap" />');
                $('body').append(this.nodes.$dropListWrap);
            }

            //контейнер выпадающего списка
            this.nodes.$dropListLayout = $('<div class="curd_select__drop_list__layout" />');
            this.nodes.$dropListWrap.append(this.nodes.$dropListLayout);

            //список текущих элементов
            this.nodes.$selectedContainer = $('<ul class="curd_select__container" />');
            this.nodes.$selectContainer.append(this.nodes.$selectedContainer);

            //выпадающий список
            this.nodes.$dropList = $('<ul class="curd_select__drop_list" />');
            this.nodes.$dropListLayout.append(this.nodes.$dropList);

            //главный айтем, он же инпут для автокомплита
            this.nodes.$selectWrapper = $('<li class="main_item" />');
            this.nodes.$selectedContainer.append(this.nodes.$selectWrapper);
            this.nodes.$input = $('<input type="text" value="" autocomplete="off" tabindex="-1" />');
            this.nodes.$selectWrapper.append(this.nodes.$input);

            this.nodes.$arrowButton = $('<div class="arrow_button" />');
            this.nodes.$selectContainer.prepend(this.nodes.$arrowButton);
            if (this.options.autocomplete) {
                this.nodes.$arrowButton.hide();
            }

            this.nodes.$selectContent = $('<div class="curd_content"></div>');
            this.nodes.$selectContainer.wrapInner(this.nodes.$selectContent);
            /*if (this.nodes.$selectOptions.length < 1) {
                this.nodes.$arrowButton.hide();
            }*/
            this.nodes.$hints = (function(obj) {
                var $hints = $();
                $('.curd_select__hint').each(function(i, wrapper) {
                    var $wrapper = $(wrapper);

                    $hints = $hints.add($wrapper.find('[data-curd-id="' + obj.nodes.$select.attr('id') + '"]'));
                });
                return $hints;
            })(this);
        };

        mainObj.prototype.init = function() {
            //инициализация мультикомплита
            if (this.options.multiple) {
                this.nodes.$selectContainer.addClass('curd_select__multiple');
            }

            //инициализация автокомплита
            if (this.options.autocomplete) {
                this.createAutocomplete();
            } else {
                this.nodes.$input.attr('disabled', 'disabled');
            }

            //скрываем все селекты и создаем список
            this.nodes.$select.addClass('curd_select__select');
            this.selectChangeEvent();
            this.createListItems();
            this.selectEvent();
            this.inputInit();
            this.hintsInit();
            this.disabledTrigger().init.call(this);
            this.options.buildComplete = true;
        };

        mainObj.prototype.createAutocomplete = function() {
            this.nodes.$selectContainer.addClass('curd_select__autocomplete');
            this.nodes.$loupeButton = $('<div class="loupe_button" />');
            this.nodes.$loupeButton.insertAfter(this.nodes.$arrowButton);

            var optionsLength = this.nodes.$selectOptions.length;
            for (var i = 0; i < optionsLength; i++) {
                this.nodes.$selectOptions.eq(i).data('default', true);
            }

            var that = this;

            this.nodes.$input.autocomplete({
                appendTo : this.nodes.$dropListLayout.get(0),
                source: function(request, response) {
                    $.ajax({
                        type:'GET',
                        dataType:'json',
                        url : that.nodes.$select.data('autocomplete') + encodeURIComponent(that.nodes.$input.val()),
                        success:function(data){
                            if (data == null || data.length === 0 ) {
                                return false;
                            }

                            var outData = [];

                            $.map(data, function (item) {
                                var itemUse = false;
                                for (var i = 0; i < that.nodes.$selectOptions.length; i++) {
                                    if (item.id == that.nodes.$selectOptions.eq(i).val()) {
                                        itemUse = true;
                                    }
                                }

                                if (!itemUse) {
                                    outData.push({
                                        value : item.name,
                                        id : item.id
                                    });
                                }
                            });

                            response(outData);
                        },

                        error:function(e){console.info(e);}
                    });


                },

                open : function() {
                    that.dropMenuReposition();
                    $(window).bind('resize.curd_autocomplete', function() {
                        that.dropMenuReposition.call(that);
                    });
                },

                close : function() {
                    $(window).unbind('.curd_autocomplete');
                },

                select : function(event, item) {
                    if (that.options.multiple) {
                        var $option;
                        for (var i = 0; i < that.nodes.$selectOptions.length; i++) {
                            if (that.nodes.$selectOptions.eq(i).val() == item.item.id) {
                                return false;
                            }
                        }

                        //autocomplete забивает стек и не дает менять
                        setTimeout(function() {
                            that.nodes.$input.attr({'placeholder' : '', 'value' : ''});
                            that.inputScale();
                        }, 0);

                        $option = $('<option value="' + item.item.id + '" selected="selected">' + item.item.value + '</option>');
                        $option.addClass('autocomplete');
                        //чистим список с выбранными значениями
                        that.nodes.$selectedContainer.children().not('.main_item').remove();
                        that.nodes.$select.append($option);
                        that.nodes.$selectOptions = that.nodes.$selectOptions.add($option);
                        that.createListItems();

                    } else {
                        that.nodes.$select.empty();
                        that.nodes.$selectOptions = $('<option value="' + item.item.id + '">' + item.item.value + '"</option>');
                        that.nodes.$selectOptions.addClass('autocomplete');
                        that.nodes.$select.append(that.nodes.$selectOptions);

                        that.createListItems();
                        that.inputScale(item.item.value);
                    }
                },

                minLength : 2
            });
        };

        mainObj.prototype.createListItems = function() {
            var
                $options = this.nodes.$selectOptions,
                length = $options.length,
                $option, $li, $ul;

            $ul = this.nodes.$dropList;
            $ul.empty();

            for (var i = 0; i <= length - 1; i++) {
                $option = $options.eq(i);

                $li = $('<li>' + $.trim($option.text()) + '</li>').addClass($option.prop('class'));
                var disabled = $option.is(':disabled') ? 'disabled' : '';

                $li
                    .attr('value', $option.val() ? $option.val() : $.trim($option.text()))
                    .addClass(disabled);

                $option.data('$item', $li);
                $li.data('$option', $option);

                $ul.append($li);
                this.clickDropItem($li);
            }

            this.selectedItem();
        };

        mainObj.prototype.inputInit = function() {
            var that = this;

            this.nodes.$input
                .bind('keydown.curd', function(e) {
                    if (e.keyCode == 8 && !that.nodes.$input.val()) {
                        that.nodes.$selectWrapper.prev('li').find('.clear_item').trigger('click');
                    }
                })
                .bind('keyup.curd', function() {
                    if (!that.options.multiple && that.nodes.$selectOptions.length > 0) {
                        if (that.nodes.$selectOptions.eq(0).val() != that.nodes.$input.val()) {
                            that.nodes.$selectOptions = that.nodes.$select.children();
                            that.nodes.$select.empty();
                        }
                    }
                    that.inputScale();
                })
                .bind('focus.curd click.curd', function() {
                    that.nodes.$input.autocomplete('search', that.nodes.$input.val());
                    $('select.curd_select').each(function(i, select) {
                        if (typeof select.hideList == 'function') {
                            select.hideList();
                        }
                    });
                });

            this.inputTriggerPlaceholder();
        };

        mainObj.prototype.inputTriggerPlaceholder = function() {
            this.nodes.$input.show();
            if (this.nodes.$selectOptions.length > 0) {
                var
                    $options = this.nodes.$selectOptions,
                    selected = false;

                $options.prop('selected', function(i, value) {
                    if (value) {
                        selected = true;
                    }
                });

                if (!selected) {
                    if (this.options.placeholder) {
                        this.nodes.$input.prop('placeholder', this.nodes.$select.attr('placeholder'));
                    }

                    /*if (this.options.autocomplete) {
                        this.nodes.$input.focus();
                    }*/
                } else {
                    this.nodes.$input.prop('placeholder', '');
                    if (!this.options.autocomplete) {
                        this.nodes.$input.hide();
                    }
                }
            } else {
                if (this.options.placeholder) {
                    this.nodes.$input.prop('placeholder', this.nodes.$select.attr('placeholder'));
                } else if (!this.options.autocomplete) {
                    this.nodes.$input.hide();
                }
            }

            this.inputScale();
        };

        mainObj.prototype.inputScale = function(text) {
            var
                $input = this.nodes.$input,
                style_block = "position:absolute; left: -1000px; top: -1000px; display:none; background-color:#0f0; top:0; left:0;",
                styles = ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'],
                maxWidth = this.nodes.$selectContainer.outerWidth(),
                $div, width,
                paddingRight = (this.nodes.$arrowButton.is(':visible') ? this.nodes.$arrowButton.outerWidth() : 0)  + (this.options.autocomplete ? this.nodes.$loupeButton.outerWidth() : 0) + 15;

            text = text || $input.val() || $input.prop('placeholder');

            styles = $.map(styles, function(property) {
                var value = $input.css(property);
                //не жрет конкатенацию 'font-family: "Trebuchet MS";', так что заменяем кавычки
                if (value && value.indexOf('"') != -1) {
                    value = value.replace(/"/g, '\'');
                }

                return property + ':' + value + ';';
            }).join(' ');

            $div = $('<div style="' + styles + style_block + '">' + text + '</div>');
            $('body').append($div);
            width = $div.width();
            $div.remove();

            if (width + 15 > maxWidth - paddingRight) {
                width = maxWidth - paddingRight;
            } else {
                width = width + 15;
            }

            $input.width(width);
        };

        mainObj.prototype.selectedItem = function() {
            var
                $options = this.nodes.$selectOptions,
                selected = false;

            $options.prop('selected', function(i, value) {
                if (value && $options.eq(i).val() !== '') {
                    selected = true;
                    $options.eq(i).data('$item').trigger('click');
                }
            });

            if (!selected && !this.options.multiple && !this.options.autocomplete) {
                if (this.options.placeholder) {
                    this.nodes.$selectWrapper
                        .text($.trim(this.nodes.$select.attr('placeholder')))
                        .addClass('placeholder main_item');
                }
            }
        };

        mainObj.prototype.selectEvent = function() {
            var that = this;

            this.nodes.$selectContainer.bind('click.curd', function(e) {
                if (that.options.isDisabled() || !that.nodes.$selectOptions || (that.nodes.$selectOptions && that.nodes.$selectOptions.length < 1)) {
                    return false;
                }

                var $target = $(e.target);

                if (that.options.autocomplete) {
                    if (that.nodes.$selectOptions.length > 0) {
                        if (!$target.hasClass('arrow_button') && !$target.hasClass('clear_item')) {
                            that.dropMenuHide();
                            that.nodes.$input.show().focus();
                        } else if (!that.options.showDropMenu && $target.hasClass('arrow_button') && !$target.hasClass('clear_item')) {
                            that.dropMenuShow();
                            that.nodes.$input.blur();
                        } else {
                            that.dropMenuHide();
                        }
                    } else {
                        that.nodes.$input.show().focus();
                    }
                } else {
                    if (!that.options.showDropMenu && !$target.hasClass('clear_item')) {
                        that.dropMenuShow();
                    } else {
                        that.dropMenuHide();
                    }
                }

                return false;
            });

            this.nodes.$selectContainer.bind('dblclick', function() {
                if (that.options.isDisabled()) {
                    return false;
                }

                that.nodes.$input.select();
            });
        };

        mainObj.prototype.selectChangeEvent = function() {
            var that = this;
            this.nodes.$select.unbind('change.curd').bind('change.curd', function() {
                if (!that.options.buildComplete) {
                    return false;
                }
            });
        };

        mainObj.prototype.dropMenuShow = function() {
            if (this.options.isDisabled()) {
                return false;
            }

            hideFunc();

            this.dropMenuReposition();
            this.nodes.$dropList.show();
            this.options.showDropMenu = true;
            this.nodes.$selectContainer.addClass('curd_select__open');

            $(document).bind('click.curd', hideFunc);

            $(window).bind('resize.curd', function() {
                $('.curd_select select').each(function(i, select) {
                    select.reposition();
                });
            });

            function hideFunc() {
                $('.curd_select select').each(function(i, select) {
                    select.hideList();
                });
            }
        };

        mainObj.prototype.dropMenuHide = function() {
            if (!this.options.showDropMenu) {
                return false;
            }

            this.nodes.$dropList.hide();
            this.options.showDropMenu = false;
            this.nodes.$selectContainer.removeClass('curd_select__open');

            $(window).unbind('.curd');
            $(document).unbind('.curd');
        };

        mainObj.prototype.dropMenuReposition = function() {
            var $autocomplete = $('.ui-autocomplete:visible'),
                width = this.nodes.$selectContainer.outerWidth(),
                left = this.nodes.$selectContainer.offset().left,
                top = this.nodes.$selectContainer.offset().top + this.nodes.$selectContainer.outerHeight(),
                styles = {
                    'width' : Math.round(width - 2),
                    'left'  : Math.round(left),
                    'top'   : Math.round(top)
                };

            if ($autocomplete.length > 0) {
                $autocomplete.css(styles);
            } else {
                this.nodes.$dropList.css(styles);
            }
        };

        mainObj.prototype.userValueSelect = function(params) {
            var rollback = params && params.rollback ? true : false,
                that = this;

            that.nodes.$selectOptions.each(function(i, option) {
                var $option = $(option);
                if ((rollback && $option.val() == that.options.beforeValue) ||
                    $option.val() == params.value) {
                    $option.data('$item').trigger('click');
                    return false;
                }
            });
            this.hintsChecked();
        };

        mainObj.prototype.disabledTrigger = function() {
            var that = this;

            function enabled() {
                that.nodes.$selectContainer
                    .removeClass('disabled')
                    .find('input, select')
                    .removeAttr('disabled')
                    .focus();
            }

            function disabled() {
                that.nodes.$selectContainer
                    .addClass('disabled')
                    .find('input, select')
                    .attr('disabled', 'disabled');
            }

            return {
                disabled : function() {
                    disabled();
                },
                enabled : function() {
                    enabled();
                },
                init : function() {
                    if (that.options.isDisabled()) {
                        disabled();
                    }
                }
            };
        };

        mainObj.prototype.clickDropItem = function($li) {
            var
                that = this,
                $liSelected,
                $clearButton;

            $li.unbind('click.curd').bind('click.curd', function(e) {
                var $option = $li.data('$option'),
                    currentOptionIsDefault = $option.attr('value') == -1,
                    $defaultOption = that.nodes.$emptyNode;

                //мультиселект
                if (that.options.multiple && !$li.hasClass('selected') && !$li.hasClass('disabled')) {
                    $option.prop('selected', 'selected');
                    $li.addClass('selected');
                    $clearButton = $('<span class="clear_item"></span>');
                    $liSelected = $('<li class="multiple' + (currentOptionIsDefault ? ' no_clear' : '') + '">' + $.trim($li.text()) + '</li>').append($clearButton);

                    $liSelected.insertBefore(that.nodes.$selectWrapper);

                    if (!currentOptionIsDefault && $defaultOption.length && $defaultOption.is(':selected')) {
                        $defaultOption.data('$item').trigger('click');
                    } else if (currentOptionIsDefault && $defaultOption.length) {
                        if ($defaultOption.is(':selected')) {
                            that.nodes.$selectOptions.filter(':selected').not('[value="-1"]').each(function (i, item) {
                                var $item = $(item);
                                $item.data('$item').trigger('click');
                            });
                        }
                    }

                    if (e.pageX) {
                        that.nodes.$select.trigger('change.curd');
                    }

                    $clearButton.bind('click.curd', function(e) {
                        if (that.options.isDisabled()) {
                            return false;
                        }

                        $li.removeClass('selected');
                        if (!that.options.autocomplete) {
                            $option.removeAttr('selected');
                        } else {
                            $option.remove();
                            $li.remove();
                            that.nodes.$selectOptions = that.nodes.$select.children();
                        }
                        $liSelected.remove();
                        that.inputTriggerPlaceholder();
                        that.hintsChecked();

                        if (that.nodes.$selectOptions.filter(':selected').length < 1 && that.nodes.$emptyNode.length && !that.nodes.$emptyNode.is(':selected')) {
                            var defaultOption = that.nodes.$emptyNode;
                            that.userValueSelect({
                                rollback: true,
                                value: defaultOption.val()
                            });
                        }

                        if (e.pageX) {
                            that.nodes.$select.trigger('change.curd');
                        }
                    });

                    //нет мультиселекта
                } else if (!that.options.multiple && !$li.hasClass('selected') && !$li.hasClass('disabled')) {
                    if (!that.options.autocomplete) {
                        that.nodes.$selectWrapper
                            .text($.trim($li.text()))
                            .removeAttr('class')
                            .addClass($option.prop('class') + ' single main_item')
                            .width(that.nodes.$select.outerWidth() - that.nodes.$arrowButton.outerWidth() - parseInt(that.nodes.$selectContent.css('padding-left'), 10))
                            .attr('title', $.trim($option.text()));
                    } else {
                        that.nodes.$input.val($.trim($li.text()));
                    }

                    var change = false;
                    if (!$li.hasClass('selected')) {
                        change = true;
                    }

                    that.options.beforeValue = that.nodes.$select.val();
                    that.nodes.$selectOptions.each(function(i, option) {
                        $(option).data('$item').removeClass('selected');
                    });
                    $option.prop('selected', 'selected');
                    $li.addClass('selected');

                    if (change) {
                        that.nodes.$select.trigger('change');
                    }

                    //except range
                    /*if (!that.nodes.$selectOptions.filter('[selected]').length) {
                        that.userValueSelect({
                            rollback: true,
                            value: that.nodes.$selectOptions.filter('[default]').val()
                        });
                    }*/
                } else if (that.options.multiple && $li.hasClass('selected') && !$li.hasClass('disabled')) {
                    $clearButton.trigger('click');
                } else {
                    return false;
                }

                that.inputTriggerPlaceholder();
                that.dropMenuHide();
                return false;
            });
        };

        mainObj.prototype.hintsInit = function() {
            var $hints = this.nodes.$hints,
                $select = this.nodes.$select,
                $options = this.nodes.$selectOptions;

            //чекнуть группу
            $hints.each(function(i, hint) {
                var $hint = $(hint);

                $hint.bind('click', function() {
                    var values = $hint.data('curd-value') + '',
                        changeOptions = [],
                        $option,
                        showCounter = 0;

                    //значение не задано - валим
                    if (!values || values.length < 1) {
                        return false;
                    }

                    //собираем значение/-я в массив
                    values = values.indexOf(',') > 0 ? values.split(',') : [values];

                    //собираем массив опшинов, которые нужно чекнуть
                    for (var i = 0; i < values.length; i++) {
                        $option = $options.filter('[value="' + values[i] + '"]');
                        changeOptions.push($option);
                    }

                    //инкрементим переменную, если опшен уже чекнут
                    for (i = 0; i < changeOptions.length; i++) {
                        if (changeOptions[i].prop('selected')) {
                            showCounter += 1;
                        }
                    }

                    /*идем по опшинам, которые нужно чекнуть,
                    если количество нужных опшинов совпадает с количеством нужных-чекнутых
                    переключаем видимость всему набору, иначе добавляем только нечекнутые*/
                    for (i = 0; i < changeOptions.length; i++) {
                        //тупо меняем видимость
                        if (showCounter == changeOptions.length) {
                            $select.get(0).rollback({value : changeOptions[i].val()});
                            //иначе показываем недостающие
                        } else if (!changeOptions[i].prop('selected')) {
                            $select.get(0).rollback({value : changeOptions[i].val()});
                        }
                    }
                });
            });
        };

        mainObj.prototype.hintsChecked = function() {
            var that = this,
                selectValues = that.nodes.$select.val(),
                hintChecked, hintValues;

            if (that.nodes.$hints.length > 0) {
                that.nodes.$hints.parent().removeClass('active');
                if (!selectValues || selectValues.length < 0) {
                    return false;
                }


                for (var hintsCounter = 0; hintsCounter < that.nodes.$hints.length; hintsCounter++) {
                    hintValues = that.nodes.$hints.eq(hintsCounter).data('curd-value');
                    hintChecked = new Array(hintValues.length);

                    if (!hintValues || hintValues.length < 1) {
                        return false;
                    }

                    for (var hintValuesCounter = 0; hintValuesCounter < hintValues.length; hintValuesCounter++) {
                        for (var selectValuesCounter = 0; selectValuesCounter < selectValues.length; selectValuesCounter++) {
                            if (hintValues[hintValuesCounter] == selectValues[selectValuesCounter]) {
                                hintChecked[hintValuesCounter] = true;
                                break;
                            } else if (selectValuesCounter == selectValues.length - 1) {
                                hintChecked[hintValuesCounter] = false;
                            }
                        }
                    }

                    for (hintValuesCounter = 0; hintValuesCounter < hintValues.length; hintValuesCounter++) {
                        if (hintChecked[hintValuesCounter]) {
                            if (hintValuesCounter == hintValues.length - 1) {
                                that.nodes.$hints.eq(hintsCounter).parent().addClass('active');
                            }
                        } else {
                            break;
                        }
                    }
                }
            }
        };

        return new mainObj();
    }

    $('.curd_select select, select.curd_select').curd();
});
(function ($) {
    var BomBom = function() {
        var that = this;

        this.url = 'http://delivery-dashboard.brg.loc/status';

        this.init = function() {
            this.list = {
                $list           : $('#list'),
                items           : [],
                screenWidth     : window.outerWidth,
                screenHeight    : window.outerHeight,
                scrollTimeout   : 5 * 1000
            };

            function refreshPage(ms) {
                ms = ms || 30 * 60 * 1000;  //30 min
                setTimeout(function() {
                    $.ajax({
                        url : that.url,
                        type: 'GET',
                        dataType : 'json'
                    }).done(function(data) {
                        if (data && data.length > 0) {
                            window.location.href = window.location.href;
                        } else {
                            ms = 3000;
                            refreshPage(ms);
                        }
                    }).error(function() {
                        ms = 3000;
                        refreshPage(ms);
                    });

                }, ms);
            }
            refreshPage();

            this.getData();
        };

        this.update = function() {
            if (this.oldData) {
                refresh();
            } else {
                create();
            }

            function create() {
                var $list = that.list.$list;

                for (var itemCounter = 0; itemCounter < that.data.length; itemCounter++) {
                    var newItem = that.data[itemCounter];
                    var $newItem = new that.Item();

                    $newItem.update(newItem);
                    $list.append($newItem);
                    that.list.items.push({
                        $item   : $newItem,
                        id      : newItem[0],
                        status  : newItem[1],
                        action     : false
                    });
                }
            }

            function refresh() {
                var list = that.list;

                for (var itemCounter = 0; itemCounter < list.items.length; itemCounter++) {
                    list.items[itemCounter].use = false;
                }

                for (itemCounter = 0; itemCounter < that.data.length; itemCounter++) {
                    var newItem = that.data[itemCounter];

                    for (var i = 0; i < that.list.items.length; i++) {
                        if (list.items[i].id == newItem[0]) {
                            if (list.items[i].status != newItem[1]) {
                                list.items[i].$item.update(newItem);
                                list.items[i].$item.updateStatus(newItem[1]);
                                list.items[i].status = newItem[1];
                            } else if (newItem[2]) {
                                list.items[i].$item.update(newItem);
                            }
                            list.items[i].use = true;
                            break;
                        } else if (i == that.list.items.length - 1) {
                            var $newItem = new that.Item();
                            $newItem.update(newItem);
                            $newItem.updateStatus(newItem[1]);
                            that.list.items.push({
                                $item   : $newItem,
                                id      : newItem[0],
                                status  : newItem[1],
                                use     : true
                            });


                            for (var j = 0; j < list.items.length; j++) {
                                if (newItem[0].slice(-6) == list.items[j].id.slice(-6)) {
                                    if (newItem[0].substr(-7).substr(0,2) < list.items[j].id.substr(-7).substr(0,2)) {
                                        $newItem.insertBefore(list.items[j].$item);
                                        $newItem.updateStatus(newItem[1]);
                                        break;
                                    } else if (j == list.items.length - 1) {
                                        list.$list.append($newItem);
                                        $newItem.updateStatus(newItem[1]);
                                        break;
                                    }
                                } else {
                                    if (newItem[0].slice(-6) < list.items[j].id.slice(-6)) {
                                        $newItem.insertBefore(list.items[j].$item);
                                        $newItem.updateStatus(newItem[1]);
                                        break;
                                    } else if (j == list.items.length - 1) {
                                        list.$list.append($newItem);
                                        $newItem.updateStatus(newItem[1]);
                                        break;
                                    }
                                }
                            }

                            //todo для 5 чисел
/*                            for (var j = 0; j < list.items.length; j++) {
                                if (newItem[0].slice(-5) == list.items[j].id.slice(-5)) {
                                    if (newItem[0].substr(-7).substr(0,2) < list.items[j].id.substr(-7).substr(0,2)) {
                                        $newItem.insertBefore(list.items[j].$item);
                                        $newItem.hide().add();
                                        break;
                                    } else if (j == list.items.length - 1) {
                                        list.$list.append($newItem);
                                        $newItem.hide().add();
                                        break;
                                    }
                                } else {
                                    if (newItem[0].slice(-5) < list.items[j].id.slice(-5)) {
                                        $newItem.insertBefore(list.items[j].$item);
                                        $newItem.hide().add();
                                        break;
                                    } else if (j == list.items.length - 1) {
                                        list.$list.append($newItem);
                                        $newItem.hide().add();
                                        break;
                                    }
                                }
                            }*/
                        }
                    }
                }

                for (itemCounter = 0; itemCounter < list.items.length; itemCounter++) {
                    if (!list.items[itemCounter].use) {
                        list.items[itemCounter].$item.remove();
                    }
                }

                that.list.items = $.grep(that.list.items, function(value) {
                    return value.use != false;
                });
            }
        };

        this.Item = function() {
            var $item = $('<li class="item"><!--<span class="index"></span>--><span class="marker"></span><span class="text"></span></li>');

            $item.update = function(data) {
                var status = /item_\w+/.exec(this.attr('class'));
                if (status) {
                    this.removeClass(status[0]);
                }

                this
                    .addClass('item_' + data[1])
                    .find('.text').text(data[2]/*data[0].slice(-6)*/);

//todo: для 5 чисел и 2х контрольных
                /*                .find('.text').text(data[0].slice(-5));
                if (data[2]) {
                    this.find('.index').text(data[0].substr(-7).substr(0,2));
                }*/
            };

            $item.updateStatus = function(color) {
                if (color != '3') {
                    return false;
                }

                color = '#e2eecf';

/*                switch (color) {
                    case '1':
                        color = '#ccc';
                        break;
                    case '2':
                        color = '#fbce00';
                        break;

                    case '3':
                        color = '#6da90e';
                        break;
                }*/
                $item
                    .css({'background-color' : color})
                    .animate({'background-color': '#fff'}, 3 * 60 * 1000);
            };

            return $item;
        };

        this.progressBar = {
            $progressBarWrap    : $('#progressBar'),
            $progressBar        : $('#progressBar div'),
            columns             : 1,
            pages               : 1,
            currentPage         : 1,
            pageScrollStep      : 0,
            pageScrollTo        : 0,
            progressBarScrollStep : 0,
            progressBarScrollTo : 0,
            columnsOnPage       : 1,
            init                : function() {
                var rows = 13,
                    cols = 1;
                this.columns = Math.ceil(that.list.items.length / rows);
                this.pages = Math.ceil(that.list.items.length / (rows * cols));

                if (this.columns > this.columnsOnPage) {
                    if (!this.$progressBarWrap.is(':visible')) {
                        this.$progressBarWrap.show();
                    }
                    this.pageScrollStep = that.list.items[0].$item.width() + parseInt(that.list.items[0].$item.css('padding-left')) + parseInt(that.list.items[0].$item.css('padding-right'));
                    this.progressBarScrollStep = this.$progressBarWrap.width() / this.columns;
                    var progressBarWidth = this.progressBarScrollStep * this.columnsOnPage;
                    this.$progressBar.width(progressBarWidth);
                } else {
                    this.$progressBarWrap.hide();
                }
            },
            scrollPage          : function() {
                if (this.columns > this.columnsOnPage) {
                    if (this.currentPage < this.pages) {
                        var scrollColumns = this.currentPage * this.columnsOnPage;
                        if (this.columns - scrollColumns >= this.columnsOnPage) {
                            this.progressBarScrollTo = this.progressBarScrollTo + (this.progressBarScrollStep * this.columnsOnPage);
                            this.pageScrollTo = this.pageScrollTo + (this.pageScrollStep * this.columnsOnPage);
                        } else {
                            this.progressBarScrollTo = this.progressBarScrollTo + (this.progressBarScrollStep * ((this.columns - scrollColumns) % this.columnsOnPage));
                            this.pageScrollTo = this.pageScrollTo + (this.pageScrollStep * ((this.columns - scrollColumns) % this.columnsOnPage));
                        }

                        this.$progressBar.animate({'margin-left': this.progressBarScrollTo}, 700, 'linear');
                        that.list.$list.animate({'left': -(this.pageScrollTo)}, 700, 'linear', function() {callback();});
                        this.currentPage++;
                    } else {
                        this.progressBarScrollTo = 0;
                        this.pageScrollTo = 0;
                        this.$progressBar.animate({'margin-left': this.progressBarScrollTo}, 700, 'linear');
                        that.list.$list.animate({'left': this.pageScrollTo},700, 'linear', function() {callback();});
                        this.currentPage = 1;
                    }
                    return false;
                } else {
                    callback();
                }

                function callback() {
                    if (that.progressBar.currentPage == 1) {
                        clearTimeout(that.timer);
                        that.getData(1);
                    } else {
                        clearTimeout(that.timer);
                        that.timer = setTimeout(function() {
                            that.progressBar.scrollPage();
                        }, that.list.scrollTimeout);
                    }
                }
            }
        };

        this.getData = function(refresh) {
            $.ajax({
                url : that.url,
                type: 'GET',
                dataType : 'json'
            }).done(function(data) {


/*                if (refresh) {
                    data[data.length] = ["01300001","1"];
                    data[data.length] = ["01200001","2"];
                    data[data.length] = ["97898135","3"];
                    data[data.length] = ["00100001","3"];
                    data[data.length] = ["00000001","3"];
                    data[data.length] = ["99100001","3"];
                    data[data.length] = ["99000001","3"];
                    data[data.length] = ["99998135","3"];
                    data[data.length] = ["99888135","3"];
                    data[data.length] = ["99988135","3"];
                    data[data.length] = ["99978135","3"];
                    data[data.length] = ["99888112","3"];
                    data[data.length] = ["99988132","3"];
                    data[data.length] = ["99978235","3"];
                    data[data.length] = ["99222225","3"];
                    data[data.length] = ["99222325","3"];
                }*/

//todo: для 5 чисел и 2х контрольных
/*                data.sort(function(a,b){
                    var a1 = a[0].slice(-5);
                    var a2 = a[0].substr(-7).substr(0,2);
                    var b1 = b[0].slice(-5);
                    var b2 = b[0].substr(-7).substr(0,2);

                    if (a1 > b1) {
                        return 1;
                    } if (a1 == b1) {
                        a[2] = 1;
                        b[2] = 1;
                        return a2 - b2;
                    }
                });*/

                /*data.sort(function(a,b){
                    a = a[0].slice(-6);
                    b = b[0].slice(-6);

                    return a-b;
                });*/

                if (that.data) {
                    that.oldData = that.data;
                }

                that.data = data;
                that.update();

                that.progressBar.init();
                that.timer = setTimeout(function() {
                    clearInterval(that.timer);
                    that.progressBar.scrollPage();
                }, that.list.scrollTimeout);
            }).error(function() {
                setTimeout(function() {
                    that.getData();
                }, 2000);
            });
        };

        this.init();
    };

    return new BomBom();
})(jQuery);

$(function() {
    var $list = $('#list'),
        $legend = $('.legend_align'),
        $body = $('body'),
        width, height, _height, maxFontSize, listHeight;

    function screenOrientation() {

        $body.removeAttr('style');
        width = window.screen.width;
        height = window.screen.height;
/*        width = $body.width();
        height = $body.height();*/

/*        width = 720;
        height = 1280;*/

        width = 1080;
        height = 1920;

        if (width > height) {
            _height = height;
            height = width;
            width = _height;
        }

        $body.css({
            'width'     : width,
            'height'    : height
        });
        maxFontSize = Math.round(height * 100 / 1920);
        var legendMaxFontSize = Math.round(height * 100 / 1920);
        /*listHeight = 1520 * 100 / 1920;*/
        $list.css({
            'font-size' : maxFontSize + '%',
            'height'    : listHeight + '%'
        });

        $legend.css({
            'font-size' : legendMaxFontSize + '%'
        });
    }
    screenOrientation();

    $(window).resize(function() {
        screenOrientation();
    });
});
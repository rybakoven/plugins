function cartPhotoGallery() {
    var $gallery = $('.photo_gallery');
    if ($gallery.length > 0) {
        return new Gallery($gallery);
    } else {
        return false;
    }

    function Gallery($obj) {
        var that = this;

        this.nodes = {
            $wrapper    : $obj,
            $thumbList  : $obj.find('ul'),
            $previewBlock : $obj.find('.preview__block'),
            $preview    : $obj.find('.preview_img__container'),
            $fullSize   : $obj.find('.zoom__block'),
            $zoomArea   : $obj.find('.zoom__area'),
            $loader     : $obj.find('.loader__container')
        };

        this.nodes.images  = {
            $thumb : $obj.find('ul img'),
            $preview : $obj.find('.preview_img__container img'),
            $fullsize : $obj.find('.zoom__block img')
        };

        this.mouse = { x : 0, y : 0 };
        this.currentImage = 0;

        this.build = function() {
            var that = this,
                $moreItem = that.nodes.$thumbList.find('.more_items');

            if ($moreItem.length) {
                that.nodes.$thumbList.data('default-height', that.nodes.$thumbList.height());
                that.nodes.$thumbList.height($moreItem.height() + 2);
                $moreItem.bind('click', function(e) {
                    $moreItem.hide();
                    that.nodes.$thumbList.animate({'height' : that.nodes.$thumbList.data('default-height') - 10}, 300);
                    e.preventDefault();
                    return false;
                });
            }

            that.createImg();

            that.nodes.$thumbList.find('li').eq(0).addClass('active');
            that.nodes.$thumbList.find('li').bind('click', function(e) {
                var $img = e.target.tagName != 'IMG' ? $(e.target).closest('li').find('img') : $(e.target),
                    $parent = $img.parent();

                if (!$parent.hasClass('active') && !$parent.hasClass('more_items')) {
                    that.zoom.hide();
                    that.currentImage = $img.data('index');
                    that.createImg();
                    that.nodes.$thumbList.find('li').removeClass('active');
                    $parent.addClass('active');
                }

                e.preventDefault();
                return false;
            });
        };

        this.nodes.$previewBlock
            .bind('mouseenter', function(e) {
                that.mouse.x = e.pageX;
                that.mouse.y = e.pageY;
                that.zoom.show();
            })
            .bind('mouseleave', function(e) {
                that.mouse.x = e.pageX;
                that.mouse.y = e.pageY;
                that.zoom.hide();
            });

        this.zoom = {
            show : function() {
                if (that.nodes.images.$preview.eq(that.currentImage).attr('src').length && that.nodes.images.$preview.eq(that.currentImage).data('load') !== 'error') {
                    that.nodes.$fullSize.show();
                    if (that.nodes.images.$fullsize.data('load') && that.nodes.images.$fullsize.eq(that.currentImage).data('load') !== 'error') {
                        that.nodes.$zoomArea.eq(that.currentImage).show();
                    }
                }
            },

            hide : function() {
                that.nodes.$fullSize.hide();
                that.nodes.$zoomArea.eq(that.currentImage).hide();
                $(window).unbind('resize.zoom');
            }
        };

        this.moveCursor = {
            enable : function() {
                var maxWidth = $('.part_description__description_block').width(),
                    maxHeight = ($('.part_description__popup__content').height() || $('.part_description__photo_row').height()) - 50,
                    imgWidth, imgHeight;

                for (var i = 0; i < that.nodes.images.$fullsize.length; i++) {
                    if (i != that.currentImage) {
                        that.nodes.images.$fullsize[i].style.display = 'none';
                    } else {
                        that.nodes.images.$fullsize[i].style.display = 'block';
                    }
                }

                that.nodes.$fullSize.show();
                imgWidth = that.nodes.images.$fullsize[that.currentImage].clientWidth;
                imgHeight = that.nodes.images.$fullsize[that.currentImage].clientHeight;
                that.nodes.$fullSize.hide();

                that.nodes.$fullSize.css({
                    'width': maxWidth > imgWidth ? imgWidth : maxWidth,
                    'height': maxHeight > imgHeight ? imgHeight : maxHeight
                });

                var previewImgWidth = that.nodes.images.$preview[that.currentImage].clientWidth,
                    previewImgHeight = that.nodes.images.$preview[that.currentImage].clientHeight,

                    zoomBlockWidth = maxWidth > imgWidth ? imgWidth : maxWidth,
                    zoomBlockHeight = maxHeight > imgHeight ? imgHeight : maxHeight,

                    zoomAreaWidth = Math.round(zoomBlockWidth / imgWidth * previewImgWidth),
                    zoomAreaHeight = Math.round(zoomBlockHeight / imgHeight * previewImgHeight),

                    offsetWidth = Math.round(that.nodes.$preview.eq(that.currentImage).width()),
                    offsetHeight = Math.round(that.nodes.$preview.eq(that.currentImage).height());

                that.nodes.$zoomArea.eq(that.currentImage)
                    .width(zoomAreaWidth)
                    .height(zoomAreaHeight);

                that.nodes.$previewBlock.unbind('mousemove.zoom').bind('mousemove.zoom', function(e) {
                    animate(e);
                });

                function animate(e) {
                    /*if (e.target.tagName == 'IMG' && e.target.parentNode.getAttribute('src').indexOf('fullsize') > -1) {
                     that.zoom.hide();
                     return false;
                     }*/

                    if (that.nodes.images.$fullsize.is(':hidden') && !isNaN(parseInt(e.pageX, 10))) {
                        that.zoom.show();
                    }

                    if (e.pageX) {
                        that.mouse.x = e.pageX;
                        that.mouse.y = e.pageY;
                    }

                    var mouseX = Math.round((e.pageX >= 0 ? e.pageX : that.mouse.x) - that.nodes.$preview.eq(that.currentImage).offset().left),
                        mouseY = Math.round((e.pageY >= 0 ? e.pageY : that.mouse.y) - that.nodes.$preview.eq(that.currentImage).offset().top),

                        bigImgWidthRatio = imgWidth / previewImgWidth,
                        bigImgHeightRatio = imgHeight / previewImgHeight,
                        left,
                        top;

                    if (mouseX - zoomAreaWidth / 2 < 0) {
                        left = 0;
                    } else {
                        if (mouseX + zoomAreaWidth / 2 > offsetWidth) {
                            left = offsetWidth - zoomAreaWidth;
                        } else {
                            left = mouseX - zoomAreaWidth / 2;
                        }
                    }
                    if (mouseY - zoomAreaHeight / 2 < 0) {
                        top = 0;
                    } else {
                        if (mouseY + zoomAreaHeight / 2 > offsetHeight) {
                            top = offsetHeight - zoomAreaHeight;
                        } else {
                            top = mouseY - zoomAreaHeight / 2;
                        }
                    }

                    that.nodes.$zoomArea.eq(that.currentImage).css({
                        left : Math.round(left),
                        top : Math.round(top)
                    });

                    var fullLeft = 0 - (left - ((offsetWidth - previewImgWidth) / 2)) * bigImgWidthRatio,
                        fullTop = 0 - (top - ((offsetHeight - previewImgHeight) / 2)) * bigImgHeightRatio;

                    fullLeft = fullLeft < 0 - (imgWidth - zoomBlockWidth) ? 0 - (imgWidth - zoomBlockWidth) : fullLeft;
                    fullTop = fullTop < 0 - (imgHeight - zoomBlockHeight) ? 0 - (imgHeight - zoomBlockHeight) : fullTop;

                    $(that.nodes.images.$fullsize[that.currentImage]).stop().animate({
                        left : fullLeft,
                        top : fullTop
                    }, 5);
                }

                that.nodes.$previewBlock.trigger('mousemove.zoom');
            }
        };

        this.createImg = function() {
            var images = that.nodes.images;
            that.nodes.$preview.hide();
            that.nodes.$preview.eq(that.currentImage).show();

            for (var image in images) {
                if (image == '$thumb' && !images[image][that.currentImage].getAttribute('src')) {
                    for (var thumbCount = 0; thumbCount < images[image].length; thumbCount++) {
                        loader(images[image][thumbCount]);
                        images[image][thumbCount].onload = loadComplete;
                        images[image][thumbCount].onerror = errorLoad;
                        images[image][thumbCount].src = images[image][thumbCount].getAttribute('data-src');
                    }
                } else if (!images[image][that.currentImage].getAttribute('src')) {
                    loader(images[image][that.currentImage]);
                    images[image][that.currentImage].onload = loadComplete;
                    images[image][that.currentImage].onerror = errorLoad;
                    images[image][that.currentImage].src = images[image][that.currentImage].getAttribute('data-src');
                } else {
                    loader(images[image][that.currentImage]);
                    loadComplete.call(images[image][that.currentImage]);
                }
            }

            function loader (img) {
                var obj = document.createElement('span');

                obj.className = 'load_img';
                obj.innerHTML = '<img src="/bundles/bergsite/new/images/loading_blue.gif" alt=""><span class="overlay"></span>';

                img.parentNode.appendChild(obj);
                obj.style.display = 'block';

                img.loaderHide = function () {
                    obj.parentNode.removeChild(obj);
                };
            }

            function errorLoad() {
                this.setAttribute('data-load', 'error');
                this.loaderHide();
            }

            function loadComplete() {
                if (this.parentNode.getAttribute('data-type') == 'fullsize') {
                    this.setAttribute('data-load', 'true');
                    that.moveCursor.enable();
                    that.nodes.$previewBlock.trigger('mousemove.zoom');
                    $(window).unbind('resize.zoom').bind('resize.zoom', function() {
                        that.moveCursor.enable();
                    });
                }
                this.loaderHide();
            }
        };
        this.build();
    }
}
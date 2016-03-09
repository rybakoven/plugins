$(function() {
    jQuery.fn.gallery = function() {

        function Gallery(gallery) {
            this.options = {
                asGallery : $(gallery).hasClass('navigable') || false,
                currentImageCount : 0,
                isFullScreen : false
            };

            if (this.options.currentImageCount > 0) {
                this.options.currentImageCount--;
            }

            this.$container = $(gallery);
            this.$container.wrapInner('<div class="gallery_content"></div>');
            this.$galleryContent = this.$container.find('.gallery_content');
            this.$images = this.$container.find('a');
            this.$galleryImages = $('<div class="gallery_images"></div>');

            this.galleryInit();
        }

        Gallery.prototype.galleryInit = function() {
            var that = this;

            this.$nextButton = $('<div class="next_button__wrapper button__wrapper"><div class="next_button"><div class="item"><span>Следующая</span></div><div class="opacity"></div></div><div class="next_area"></div></div>');
            this.$backButton = $('<div class="back_button__wrapper button__wrapper"><div class="back_button"><div class="item"><span>Предыдущая</span></div><div class="opacity"></div></div><div class="back_area"></div></div>');
            this.$counter = $('<div class="counter_wrapper"><div class="counter"><div class="counter_values"><span class="count"></span> из <span class="length"></span></div><div class="counter_opacity"></div></div></div>');
            this.$closeButton = $('<div class="close_button"></div>');
            this.$galleryPopupWrapper = $('<div class="gallery_popup"></div>');
            this.$popupOpacity = $('<div class="gallery_opacity"></div>');

            this.$galleryPopupWrapper.append(this.$popupOpacity);

            //добавляем описание к каждой картинке, если есть
            this.$images.each(function (i, img) {
                var description = that.$images.eq(i).data('description'),
                    $description = $();

                if (description) {
                    $description = $('<div class="description">' + description + '</div>');
                }

                that.$galleryImages
                    .append($('<div class="img"></div>')
                        .append(that.$images.eq(i), $description));

                that.$images.eq(i).find('img').addClass('thumb');
            });

            //собираем галерею
            this.$container
                .append(this.$galleryContent
                    .append(this.$galleryImages, this.$backButton, this.$nextButton, this.$counter, this.$closeButton));

            //если вид как у галереи - ресайзим картинки и прочую ебалу
            if (this.options.asGallery) {
                this.galleryResize();
            }

            //клик по превью открывает полную входит/выходит из фуллскрина
            this.$images.bind('click', function(e) {
                that.options.isFullScreen = !that.options.isFullScreen;
                that.options.currentImageCount = $(e.target).closest('.img').index();
                that.rebuildGallery();
                e.preventDefault();
            });

            //события на кнопках вперед/назад
            this.$nextButton.add(this.$backButton).bind('click', function(e) {
                var isNextImage,
                    inc = 0,
                    $target = $(e.target);

                $target = $target.hasClass('button__wrapper') ? $target : $target.closest('.button__wrapper');

                if ($target.hasClass('back_button__wrapper')) {
                    isNextImage = that.backImage;
                    inc = -1;
                } else if ($target.hasClass('next_button__wrapper')) {
                    isNextImage = that.nextImage;
                    inc = 1;
                }

                if (isNextImage && !that.animated) {
                    that.animated = true;
                    that.options.currentImageCount = that.options.currentImageCount + inc;
                    if (that.options.isFullScreen) {
                        that.$images.hide();
                        that.galleryResize();
                        that.loadImage();
                        that.checkImages();
                    } else {
                        that.$galleryImages.animate({'margin-left': -that.options.currentImageCount * that.options.galleryWidth}, 200, 'linear', function () {
                            that.animated = false;
                        });
                        that.checkImages();
                    }
                } else {
                    e.preventDefault();
                }

                e.preventDefault();
            });

            this.$closeButton.bind('click', function(e) {
                that.options.isFullScreen = !that.options.isFullScreen;
                that.rebuildGallery();
                e.preventDefault();
            });

            $(window).bind('resize.gallery', function() {
                that.galleryResize();
            });

            this.checkImages();
        };

        Gallery.prototype.rebuildGallery = function() {
            var $html = $('html'),
                $header = $('#fixed_header_elems'),
                bodyMargin,
                that = this;

            if (this.options.isFullScreen) {

                bodyMargin = window.innerWidth - $html.width();

                $html.css({
                    'overflow' : 'hidden',
                    'margin-right' : bodyMargin
                });

                if ($header.hasClass('fixed')) {
                    $header.find('> div').css('padding-right', bodyMargin + 5);
                }

                this.$popupOpacity.css('right', bodyMargin);

                $('body')
                    .append(this.$galleryPopupWrapper
                        .append(this.$galleryContent)
                        .show());

                this.$popupOpacity.bind('click', function(e) {
                    that.$closeButton.trigger('click');
                    e.preventDefault();
                });

                this.$images.hide();
                this.galleryResize();
                this.loadImage();
                this.checkImages();

            } else {

                $html.add($header.find('> div'), 'body').removeAttr('style');
                this.$galleryContent.removeAttr('style');
                this.$images
                    .find('.full').hide().end()
                    .find('.thumb').show().end()
                    .removeAttr('style').parent().removeAttr('style');
                this.$container.append(this.$galleryContent);
                this.$galleryPopupWrapper.add(this.$loader, this.$loadImg).remove();
                this.options.isFullScreenInit = false;
                this.galleryResize();

            }
        };

        Gallery.prototype.galleryResize = function() {
            var currentImageCount = this.options.currentImageCount,
                ratio = 2/3,
                height,
                width,
                $currentImg,
                maxWidth,
                maxHeight,
                top = 0,
                $description;

            if (this.options.asGallery && !this.options.isFullScreen) {
                this.options.galleryWidth = this.$container.width();
                height = parseInt(this.options.galleryWidth * ratio, 10);

                this.$images
                    .parent().width(this.options.galleryWidth).end()
                    .css({
                        height : height,
                        'line-height' : height + 'px'
                    });

                this.$galleryImages.css({
                    width : this.options.galleryWidth * this.$images.length,
                    'margin-left' : - this.options.galleryWidth * currentImageCount
                });

                this.$nextButton.add(this.$backButton).height(height);

            } else if (this.options.isFullScreen) {

                $currentImg = this.$images.eq(currentImageCount);
                width = $currentImg.data('width');
                height = $currentImg.data('height');
                maxWidth = this.$popupOpacity.width() - 40;
                maxHeight = this.$popupOpacity.height() - 40; //отступы сверху снизу по 20

                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;

                    if (height < maxHeight) {
                        top = maxHeight / 2 - height / 2;
                    }
                }

                this.$nextButton.add(this.$backButton).height(height);

                if (this.$images.eq(currentImageCount).data('description')) {
                    $description = this.$images.eq(currentImageCount).siblings('.description');
                    height = height +
                        $description.height() +
                        parseInt($description.css('padding-top'), 10) +
                        parseInt($description.css('padding-bottom'), 10);
                }

                $currentImg.parent().width(width);
                this.$galleryImages.removeAttr('style');

                this.$galleryContent.css({
                    width : width,
                    height : height,
                    top : top
                });
            }
        };

        Gallery.prototype.closePopup = function() {
            this.$container.append(this.$galleryContent);
            this.$galleryPopupWrapper.remove();
            this.rebuildGallery();
        };

        Gallery.prototype.checkImages = function() {
            if (this.options.currentImageCount >= this.$images.length - 1) {
                this.$nextButton.attr('disabled', 'disabled');
                this.nextImage = false;
            } else {
                this.$nextButton.removeAttr('disabled');
                this.nextImage = true;
            }

            if (this.options.currentImageCount <= 0) {
                this.$backButton.attr('disabled', 'disabled');
                this.backImage = false;
            } else {
                this.$backButton.removeAttr('disabled');
                this.backImage = true;
            }

            this.$counter
                .find('.count').text(this.options.currentImageCount + 1).end()
                .find('.length').text(this.$images.length);
        };

        Gallery.prototype.Loader = function() {
            var that = this,
                $loader = $('<div class="gallery_loader"><img src="/bundles/bergsite/new/images/loading_blue.gif" alt=""><div class="opacity"></div></div>');

            $loader.show = function() {
                $loader.fadeIn(200);
            };

            $loader.hide = function() {
                $loader.fadeOut(200, function() {
                    $loader.remove();
                    that.$loader = null;
                });
            };

            return $loader;
        };

        Gallery.prototype.loadImage = function() {
            var $currentImageParent = this.$images.eq(this.options.currentImageCount),
                $description;

            this.$loadImg = $('<div class="img_loading"><img class="full" src="" alt=""></div>');

            if (this.$loader) {
                this.$loader.remove();
            }

            this.$galleryImages.find('.description').hide();
            $description = this.$images.eq(this.options.currentImageCount).parent().find('.description');

            $currentImageParent.removeAttr('style').hide();
            if (!this.$images.eq(this.options.currentImageCount).find('.full').length) {
                this.$loader = new this.Loader();
                this.$galleryImages.append(this.$loader, this.$loadImg);

                this.$loadImg.find('img').get(0).onload = (function(mainObj) {
                    return function() {
                        mainObj.$images.eq(mainObj.options.currentImageCount)
                            .css('display', 'inline-block')
                            .append(mainObj.$loadImg.find('img'))
                            .find('.thumb').hide();

                        $description.show();
                        mainObj.$loader.remove();
                        mainObj.checkImages();
                        mainObj.galleryResize();
                        mainObj.animated = false;
                    };
                })(this);

                this.$loadImg.find('img').attr('src', $currentImageParent.attr('href'));

            } else if (this.$images.eq(this.options.currentImageCount).find('.full').length) {

                this.$images.eq(this.options.currentImageCount)
                    .css('display', 'inline-block')
                    .find('.thumb').hide().end()
                    .find('.full').show();

                $description.show();
                this.galleryResize();
                this.animated = false;

            } else {
                $description.show();
                this.galleryResize();
                this.animated = false;
            }

            this.$galleryPopupWrapper.animate({scrollTop : 0});
        };

        $(this).each(function(i, gallery) {
            return new Gallery(gallery);
        });
    };

    $('.gallery').gallery();
});
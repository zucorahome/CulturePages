/*

    ecomdetails Controller for the View "ecomdetails"
    Copyright 2018, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();
    var Item = { code: U.GetURIParam('i') };
    if (Item.code) {

        function GetChildItems(ItemId) {
            U.AJAX('/API/Inventory/GetItemChildrenExt/' + ItemId, 'GET', false, false, 'silent').done(function (Results) {
                $.when(ItemTypePromise).done(function (ItemTypes) {
                    if (Results.length) {
                        if (ItemId != Item.id || Item.itemTypeId != ItemTypes.find(function (ITx) { return ITx.name == 'Group'; }).id) { // child items are Related Items
                            $('.zuc-ec-related-product-row').remove();
                            Results.forEach(function (Ix) {
                                var NewRel = RelItemUI.clone();
                                U.PopulateProductCard(Ix, NewRel, '.zuc-ec-related-product-image', true, '.zuc-ec-related-product-title', '.zuc-ec-related-product-price-reg', '.zuc-ec-related-product-price-mem');
                                RelatedCont.append(NewRel);
                            });
                            RelatedCont.fadeIn(300);
                        } else { // child items are group items
                            var Select = VariationCont.find('select').empty();
                            VariationCont.find('label').text(Item.model);
                            VariationCont.find('.zuc-input-name > span').text('Select ' + Item.model + ':');
                            Results.forEach(function (Ix) {
                                Select.append(VariationOptionUI.clone().attr('value', Ix.childItemId).text(Ix.model).data('lt-attachments', Ix.attachments).data('lt-msrp', Ix.msrp));
                            });
                            VariationCont.show();
                            Select.trigger('change');
                        }
                    }
                });
            });
        }
        function ShowProductImages(Attachments) {
            var Promise = new $.Deferred();
            SmallImgCont.empty();
            $('.zuc-ec-showcase-big-image img').attr('src', null).attr('alt', null).one('load', function () {
                Promise.resolve();
            });
            // thumbnails are not in use in control provided
            var Atts = Attachments
                .map(function (Ax) {
                    return {
                        address: Ax.address || Ax.addressLink,
                        description: Ax.description,
                    };
                })
                .filter(function (Ax) {
                    return /^eCommerceImage|^eCommerceSubImage/.test(U.GetFileNameFromAttachmentURL(Ax.address));
                })
                .sort(function (A, B) {
                    var AFN = U.GetFileNameFromAttachmentURL(A.address);
                    var BFN = U.GetFileNameFromAttachmentURL(B.address);
                    return AFN > BFN ? 1 : AFN < BFN ? -1 : 0;
                });
            if (Atts.length) {
                Atts.forEach(function (Ax, I) {
                    var NewSmallImg = SmallImgUI.clone();
                    NewSmallImg.find('img').attr('src', Ax.address).attr('alt', Ax.description).attr('onclick', 'changeMainImage(' + I + ')');
                    SmallImgCont.append(NewSmallImg);
                });
                SmallImgCont.find('img').first().trigger('click');
            } else {
                Promise.resolve();
            }
            return Promise;
        }
        function ShowProductInfo(Item) {
            if (Item) {
                // ITEM NUMBER
                $('.zuc-ec-product-info-id span:eq(1)').text(Item.code);
                // IN STOCK INDICATOR
                $('.zuc-ec-product-info-availability').text(Item.inStock ? 'IN STOCK' : 'OUT OF STOCK');
            }
        }
        function ShowProductPrices(MSRP) {
            if (MSRP) {
                var RegularPrice = U.PrintPrice(MSRP);
                $('.zuc-ec-product-info-price-reg span:eq(1)').text(RegularPrice);
                var MemberPrice = U.PrintMemberPrice(MSRP);
                $('.zuc-ec-product-info-price-mem span:eq(1)').text(MemberPrice);
            }
        }
        var SmallImgCont = null;
        var SmallImgUI = null;
        var InfoStack = null;
        var TabCont = null;
        var TabCaboose = null;
        var TabUI = null;
        var TabTextCont = null;
        var TabTextUI = null;
        var RelatedCont = null;
        var RelItemUI = null;
        var VariationCont = null;
        var VariationOptionUI = null;
        $(function () {
            // remove small images
            SmallImgCont = $('.zuc-ec-showcase-left');
            SmallImgUI = $('.zuc-ec-showcase-small-image').first().clone();
            SmallImgCont.empty();
            // info tabs
            InfoStack = $('.zuc-ec-det-infostack');
            TabCont = $('.zuc-ec-tabs');
            TabCaboose = $('.zuc-ec-tab-kaboose');
            TabUI = $('.zuc-ec-tab').first().clone();
            $('.zuc-ec-tab').remove();
            TabTextCont = $('.zuc-ec-container');
            TabTextUI = $('.zuc-ec-text-blob').first().clone();
            $('.zuc-ec-text-blob').remove();
            // remove related items and hide related section
            RelItemUI = $('.zuc-ec-related-product-row:eq(0)').clone();
            RelItemUI.find('.zuc-ec-related-product-image img').attr('src', null);
            RelatedCont = $('.zuc-ec-det-related').hide();
            $('.zuc-ec-related-product-row').remove();
            // remove extra variation field
            $('.zuc-ec-product-order-forms .zuc-ec-form-group').last().remove();
            VariationCont = $('.zuc-ec-product-order-forms .zuc-ec-form-group').first().hide();
            VariationOptionUI = VariationCont.find('select option:eq(1)').clone();
            VariationCont.find('select').on('change', function () {
                var SubItemId = $(this).val();
                GetChildItems(SubItemId);
                var Option = $(this).find('option:selected');
                ShowProductImages(Option.data('lt-attachments'));
                ShowProductPrices(Option.data('lt-msrp'));
                U.AJAX("/API/Inventory/ItemsExt?$filter=id eq " + SubItemId, 'GET', false, false, 'silent')
                    .then(function (Result) { ShowProductInfo(Result.items[0]); });
            });
            VariationCont.find('select').empty();
            $('<style>'
                + '.zuc-ec-form-group.--qty { margin-top: 0; width: 112px; }'
                + '@media (max-width: 640px) { .zuc-ec-form-group.--qty { margin-top: 20px; } }'
            + '</style>').appendTo('head');
        });

        var ItemPromise = U.AJAX("/API/Inventory/ItemsExt?$filter=code eq '" + Item.code + "'", 'GET', false, false, 'silent');
        var ItemTypePromise = LT.LTCodes.Get('ItemTypes');

        $(function () {
            $.when(ItemPromise, ItemTypePromise).done(function (Result, ItemTypes) {
                Item = Result[0].items[0];
                if (Item) {
                    // DESCRIPTION
                    $('h1').text(Item.description);
                    $('title').text('Zucora | ' + Item.description);
                    // PRODUCT IMAGES
                    ShowProductImages(Item.attachments).done(function () {
                        U.ShowUI();
                    });
                    // PRICE
                    ShowProductPrices(Item.msrp);
                    // ITEM # and STOCK INDICATOR
                    ShowProductInfo(Item);
                    // PRODUCT DETAILS
                    var SplitOn = /<h4>.+<\/h4>/g;
                    var Headings = Item.details ? Item.details.match(SplitOn) : null;
                    if (Headings instanceof Array && Headings.length) {
                        Headings = Headings.map(function (Hx) { return Hx.substr(4, Hx.length - 9); });
                        var Info = Item.details.split(SplitOn).filter(function (InfoX) { return !!InfoX; }).map(function (InfoX) { return InfoX.trim(); });
                        Headings.forEach(function (Hx, I) {
                            var NewTab = TabUI.clone();
                            NewTab.attr('onclick', 'changeTab(' + I + ')');
                            NewTab.find('.zuc-ec-tab-title').text(Hx);
                            TabCaboose.before(NewTab);
                            var NewText = TabTextUI.clone();
                            NewText.html(Info[I]);
                            TabTextCont.append(NewText);
                        });
                        TabCont.find('.zuc-ec-tab:eq(0)').trigger('click');
                    } else {
                        InfoStack.remove();
                    }
                    // RELATED ITEMS
                    GetChildItems(Item.id);
                    if (Item.itemTypeId != ItemTypes.find(function (ITx) { return ITx.name == 'Group'; }).id) {
                        VariationCont.remove();
                    }
                    // BREADCRUMBS
                    U.PrintBreadcrumbs(Item.id, Item.description);
                    // TOP SELLERS
                    U.PopulateTopSellers(Item.id);
                    $('.zuc-ec-product-order-forms').on('submit', function () {
                        var ItemId = VariationCont.find('select').val() || Item.id;
                        var Qty = $('.zuc-ec-form-group.--qty select').val();
                        $.when(LT.Cart.AddItem(ItemId, Qty)).done(function () {
                            window.location.href = '/Zuc/ecomcart';
                        });
                        return false;
                    });
                } else {
                    U.Exit();
                }
            });
        });
    } else {
        U.Exit();
    }

})();
/*

    ecomhome Controller for the View "ecomhome"
    Copyright 2018, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();

    var CatalogPromise = U.AJAX("/API/Inventory/ItemsExt?$filter=code eq 'Store'", 'GET', false, false, 'silent')
        .then(function (Result) {
            return U.AJAX('/API/Inventory/GetItemChildrenExt/' + Result.items[0].id, 'GET', false, false, 'silent')
                .then(function (Results) {
                    return U.AJAX('/API/Inventory/ItemsExt?$filter=id eq ' + Results.map(function (R) { return R.childItemId; }).join(' or id eq '), 'GET', false, false, 'silent')
                        .then(function (Result) { return Result.items; });
                });
        });

    $(function () {
        $('<style>'
            + '.zuc-ec-home-header-card { z-index: 1; }'
            + '.zuc-ec-home-header-card.--active-slide { z-index: 2; }'
        + '</style>').appendTo('head');
        var CatalogCont = $('.zuc-ec-catlinks-boxes');
        var CatalogUI = CatalogCont.find('.zuc-ec-catlinks-box').first().clone();
        CatalogCont.empty();
        $.when(CatalogPromise).done(function (Catalogs) {
            // Smarter Living Plans tile
            CatalogCont.append(CatalogUI.clone().attr('href', '/Zuc/ecomplan'));
            // Catalog tiles
            Catalogs
                .sort(function (A, B) {
                    return A.upcCode > B.upcCode
                        ? 1
                        : A.upcCode < B.upcCode
                            ? -1
                            : A.code > B.code
                                ? 1
                                : A.code < B.code
                                    ? -1
                                    : 0;
                })
                .forEach(function (Ix) {
                    var NewTile = CatalogUI.clone();
                    NewTile.attr('href', '/Zuc/ecomcategory?c=' + Ix.code).attr('title', null);
                    var AttAddr = U.GetECommerceAttachments(Ix.attachments, true)[0].address || null;
                    NewTile.find('.zuc-ec-catlinks-box-image').css('background-image', AttAddr ? "url('" + AttAddr + "')" : 'none');
                    NewTile.find('.zuc-ec-catlinks-box-title').text(Ix.code);
                    NewTile.find('.zuc-ec-catlinks-box-subtitle').text(Ix.description);
                    CatalogCont.append(NewTile);
                });
            var TopSellerCont = $('.zuc-ec-shelf-cards');
            var TopSellerItemUI = $('.zuc-ec-shelf-card').first().clone();
            TopSellerCont.empty();
            U.GetTopSellers(8).done(function (Results) {
                Results.forEach(function (Ix) {
                    var NewTSItem = TopSellerItemUI.clone();
                    U.PopulateProductCard(Ix, NewTSItem, '.zuc-ec-shelf-card-image', true, '.zuc-ec-shelf-card-name', '.zuc-ec-shelf-card-price-reg', '.zuc-ec-shelf-card-price-mem', false, '.zuc-ec-btn-box .zuc-btn');
                    TopSellerCont.append(NewTSItem);
                });
            });
            U.ShowUI();
        });
    });


})();
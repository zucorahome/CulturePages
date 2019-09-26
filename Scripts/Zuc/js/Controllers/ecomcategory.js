/*

    ecomcategory Controller for the View "ecomcategory"
    Copyright 2018, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();

    var RequestedCatalog = U.GetURIParam('c');
    var ItemPromise = RequestedCatalog
        ? U.AJAX("/API/Inventory/ItemsExt?$filter=code eq '" + RequestedCatalog + "'", 'GET', false, false, 'silent')
            .then(function (Result) { return Result.items[0]; })
        : U.AJAX("/API/Inventory/ItemsExt?$filter=code eq 'Store'", 'GET', false, false, 'silent')
            .then(function (Result) {
                return U.AJAX('/API/Inventory/GetItemChildrenExt/' + Result.items[0].id, 'GET', false, false, 'silent')
                    .then(function (Results) {
                        return Results.length
                            ? U.AJAX('/API/Inventory/ItemsExt?$filter=id eq ' + Results[0].childItemId, 'GET', false, false, 'silent')
                                .then(function (Result) { return Result.items[0]; })
                            : null;
                    });
            });
    var ItemTypePromise = LT.LTCodes.Get('ItemTypes');

    var SubCatalogCont = null;
    var SubCatalogUI = null;
    var Shelf = null;
    var ItemUI = null;
    $(function () {
        SubCatalogCont = $('.zuc-ec-toggle');
        SubCatalogUI = $('.zuc-ec-toggle-category').first().clone();
        SubCatalogCont.empty().on('click', function (E) {
            Shelf.empty();
            var Pill = $(E.target).addClass('--active');
            Pill.siblings().removeClass('--active');
            $.when(U.AJAX('/API/Inventory/GetItemChildrenExt/' + Pill.attr('data-lt-id'), 'GET', false, false, 'silent').then(function (Results) { return Results; }))
                .done(function (Items) {
                    Items.forEach(function (Ix) {
                        var NewItem = ItemUI.clone();
                        U.PopulateProductCard(Ix, NewItem, '.zuc-ec-shelf-card-image', true, '.zuc-ec-shelf-card-name', '.zuc-ec-shelf-card-price-reg', '.zuc-ec-shelf-card-price-mem', false, '.zuc-ec-btn-box .zuc-btn');
                        Shelf.append(NewItem);
                    });
                });
        });
        Shelf = $('.zuc-ec-shelf-cards');
        ItemUI = Shelf.find('.zuc-ec-shelf-card').first().clone();
        Shelf.empty();
        $('.zuc-ec-pagination-page').not(':eq(0)').remove();
        $('.zuc-ec-catlinks-box:eq(0)').attr('href', '/Zuc/ecomplan');
        $('.zuc-ec-catlinks-box:eq(1)').attr('href', '/Zuc/ecomcategory?c=PureCare');
        $('.zuc-ec-catlinks-box:eq(2)').attr('href', '/Zuc/ecomcategory?c=Furniture Care');
    });

    $.when(ItemPromise).done(function (Item) {
        if (Item) {
            $.when(
                U.AJAX('/API/Inventory/GetItemAncestor/' + Item.id, 'GET', false, false, 'silent').then(function (Results) { return Results; })
            ).done(function (Ancestors) {
                var Catalog = Ancestors.length == 3 ? Ancestors[0] : Item;
                var SubCatalog = Ancestors.length == 3 ? Item : null;
                $.when(U.AJAX('/API/Inventory/GetItemChildrenExt/' + Catalog.id, 'GET', false, false, 'silent').then(function (Results) { return Results; }))
                    .done(function (SubCatalogs) {
                        if (!SubCatalog) SubCatalog = { id: SubCatalogs[0].childItemId, code: SubCatalogs[0].code };
                        $(function () {
                            $('.zuc-ec-head-title').first().text(Catalog.code);
                            $('.zuc-ec-blurb-text').text(Catalog.details);
                            SubCatalogs.forEach(function (SCx) {
                                SubCatalogCont.append(
                                    SubCatalogUI.clone().text(SCx.code).attr('data-lt-id', SCx.childItemId)
                                );
                            });
                            SubCatalogCont.find('[data-lt-id="' + SubCatalog.id + '"]').trigger('click');
                            U.PrintBreadcrumbs(Catalog.id, Catalog.code);
                            U.ShowUI();
                        });
                    });
            });
        } else {
            U.Exit();
        }
    });

})();
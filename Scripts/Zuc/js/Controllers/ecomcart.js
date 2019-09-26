/*

    ecomcart Controller for the View "ecomcart"
    Copyright 2018, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();

    $.when(LT.Cart.GetFullItems(), LT.LTCodes.Get('ItemTypes')).done(function (Items, ItemTypes) {
        $(function () {

            var VM = function () {
                var It = this;

                It.ServiceItemTypeId = ItemTypes.find(function (ITx) { return ITx.name == 'Service'; }).id;
                It.PrintPrice = U.PrintPrice;
                It.PrintMemberPrice = U.PrintMemberPrice;

                It.RemoveItemFromCart = function (Item) {
                    if (LT.Cart.RemoveItem(Item.id)) {
                        return It.Items.remove(Item).length > 0;
                    }
                };

                It.UserIsMember = ko.observable(false);

                It.Items = ko.observableArray([]);
                It.Subtotal = ko.computed(function () {
                    var IsMember = It.UserIsMember();
                    return U.PrepMathForView(
                        It.Items().reduce(function (Acc, Ix) {
                            var Amt = IsMember ? U.CalcMemberPrice(Ix.msrp) : Ix.msrp;
                            var ExtAmt = U.PrepMoneyForMath(Amt) * U.PrepMoneyForMath(Ix.Quantity());
                            return Acc + ExtAmt;
                        }, 0),
                        1
                    );
                });

                It.CheckOut = function () {
                    if (It.Items().length) {
                        window.location.href = '/Zuc/ecomcheckout';
                    }
                };
                
                return It;
            }();

            VM.Items(Items.map(function (Ix) {
                Ix['Quantity'] = ko.observable(Ix.Quantity);
                Ix['QuantitySync'] = ko.computed(function () {
                    return LT.Cart.UpdateItemQuantity(Ix.id, Ix.Quantity());
                });
                Ix['QuantityOptions'] = ko.computed(function () {
                    var Arr = [];
                    var OCount = (Math.ceil(Ix.Quantity() / 10) + 1) * 10;
                    var O = 1;
                    while (O <= OCount) {
                        Arr.push(O);
                        O++;
                    }
                    return Arr;
                });
                Ix['Total'] = ko.computed(function () {
                    return U.PrintPrice(
                        U.PrepMathForView(
                            U.PrepMoneyForMath(UserIsMember() ? U.CalcMemberPrice(Ix.msrp) : Ix.msrp) * U.PrepMoneyForMath(Ix.Quantity()),
                            1
                        )
                    );
                });
                return Ix;
            }));

            ko.applyBindings(VM);
            U.ShowUI();
        });    
    });

})();
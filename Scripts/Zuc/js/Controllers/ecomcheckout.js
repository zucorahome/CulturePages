/*

    ecomcheckout Controller for the View "ecomcheckout"
    Copyright 2018, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();

    $.when(
        LT.Cart.GetFullItems(),
        LT.LTCodes.Find('ItemTypes', 'name', 'Service'),
        U.AJAX('/API/Core/GetCanadianProvinceList', 'GET', false, false, 'silent')
            .then(function (Results) { return Results.sort(function (A, B) { return A.code > B.code ? 1 : A.code < B.code ? -1 : 0; }); }),
        U.AJAX('/API/Core/GetCountries', 'GET', false, false, 'silent')
            .then(function (Results) { return Results.sort(function (A, B) { return A.code > B.code ? 1 : A.code < B.code ? -1 : 0; }); }),
        U.AJAX("/API/Core/ApplicationConfigsExt?$filter=name eq 'RewardPointsSettings'", 'GET', false, false, 'silent')
            .then(function (Result) {
                return Result && Result.items && Result.items.length && Result.items[0].value
                    ? Result.items[0].value.split('|')
                    : [];
            })
    ).done(function (CartItems, ServiceItemType, CanadianProvinceList, Countries, PointsSettings) {
        $(function () {

            var VM = function () {

                var It = this;

                It.UserIsMember = false;
                It.MemberId = ko.observable(null);
                It.UserAcceptsTerms = ko.observable(false);
                It.UserSubscribingToMailingList = ko.observable(false);
                It.Currency = 'CAD';
                It.ProvinceOptions = ko.observableArray(CanadianProvinceList);
                It.CountryOptions = ko.observableArray(Countries);
                It.ExpiryMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
                It.ExpiryYears = function () {
                    var CurrYear = new Date().getFullYear();
                    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (O) { return CurrYear + O; });
                }();
                It.GeocodeAddress = function () {
                    var Geocoder = new google.maps.Geocoder();
                    var Cache = {};
                    return function (Address1, City, ProvinceId, CountryId, Postal, Mode) {
                        var Promise = new $.Deferred();
                        if (Address1 && City && ProvinceId && CountryId && Postal) {
                            var Province = It.ProvinceOptions().find(function (P) { return P.id == ProvinceId; }).code;
                            var Country = It.CountryOptions().find(function (C) { return C.id == CountryId; }).code;
                            var Addr = Address1 + ', ' + City + ', ' + Province + ', ' + Country + ', ' + Postal;
                            if (Cache[Addr] instanceof Array) {
                                Promise.resolve(Cache[Addr]);
                            } else {
                                if (Mode != 'silent') {
                                    U.LoadingSplash.Show();
                                }
                                Geocoder.geocode({ address: Addr }, function (Results, Status) {
                                    if (Mode != 'silent') {
                                        U.LoadingSplash.Hide();
                                    }
                                    if (Status == 'OK') {
                                        var Coord = [Results[0].geometry.location.lat(), Results[0].geometry.location.lng()];
                                        Cache[Addr] = Coord;
                                        Promise.resolve(Coord);
                                    } else {
                                        Promise.reject({ message: 'Geocoding error' });
                                    }
                                });
                            }
                        } else {
                            Promise.reject({ message: 'No address passed' });
                        }
                        return Promise;
                    };
                }();
                It.GenerateMember = function (Mode) {
                    if (Mode != 'silent') {
                        U.LoadingSplash.Show();
                    }
                    if (!It.MemberId()) {
                        var FullName = (It.ServiceEmail() || It.ShippingEmail()).trim();
                        return U.AJAX('/API/Core/GetAffiliateIdByFullName/' + encodeURIComponent(FullName) + '/', 'GET', false, false, 'silent').then(function (Result) {
                            if (Result === null) {
                                return LT.LTCodes.Find('PreferredCommunicationOptions', 'code', 'None').then(function (PrefCommNone) {
                                    var AData = {
                                        id: -1,
                                        firstName: It.ServiceFirstName().trim() || It.ShippingName().trim(),
                                        lastName: It.ServiceLastName().trim() || It.ShippingName().trim(),
                                        fullName: FullName,
                                        email: It.ServiceEmail().trim() || It.ShippingEmail().trim(),
                                        mobilePhone: It.ServicePhone().trim() || It.ShippingPhone().trim(),
                                        preferredCommunication: PrefCommNone.id,
                                        coverageRadius: 0,
                                        affiliateTypes: [],
                                    };
                                    return U.AJAX('/API/Core/Affiliates', 'POST', AData, function (Result) {
                                        It.MemberId(Result.items[0].id);
                                        if (Mode != 'silent') {
                                            U.LoadingSplash.Hide();
                                        }
                                    }, 'silent', true);
                                });
                            } else {
                                It.MemberId(Result.id);
                                if (Mode != 'silent') {
                                    U.LoadingSplash.Hide();
                                }
                            }
                        });
                    } else { // account already exists
                        // TODO: See Cover.js:1956
                        return new $.Deferred().resolve();
                    }
                };

                It.ServiceAffiliateLocationId = ko.observable(null);
                It.ServiceLocationId = ko.observable(null);
                It.ServiceFirstName = ko.observable(null);
                It.ServiceLastName = ko.observable(null);
                It.ServiceAddress1 = ko.observable(null);
                It.ServiceAddress2 = ko.observable(null);
                It.ServiceCity = ko.observable(null);
                It.ServiceProvinceId = ko.observable(null);
                It.ServiceCountryId = ko.observable(Countries.find(function (C) { return C.code == 'Canada'; }).id);
                It.ServicePostal = ko.observable(null);
                It.ServiceLatitude = ko.observable(null);
                It.ServiceLongitude = ko.observable(null);
                It.ServicePhone = ko.observable(null);
                It.ServiceEmail = ko.observable(null);
                It.GenerateServiceLocation = function (Mode) {
                    if (It.ServiceProvinceId()) {
                        if (Mode != 'silent') {
                            U.LoadingSplash.Show();
                        }
                        return $.when(
                            It.GeocodeAddress(It.ServiceAddress1(), It.ServiceCity(), It.ServiceProvinceId(), It.ServiceCountryId(), It.ServicePostal(), 'silent'),
                            LT.LTCodes.Find('AffiliateLocationRelationTypeOptions', 'code', 'ShipToAddress'),
                            LT.LTCodes.Find('LocationAccuracyOptions', 'code', 'Default')
                        ).then(function (Coord, HomeLocRelType, LocAccDefault) {
                            It.ServiceLatitude(Coord[0]);
                            It.ServiceLongitude(Coord[1]);
                            return new $.Deferred().resolve([(It.ServiceFirstName().trim() + ' ' + It.ServiceLastName().trim()).substr(0, 34) + ' - Service ' + U.GetRandomString(5)])
                                .then(function (LocNames) {
                                    var Data = {
                                        Id: -1,
                                        AffiliateId: It.MemberId(),
                                        Name: LocNames[0],
                                        Address1: It.ServiceAddress1().trim(),
                                        Address2: It.ServiceAddress2() ? It.ServiceAddress2().trim() : null,
                                        CityName: It.ServiceCity().trim(),
                                        ProvinceId: It.ServiceProvinceId(),
                                        CountryId: It.ServiceCountryId(),
                                        PostalCode: It.ServicePostal(),
                                        Latitude: It.ServiceLatitude(),
                                        Longitude: It.ServiceLongitude(),
                                        RelationType: HomeLocRelType.id,
                                        AttentionName: It.ServiceFirstName().trim() + ' ' + It.ServiceLastName().trim(),
                                        PhoneNumber: It.ServicePhone().replace(/[^0-9]/g, ''),
                                        Email: It.ServiceEmail().trim(),
                                        IsActive: true,
                                        Accuracy: LocAccDefault.id,
                                    };
                                    return U.AJAX('/API/FieldService/Locations', 'POST', Data, false, 'silent', true)
                                        .then(function (Result) {
                                            It.ServiceLocationId(Result.items[0].id);
                                            var ALURL = '/API/Core/AffiliateLocations/-1/null/null/' + HomeLocRelType.id + '?geofenceIdListString=&$filter=affiliateId eq ' + It.MemberId() + ' and locationId eq ' + It.ServiceLocationId();
                                            return U.AJAX(ALURL, 'GET', false, function (Result) {
                                                It.ServiceAffiliateLocationId(Result.items[0].id);
                                                if (Mode != 'silent') {
                                                    U.LoadingSplash.Hide();
                                                }
                                            }, 'silent');
                                        });
                                });
                        });
                    } else { // no Service Location to add
                        return new $.Deferred().resolve();
                    }
                };

                It.ShippingAffiliateLocationId = ko.observable(null);
                It.ShippingName = ko.observable(null);
                It.ShippingAddress1 = ko.observable(null);
                It.ShippingAddress2 = ko.observable(null);
                It.ShippingCity = ko.observable(null);
                It.ShippingProvinceId = ko.observable(null);
                It.ShippingCountryId = ko.observable(Countries.find(function (C) { return C.code == 'Canada'; }).id);
                It.ShippingPostal = ko.observable(null);
                It.ShippingLatitude = ko.observable(null);
                It.ShippingLongitude = ko.observable(null);
                It.ShippingPhone = ko.observable(null);
                It.ShippingEmail = ko.observable(null);
                It.GenerateShipTo = function (Mode) {
                    if (It.ShippingProvinceId()) {
                        if (Mode != 'silent') {
                            Module.LoadingSplash.Show();
                        }
                        return It.GeocodeAddress(It.ShippingAddress1(), It.ShippingCity(), It.ShippingProvinceId(), It.ShippingCountryId(), It.ShippingPostal(), 'silent')
                            .then(function (Coord) {
                                It.ShippingLatitude(Coord[0]);
                                It.ShippingLongitude(Coord[1]);
                                var Data = {
                                    AffiliateId: It.MemberId(),
                                    Address: {
                                        Address1: It.ShippingAddress1().trim(),
                                        Address2: It.ShippingAddress2() ? It.ShippingAddress2().trim() : null,
                                        City: It.ShippingCity().trim(),
                                        ProvinceId: It.ShippingProvinceId(),
                                        CountryId: It.ShippingCountryId(),
                                        PostalCode: It.ShippingPostal().trim(),
                                        Phone: It.ShippingPhone().replace(/[^0-9]/g, ''),
                                        Email: It.ShippingEmail().trim(),
                                    },
                                    RecipientName: It.ShippingName().trim(),
                                };
                                return U.AJAX('/API/PaymentService/v2/CreateShipToAddress', 'POST', Data, function (ALId) {
                                    It.ShippingAffiliateLocationId(ALId);
                                    if (Mode != 'silent') {
                                        U.LoadingSplash.Hide();
                                    }
                                }, 'silent', true);
                            });
                    } else { // no Shipping Location to add
                        return new $.Deferred().resolve();
                    }
                };

                It.BillingAffiliateLocationId = ko.observable(null);
                It.BillingCardNumber = ko.observable(null);
                It.BillingNameOnCard = ko.observable(null);
                It.BillingExpiryMonth = ko.observable(null);
                It.BillingExpiryYear = ko.observable(null);
                It.BillingSecurityCode = ko.observable(null);
                It.BillingAddress1 = ko.observable(null);
                It.BillingAddress2 = ko.observable(null);
                It.BillingCity = ko.observable(null);
                It.BillingProvinceId = ko.observable(null);
                It.BillingCountryId = ko.observable(Countries.find(function (C) { return C.code == 'Canada'; }).id);
                It.BillingPostal = ko.observable(null);
                It.BillingPhone = ko.observable(null);
                It.BillingEmail = ko.observable(null);
                It.Signature = ko.observable(null);
                It.GetSignatureBlob = function () {
                    if (It.Signature()) {
                        return Module.DataURIToBlob($('.LTSigCanvas')[0].toDataURL('image/jpeg', 1));
                    }
                    return false;
                };
                It.SigPad = $('.sigPad', It.ChooserElem).signaturePad({
                    drawOnly: true,
                    defaultAction: 'drawIt',
                    lineTop: 66
                });
                It.GenerateBillTo = function (Mode) {
                    var Data = {
                        AffiliateId: It.MemberId(),
                        CardholderName: It.BillingNameOnCard().trim(),
                        CardNumber: It.BillingCardNumber().replace(/[^0-9]/g, ''),
                        CardVerificationValue: It.BillingSecurityCode().replace(/[^0-9]/g, ''),
                        Expiry: It.BillingExpiryYear() + '-' + ('0' + It.BillingExpiryMonth()).slice(-2),
                        Address: {
                            Address1: It.BillingAddress1().trim(),
                            Address2: It.BillingAddress2() ? It.BillingAddress2().trim() : null,
                            City: It.BillingCity().trim(),
                            ProvinceId: It.BillingProvinceId(),
                            CountryId: It.BillingCountryId(),
                            PostalCode: It.BillingPostal().trim(),
                            Phone: It.BillingPhone().replace(/[^0-9]/g, ''),
                            Email: It.BillingEmail().trim(),
                        }
                    };
                    return U.AJAX(
                        '/API/PaymentService/v2/CreateBillingAddress',
                        'POST',
                        Data,
                        false,
                        Mode,
                        true,
                        {
                            error: function (JQXHR, Status, Err) {
                                U.LoadingSplash.Hide();
                                var ModelState = U.GetPropertyFromServerErrorMessage(JQXHR, 'modelState');
                                var ErrMsg = U.GetPropertyFromServerErrorMessage(JQXHR, 'message');
                                if (ModelState) {
                                    var AlertMsg = 'The following issues were found:\r\n';
                                    for (var Field in ModelState) {
                                        AlertMsg += ModelState[Field].reduce(function (A, Issue) { return A + ('- ' + Issue + '\r\n'); }, '');
                                    }
                                    alert(AlertMsg);
                                } else if (ErrMsg) {
                                    alert(ErrMsg);
                                }
                            },
                        }
                    ).then(function (Result) {
                        if (Result.affiliateLocationId) {
                            It.BillingAffiliateLocationId(Result.affiliateLocationId);
                        } else {
                            if (Result.paymentProcessorResponse.responseCode == 'Declined') {
                                U.Alert({ Message: 'Your payment method was declined. Please check that you typed the card info correctly. If you did, you need to try a different payment method to proceed.', Type: 'Error' });
                                return new $.Deferred().reject(Result.paymentProcessorResponse);
                            } else {
                                U.Alert({ Message: 'Your payment method could not be checked due to a technical issue. Please try again at a later time.' });
                                return new $.Deferred().reject(Result.paymentProcessorResponse);
                            }
                        }
                        if (Mode != 'silent') {
                            U.LoadingSplash.Hide();
                        }
                    });
                };

                It.CartItems = ko.observableArray(CartItems.map(function (Ix) {
                    Ix['IsService'] = Ix.itemTypeId == ServiceItemType.id;
                    Ix['UserMSRP'] = It.UserIsMember && !Ix.IsService ? parseFloat(U.CalcMemberPrice(Ix.msrp)) : Ix.msrp;
                    Ix['Extended'] = ko.computed(function () {
                        return parseFloat(U.PrepMathForView(U.PrepMoneyForMath(Ix.UserMSRP) * U.PrepMoneyForMath(Ix.Quantity), 1));
                    });
                    Ix['Tax1'] = ko.observable(0);
                    Ix['Tax2'] = ko.observable(0);
                    Ix['Total'] = ko.computed(function () {
                        return parseFloat(
                            U.PrepMathForView(
                                U.PrepMoneyForMath(Ix.Extended())
                                + U.PrepMoneyForMath(Ix.Tax1())
                                + U.PrepMoneyForMath(Ix.Tax2())
                            )
                        );
                    });
                    It[Ix.IsService ? 'ServiceProvinceId' : 'ShippingProvinceId'].subscribe(function (NewTaxProvinceId) {
                        $.when(
                            NewTaxProvinceId
                                ? U.AJAX('/API/Financial/OpenGetTaxes/' + Ix.Extended() + '/' + NewTaxProvinceId + '/' + Ix.amountType, 'GET', false, false, 'silent')
                                : new $.Deferred().resolve({ tax1: 0, tax2: 0 })
                        ).done(function (Result) {
                            Ix.Tax1(Result.tax1);
                            Ix.Tax2(Result.tax2);
                        });
                    });

                    return Ix;
                }));
                It.CartHasServicePlan = !!It.CartItems().find(function (Ix) { return Ix.IsService; });
                It.CartHasShippedItem = !!It.CartItems().find(function (Ix) { return !Ix.IsService; });
                It.Subtotal = ko.computed(function () {
                    var Subtotal = 0;
                    It.CartItems().forEach(function (Ix) {
                        Subtotal += U.PrepMoneyForMath(Ix.UserMSRP) * U.PrepMoneyForMath(Ix.Quantity);
                    });
                    return parseFloat(U.PrepMathForView(Subtotal, 1));
                });
                It.Tax1Total = ko.computed(function () {
                    var TaxTotal = 0;
                    It.CartItems().forEach(function (Ix) {
                        TaxTotal += U.PrepMoneyForMath(Ix.Tax1());
                    });
                    return parseFloat(U.PrepMathForView(TaxTotal));
                });
                It.Tax2Total = ko.computed(function () {
                    var TaxTotal = 0;
                    It.CartItems().forEach(function (Ix) {
                        TaxTotal += U.PrepMoneyForMath(Ix.Tax2());
                    });
                    return parseFloat(U.PrepMathForView(TaxTotal));
                });
                It.GrandTotal = ko.computed(function () {
                    var GrandTotal = 0;
                    GrandTotal += U.PrepMoneyForMath(It.Subtotal());
                    GrandTotal += U.PrepMoneyForMath(It.Tax1Total());
                    GrandTotal += U.PrepMoneyForMath(It.Tax2Total());
                    return parseFloat(U.PrepMathForView(GrandTotal));
                });
                It.Rewards = ko.computed(function () {
                    return parseFloat(
                        U.PrepMathForView(
                            U.PrepMoneyForMath(It.Subtotal()) * U.PrepMoneyForMath(parseFloat(PointsSettings[3]) || 0.01),
                            1
                        )
                    );
                });
                It.Points = ko.computed(function () {
                    return Math.round(
                        U.PrepMathForView(
                            U.PrepMoneyForMath(It.Rewards()) * U.PrepMoneyForMath(parseFloat(PointsSettings[0]) || 1000),
                            1
                        )
                    );
                });
                //It.MemberDiscountTotal = It.UserIsMember
                //    ? U.PrepMathForView(
                //        CartItems.reduce(function (Acc, Ix) { return Acc + (U.PrepMoneyForMath(Ix.msrp) * U.PrepMoneyForMath(Ix.Quantity)); }, 0) -
                //        CartItems.reduce(function (Acc, Ix) { return Acc + (U.PrepMoneyForMath(U.CalcMemberPrice(Ix.msrp)) * U.PrepMoneyForMath(Ix.Quantity)); }, 0),
                //        1
                //    )
                //    : 0;

                It.Step = ko.observable(It.CartHasServicePlan ? 2 : 3);
                It.DataEntryDone = ko.computed(function () {
                    var Step = It.Step();
                    if (Step == 2) {
                        return !!It.ServiceFirstName()
                            && !!It.ServiceLastName()
                            && !!It.ServiceAddress1()
                            && !!It.ServiceCity()
                            && !!It.ServiceProvinceId()
                            && !!It.ServiceCountryId()
                            && !!It.ServicePostal()
                            && !!It.ServicePhone()
                            && !!It.ServiceEmail();
                    } else if (Step == 3) {
                        return !!It.ShippingName()
                            && !!It.ShippingAddress1()
                            && !!It.ShippingCity()
                            && !!It.ShippingProvinceId()
                            && !!It.ShippingCountryId()
                            && !!It.ShippingPostal()
                            && !!It.ShippingPhone()
                            && !!It.ShippingEmail();
                    } else if (Step == 4) {
                        return !!It.BillingCardNumber()
                            && !!It.BillingNameOnCard()
                            && !!It.BillingExpiryMonth()
                            && !!It.BillingExpiryYear()
                            && !!It.BillingSecurityCode()
                            && !!It.BillingAddress1()
                            && !!It.BillingCity()
                            && !!It.BillingProvinceId()
                            && !!It.BillingCountryId()
                            && !!It.BillingPostal()
                            && !!It.BillingPhone()
                            && !!It.BillingEmail();
                    } else if (Step == 5) {
                        return !!It.UserAcceptsTerms()
                            && (!LTAppSettingUserIsSignedIn || It.Signature());
                    }
                });
                It.Back = function (Data, E) {
                    if (E.type == 'click' || E.which == 13 || E.which == 32) {
                        var TargetStep = It.Step() - 1;
                        if (TargetStep < 2) {
                            window.location.href = !LTAppSettingUserIsSignedIn ? '/Zuc/ecomcart' : '/Zuc/ecomplan';
                            return;
                        } else if (TargetStep == 2 && !It.CartHasServicePlan) {
                            window.location.href = '/Zuc/ecomcart';
                            return;
                        } else if (TargetStep == 3 && !It.CartHasShippedItem) {
                            TargetStep--;
                        }
                        It.Step(TargetStep);
                        $('html').scrollTop(0);
                    }
                };
                It.MakePayment = function () {
                    var CurrenciesPromise = new $.Deferred().resolve(1); // TODO: LT.LTCodes.Find('Currencies', 'code', 'CAD').then(function (CAD) { return CAD.id; }); (need anonymous API)
                    return function (EventId, Amount, Mode) {
                        return $.when(CurrenciesPromise).then(function (CADId) {
                            if (Amount && parseFloat(Amount) != 0) {
                                var Data = {
                                    BillingAffiliateLocationId: It.BillingAffiliateLocationId(),
                                    Total: Amount,
                                    CurrencyId: CADId, // TODO: Retrieve with an anonymous API (see above)
                                    EventId: EventId || null,
                                    ApplyPayment: !!EventId ? true : false,
                                };
                                return U.AJAX('/API/PaymentService/v2/MakePayment', 'POST', Data, false, Mode, true)
                                    .then(function (Result) {
                                        if (Result.responseCode == 'Authorized' || Result.responseCode == 'ChargeNotRequired') {
                                            if (Mode != 'silent') {
                                                U.LoadingSplash.Hide();
                                            }
                                            return new $.Deferred().resolve(Result);
                                        } else if (Result.responseCode == 'TryAgain' || Result.responseCode == 'None') {
                                            U.LoadingSplash.Hide();
                                            U.Alert({ Message: 'The payment cannot be processed due to a technical issue.  Please try again at a later time. (' + Result.responseCode + ')' });
                                            return new $.Deferred().reject(Result);
                                        } else if (Result.responseCode == 'Declined') {
                                            U.LoadingSplash.Hide();
                                            U.Alert({ Message: Result.responseCode.toUpperCase() + 'That card was declined. Please check that you typed the card info correctly. If you did, you need to try a different card to proceed.' });
                                            return new $.Deferred().reject(Result);
                                        }
                                    });
                            } else {
                                return new $.Deferred().resolve({ responseCode: 'ChargeNotRequired' })
                            }
                        });
                    };
                }();
                It.PlaceSalesOrder = function () {
                    var ComboPlan = It.CartItems().find(function (Ix) { return Ix.IsService && Ix.hasLabel; });
                    var WelcomeItemsPromise = ComboPlan
                        ? U.AJAX('/API/Inventory/BillOfMaterialsExt?$filter=parentItemId eq ' + ComboPlan.id, 'GET', false, false, 'silent')
                            .then(function (Result) {
                                return Result.items.length
                                    ? U.AJAX('Inventory/ItemsExt?$filter=' + Result.items.reduce(function (A, B, I) { return A + (I > 0 ? ' or id eq ' : '') + B.childItemId; }, 'id eq '), 'GET', false, false, 'silent')
                                        .then(function (Result) { return Result.items; })
                                    : [];
                            })
                        : new $.Deferred().resolve([]);
                    var ShipViaPromise = LT.LTCodes.Get('ShipViaList');
                    return function (Mode) {
                        return $.when(WelcomeItemsPromise, ShipViaPromise).then(function (WelcomeItems, ShipViaList) {
                            var Products = It.CartItems().filter(function (Ix) { return !Ix.IsService; });
                            if (Products.length || WelcomeItems.length) {
                                var SOData = {
                                    BillingAffiliateLocationId: It.BillingAffiliateLocationId(),
                                    Items: [],
                                };
                                var Today = new Date(); Today = Today.getFullYear() + '-' + (Today.getMonth() + 1) + '-' + Today.getDate();
                                var Amount = 0;
                                Products.forEach(function (Ix) {
                                    SOData.Items.push({
                                        ShipToAffiliateLocationId: It.ShippingAffiliateLocationId(),
                                        OriginLocationId: -1,
                                        LabelLocationId: null,
                                        ShipViaId: ShipViaList[0].id,
                                        ShipDate: Today,
                                        ItemId: Ix.id,
                                        Quantity: Ix.Quantity,
                                        Amount: Ix.UserMSRP,
                                    });
                                    Amount += U.PrepMoneyForMath(Ix.Total());
                                });
                                WelcomeItems.forEach(function (Ix) {
                                    SOData.Items.push({
                                        ShipToAffiliateLocationId: It.ShippingAffiliateLocationId() || It.ServiceAffiliateLocationId(),
                                        OriginLocationId: -1,
                                        LabelLocationId: null,
                                        ShipViaId: ShipViaList[0].id,
                                        ShipDate: Today,
                                        ItemId: Ix.id,
                                        Quantity: 1,
                                        Amount: 0, // welcome Items are always free
                                    });
                                });
                                Amount = U.PrepMathForView(Amount);
                                return U.AJAX('/API/PaymentService/v2/CreateSalesOrder', 'POST', SOData, false, Mode, true)
                                    .then(function (SOEventId) {
                                        return It.MakePayment(SOEventId, Amount, Mode)
                                            .then(function () {
                                                if (Mode != 'silent') {
                                                    U.LoadingSplash.Hide();
                                                }
                                                return new $.Deferred().resolve(true);
                                                // TODO: The following must be done by the server: It.SendSalesOrderReceipt(Products.concat(WelcomeItems), Mode)
                                            });
                                    });
                            } else { // no Parts to order
                                return new $.Deferred().resolve(false);
                            }
                        });
                    };
                }();
                It.MakeServiceAgreement = function (Mode) {
                    var ServicePlan = It.CartItems().find(function (Ix) { return Ix.IsService; });
                    if (ServicePlan) {
                        var Data = {
                            BillingAffiliateLocationId: It.BillingAffiliateLocationId(),
                            Items: [{
                                ServiceAffiliateLocationId: It.ServiceAffiliateLocationId(),
                                ItemId: ServicePlan.id,
                                Quantity: ServicePlan.Quantity,
                                Amount: ServicePlan.UserMSRP,
                            }],
                        };
                        return U.AJAX('/API/PaymentService/v2/createServiceAgreement', 'POST', Data, false, Mode, true)
                            .then(function (SAEventId) {
                                return It.MakePayment(SAEventId, ServicePlan.Total(), Mode)
                                    .then(function () {
                                        return new $.Deferred().resolve(true);
                                        // TODO: The following must be done by the server: It.SendServiceAgreementReceipt(ServicePlan, Mode)
                                    });
                            });
                    } else { // no Plans to register
                        return new $.Deferred().resolve(false);
                    }
                };
                It.Submit = function () {
                    U.LoadingSplash.Show();
                    return It.GenerateMember('silent').then(function () {
                        return $.when(
                            It.GenerateServiceLocation('silent'),
                            It.GenerateShipTo('silent'),
                            It.GenerateBillTo('silent')
                        ).then(function () {
                            return It.PlaceSalesOrder('silent').then(function () {
                                return It.MakeServiceAgreement('silent').then(function () {
                                    U.LoadingSplash.Hide();
                                    LT.Cart.Clear();
                                    return true;
                                });
                            });
                        });
                    });
                };
                It.Next = function (Data, E) {
                    if (E.type == 'click' || E.which == 13 || E.which == 32) {
                        var TargetStep = It.Step() + 1;
                        if (TargetStep == 3 && !It.CartHasShippedItem) {
                            TargetStep = 4;
                        }
                        var AwaitOrder = TargetStep == 6
                            ? It.Submit()
                            : {};
                        $.when(AwaitOrder).done(function () {
                            It.Step(TargetStep);
                            $('html').scrollTop(0);
                        });
                    }
                };
                It.NextText = ko.computed(function () {
                    if (It.Step() < 5) {
                        return 'NEXT';
                    } else {
                        return 'PLACE ORDER';
                    }
                });

                return It;

            }();

            if (LTAppSettingUserIsSignedIn) {
                $('.zuc-main-nav').prepend(
                    '<div style="position: absolute; left: 1.5vw;">'
                        + '<a href="/Zuc/ecomplan" style="width: 24px; height: 24px; display: inline-block;"><img src="/Images/Zuc/images/ecom/private-ecom-restart.png" style="height: 100%;" /></a>'
                        + '<a class="ExitSellingModule" href="#" style="width: 24px; height: 24px; display: inline-block; margin-left: 0.7vw;"><img src="/Images/Zuc/images/ecom/private-ecom-go-to-associate-portal.png" style="height: 100%;" /></a>'
                    + '</div>'
                );
                $('.ExitSellingModule').on('click', (function () {
                    var EmployeePasscodePromise =
                        U.AJAX("/API/Core/ApplicationConfigs?$filter=name eq 'Cover_Employee Passcode'", 'GET', false, false, 'silent')
                            .then(R => (R && R.items && R.items.length && R.items[0].value) || false);
                    function RequestPassword() {
                        return $.when(EmployeePasscodePromise)
                            .then(function (EmployeePasscode) {
                                var Promise = new $.Deferred();
                                if (EmployeePasscode) { // request passcode from user
                                    prompt('Enter Code') == EmployeePasscode
                                        ? Promise.resolve()
                                        : Promise.reject({ message: 'Wrong Code!' });
                                } else { // EmployeePasscode is not set; exit module without passcode
                                    Promise.resolve();
                                }
                                return Promise;
                            });
                    }
                    return function (E) {
                        E.preventDefault();
                        $.when(RequestPassword()).then(function () {
                            window.location.href = '/Apps/AssociatePortal';
                        }, function (Resp) {
                            alert(Resp.message);
                        });
                    };
                })());
                $('.zuc-main-nav').append(
                    '<div style="position: absolute; right: 12vw;">'
                        + '<img class="partner_logo" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAABQCAMAAAD84m1YAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MjA3Q0VGOEQyNjQ4MTFFOTk4MzY5RDY1QzVEMjg4NzkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MjA3Q0VGOEUyNjQ4MTFFOTk4MzY5RDY1QzVEMjg4NzkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyMDdDRUY4QjI2NDgxMUU5OTgzNjlENjVDNUQyODg3OSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoyMDdDRUY4QzI2NDgxMUU5OTgzNjlENjVDNUQyODg3OSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkB/WzMAAABgUExURbOqAP/yAJKL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" style="height: 40px; vertical-align: middle;" />'
                        + '<span class="username" style="vertical-align: middle; margin-left: 0.5vw;">' + LTAppSettingUserName + '</span>'
                    + '</div>'
                );
                $('.zuc-nav-brand').attr('href', null);
            }

            ko.applyBindings(VM);
            U.ShowUI();
        });    
    });

})();
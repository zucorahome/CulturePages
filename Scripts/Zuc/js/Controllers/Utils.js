/*

    LTPublicUtils for Zucora Marketing Site
    Copyright 2018, LimeTAC Inc. All rights reserved.

*/

if (!$('title').length) {
    $('head').append('<title>Zucora</title>');
}
$('html').css('opacity', 0);
$(document).on('click', '.LTAddToCart', function () {
    var Btn = $(this);
    LT.Cart.AddItem(
        Btn.attr('data-lt-item-id'),
        Btn.attr('data-lt-quantity') || 1,
        Btn.attr('data-lt-item-type-id')
    );
});
window.onbeforeunload = function () {
    $('html').animate({ opacity: 0 }, 60);
};

function LTPublicUtils() {
    var It = this;

    It.AJAX = function (URL, Method, ReqBody, Success, Mode, SendAsJSON, CustomConfig) {
        if (URL) {
            if (Mode != 'silent') {
                It.LoadingSplash.Show();
            }
            var Config =
                $.extend(
                    {},
                    {
                        timeout: 120000, // 2 minutes
                        url: URL,
                        type: Method || 'GET',
                        data: ReqBody ? SendAsJSON ? JSON.stringify(ReqBody) : ReqBody : undefined,
                        success: Success || undefined,
                    },
                    (ReqBody && SendAsJSON ? { processData: false, contentType: 'application/json;charset=utf-8' } : {}),
                    (CustomConfig || {})
                );
            return $.ajax(Config)
                .done(function (Result) {
                    if (Success) {
                        Success(Result);
                    } else {
                        if (Mode != 'silent') {
                            It.LoadingSplash.Hide();
                        }
                    }
                })
                .fail(function (JQXHR, Status, Err) {
                    if (!CustomConfig || !CustomConfig.error) {
                        It.Alert({
                            Message: (It.GetPropertyFromServerErrorMessage(JQXHR, 'message') || JQXHR.responseText) + ' (' + Config.type + ' ' + Config.url + ' ' + JSON.stringify(Config.data) + ')',
                            Type: 'Error',
                        });
                    }
                });
        } else {
            throw new Error('No URL specified for the request.');
        }
    };
    It.Alert = function (Config) {
        if (!Config.Unobtrusive) {
            It.LoadingSplash.Hide();
        }
        if (Config.Type == 'Error') {
            Config.Message = 'ERROR: ' + Config.Message;
        }
        alert(Config.Message);
    };
    It.Exit = function () {
        window.onbeforeunload = $.noop;
        $('body').empty();
        window.location.href = '/Zuc/index';
    };
    It.GetECommerceAttachments = function (Attachments, GetThumbs) {
        if (Attachments instanceof Array) {
            var FilenameRegEx = GetThumbs ? /^eCommerceThumb/ : /^eCommerceImage/;
            // filter and normalize
            var Atts = Attachments
                .filter(function (Att) {
                    return FilenameRegEx.test(It.GetFileNameFromAttachmentURL(Att.address || Att.addressLink));
                });
            if (!Atts.length && GetThumbs) {
                FilenameRegEx = /^eCommerceImage/;
                Atts = Attachments
                    .filter(function (Att) {
                        return FilenameRegEx.test(It.GetFileNameFromAttachmentURL(Att.address || Att.addressLink));
                    });
            }
            Atts.map(function (Att) {
                if (!Att.hasOwnProperty('address')) {
                    Att['address'] = Att.addressLink;
                }
                if (!Att.hasOwnProperty('addressLink')) {
                    Att['addressLink'] = Att.address;
                }
                return Att;
            });
            // ensure there is an object to test upon return
            if (!Atts.length) Atts.push({});
            return Atts;
        }
        return [];
    };
    It.GetFileNameFromAttachmentURL = function (URL, IncludeExtension) {
        var FileName = '';
        FileName = URL.split('/').pop().split('_');
        FileName = decodeURIComponent(FileName.splice(0, FileName.length - 1).join('_'));
        if (!IncludeExtension) {
            FileName = FileName.split('.');
            FileName = FileName.splice(0, FileName.length - 1).join('.');
        }
        return FileName;
    };
    It.GetPropertyFromServerErrorMessage = function (JQXHR, PropName) {
        if (JQXHR instanceof Object) { // was JQXHR sent in?
            if (JQXHR.responseText && typeof JQXHR.responseText == 'string') { // is there a responseText property?
                if (JQXHR.responseText.charAt(0) == '{') { // is responseText json?
                    var AjaxInfo = JSON.parse(JQXHR.responseText);
                    if (PropName && typeof PropName == 'string') { // was PropName passed?
                        if (AjaxInfo[PropName]) { // does the requested property exist?
                            return AjaxInfo[PropName];
                        }
                    }
                }
            }
        }
        return false;
    };
    It.GetRandomIntegerInRange = function (Min, Max) {
        var ZeroMin = false;
        if (Min === 0) {
            Min = 1;
            ZeroMin = true;
        }
        if (!Min) Min = 1;
        if (!Max) Max = 100;
        if (ZeroMin) Max++;
        var RandInt = Math.floor(Math.random() * (Max - Min + 1)) + Min;
        return ZeroMin ? RandInt - 1 : RandInt;
    };
    It.GetRandomString = function () {
        var Options = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        var OptionsMaxIndex = Options.length - 1;
        function GetRandomChar() {
            return Options[It.GetRandomIntegerInRange(0, OptionsMaxIndex)];
        }
        return function (Length) {
            // ex., 60,466,176 possibilities in a 5-char random string
            var Str = '';
            for (var C = 1; C <= Length; C++) {
                Str += GetRandomChar();
            }
            return Str;
        };
    }();
    It.GetTopSellers = function (Count, ItemId) {
        return LT.LTCodes.Get('ItemTypes')
            .then(function (ItemTypes) {
            var ServiceItemTypeId = ItemTypes.find(function (ITx) { return ITx.name == 'Service'; }).id;
            var CatalogItemTypeId = ItemTypes.find(function (ITx) { return ITx.name == 'Catalog'; }).id;
            var GroupItemTypeId = ItemTypes.find(function (ITx) { return ITx.name == 'Group'; }).id;
            return It.AJAX(
                '/API/Inventory/ItemsExt?$filter=' + (ItemId ? 'id ne ' + ItemId + ' and ' : '') + 'interDivPoRestricted eq true&$top=' + (Count || 6) + '&$orderby=description',
                'GET',
                false,
                false,
                'silent'
            ).then(function (Result) {
                return Result.items;
            });
        });
    };
    It.GetURIParam = function (Name) {
        // get params from uri of calling page; remove '?' from beginning; make array consisting of each parameter string
        var Params = document.location.search;
        Params = Params.substring(1, (Params.length)).split('&');
        // iterate through array, splitting each index on '='; then check if this index corresponds to the name requested
        for (var I = 0; I < Params.length; I++) {
            Params[I] = Params[I].split('=');
            if (Params[I][0] == Name)
                return decodeURIComponent(Params[I][1]);
        }
        // if the parameter is not found, parameter is undefined
        return undefined;
    };
    It.IsNumber = function () {
        return function (ValueToTest) {
            /* CAUTION: ValueToTest.match excludes strings containing commas and spaces because those evaluate improperly in parseInt and parseFloat;
            however, omitting ValueToTest.match would allow strings starting with a digit, such as '1World' and '1 day, I was talking to a friend' */
            return typeof ValueToTest != 'undefined'
                && (typeof ValueToTest == 'number'
                    || (typeof ValueToTest == 'string' && !isNaN(parseInt(ValueToTest, 10)) && ValueToTest.match(/[^0-9\.]/) == null));
        };
    }();
    It.IsProductServiceAvailableToUser = function (Name) {
        var Cookies = document.cookie.split('; ');
        var TheCookie = Cookies.find(function (C) { return C.split('=')[0] == 'LTEcomAvailableProductsServices'; });
        var Available = TheCookie ? decodeURIComponent(TheCookie.split('=')[1]).split(',') : ['Smarter Living Products', 'Furniture Plan', 'Appliances Plan'];
        return Available instanceof Array ? Available.indexOf(Name) > -1 : null;
    };
    It.LoadingSplash = function () {
        $(function () {
            if (!$('div#LTLoadingSplash').length) {
                var LoadingSplashCode = '<div id="LTLoadingSplash"';
                LoadingSplashCode += ' style="position: fixed; top: 0; left: 0; display: none; width: 100%; height: 100%; margin: 0; padding: 0; background-color: #000000; z-index: 999999999; opacity: 0.4;">';
                LoadingSplashCode += '<img src="/ExternalAppContents/shared/libraries/jquerymobile/1.3.1/images/ajax-loader.gif" width="46" height="46" alt="loading in progress"';
                LoadingSplashCode += ' style="position: fixed; top: 50%; left: 50%; margin: -23px 0 0 -23px;" />';
                LoadingSplashCode += '</div>';
                $('body').append(LoadingSplashCode);
            }
        });
        return {
            Hide: function () {
                $('div#LTLoadingSplash').fadeOut(150);
                return It;
            }, Show: function () {
                $('div#LTLoadingSplash').fadeIn(150);
                return It;
            }
        };
    }();
    It.PopulateProductCard = function (Data, Card, ImageOuterSelector, ImageIsThumb, NameSelector, RegPriceOuterSelector, MemPriceOuterSelector, CardIsLink, AddToCartButtonSelector) {
        if (Data && Card) {
            $.when(LT.LTCodes.Find('ItemTypes', 'name', 'Group')).done(function (GroupItemType) {
                var DetailLink = '/Zuc/ecomdetails?i=' + Data.code;
                if (ImageOuterSelector) {
                    var ImgAtt = It.GetECommerceAttachments(Data.attachments, ImageIsThumb)[0];
                    var ImgOuter = Card.find(ImageOuterSelector);
                    if (!$.isEmptyObject(ImgAtt)) {
                        if (!CardIsLink) {
                            ImgOuter.attr('href', DetailLink).attr('title', null);
                        }
                        ImgOuter.find('img').attr('src', ImgAtt.address).attr('alt', ImgAtt.description);
                    } else {
                        ImgOuter.find('img').attr('src', null).attr('alt', null);
                    }
                }
                if (NameSelector) {
                    var NameElem = Card.find(NameSelector);
                    if (!CardIsLink) {
                        NameElem.attr('href', DetailLink).attr('title', null);
                    }
                    NameElem.text(Data.description);
                }
                if (RegPriceOuterSelector || MemPriceOuterSelector) {
                    $.when(Data.itemTypeId != GroupItemType.id ? [Data] : It.AJAX('/API/Inventory/GetItemChildrenExt/' + (Data.childItemId || Data.id), 'GET', false, false, 'silent')).done(function (Results) {
                        Results.sort(function (A, B) { return A.msrp > B.msrp ? 1 : A.msrp < B.msrp ? -1 : 0; });
                        var MSRPLow = Results[0].msrp;
                        var MSRPHigh = Results[Results.length - 1].msrp;
                        if (RegPriceOuterSelector) {
                            var RegularPrice = It.PrintPrice(MSRPLow) + (MSRPHigh && MSRPHigh != MSRPLow ? '-' + It.PrintPrice(MSRPHigh) : '');
                            Card.find(RegPriceOuterSelector).children('span:eq(1)').text(RegularPrice);
                        }
                        if (MemPriceOuterSelector) {
                            var MemberPrice = It.PrintMemberPrice(MSRPLow) + (MSRPHigh && MSRPHigh != MSRPLow ? '-' + It.PrintMemberPrice(MSRPHigh) : '');
                            Card.find(MemPriceOuterSelector).children('span:eq(1)').text(MemberPrice);
                        }
                    });
                }
                if (CardIsLink) {
                    Card.attr('href', DetailLink).attr('title', null);
                }
                if (AddToCartButtonSelector) {
                    var ATCBtn = Card.find(AddToCartButtonSelector);
                    if (Data.itemTypeId != GroupItemType.id) {
                        ATCBtn
                            .addClass('LTAddToCart')
                            .attr('href', null).attr('title', null)
                            .attr('data-lt-item-id', Data.childItemId || Data.id)
                            .attr('data-lt-quantity', 1)
                            .attr('data-lt-item-type-id', Data.itemTypeId);
                    } else {
                        ATCBtn.hide();
                    }
                }
            });
        }
    };
    It.PopulateTopSellers = function (ItemId) {
        var TopSellerCont = $('.zuc-ec-carousel-cards');
        var TopSellerItemUI = $('.zuc-ec-carousel-card').first().clone();
        if (TopSellerCont.length && TopSellerItemUI.length) {
            TopSellerCont.empty();
            It.GetTopSellers(6, ItemId).done(function (Results) {
                Results.forEach(function (Ix) {
                    var NewTSItem = TopSellerItemUI.clone();
                    It.PopulateProductCard(Ix, NewTSItem, '.zuc-ec-carousel-card-image', true, '.zuc-ec-carousel-card-name span', '.zuc-ec-carousel-card-price-reg', '.zuc-ec-carousel-card-price-mem', true);
                    TopSellerCont.append(NewTSItem);
                });
            });
        } else {
            throw new Error('No top seller section on this page.');
        }
    };
    It.PrepMathForView = function (Math$, MultiplyCount) {
        if (typeof Math$ != 'undefined') {
            if (typeof Math$ != 'number')
                Math$ = parseFloat(Math$);
            var ReverseMultiplication = Math.pow(100, MultiplyCount || 0);
            return ((Math$ / 100) / ReverseMultiplication).toFixed(2);
        }
        return false;
    };
    It.PrepMoneyForMath = function (View$) {
        if (typeof View$ != 'undefined') {
            if (typeof View$ != 'number')
                View$ = parseFloat(View$);
            return Math.round(View$ * 100);
        }
        return false;
    };
    It.PrintBreadcrumbs = function () {
        var BreadcrumbCont = null;
        var BreadcrumbUI = null;
        var BreadcrumbCurrentUI = null;
        var BreadcrumbSlashUI = null;
        $(function () {
            BreadcrumbCont = $('.zuc-ec-breadcrumbs');
            BreadcrumbUI = $('.zuc-ec-breadlink').first().clone();
            BreadcrumbCurrentUI = $('.zuc-ec-bread-currentpage').clone();
            BreadcrumbSlashUI = $('.zuc-ec-breadslash').first().clone();
        });
        return function (CurrentItemId, CurrentItemDescription) {
            BreadcrumbCont.empty();
            $.when(
                It.AJAX('/API/Inventory/GetItemAncestor/' + CurrentItemId, 'GET', false, false, 'silent').then(function (Results) { return Results; }),
                LT.LTCodes.Get('ItemTypes')
            ).done(function (Ancestors, ItemTypes) {
                var CatalogItemTypeId = ItemTypes.find(function (ITx) { return ITx.name == 'Catalog'; }).id;
                Ancestors.pop();
                BreadcrumbCont.prepend(BreadcrumbCurrentUI.clone().text(CurrentItemDescription));
                Ancestors.forEach(function (Ix) {
                    if (Ix.itemTypeId == CatalogItemTypeId) {
                        BreadcrumbCont.prepend(BreadcrumbSlashUI.clone());
                        BreadcrumbCont.prepend(
                            BreadcrumbUI.clone()
                                .text(Ix.code)
                                .attr('href', Ix.code == 'Store' ? '/Zuc/ecomhome' : '/Zuc/ecomcategory?c=' + Ix.code).attr('title', null)
                        );
                    }
                });
            });
        };
    }();
    It.CalcMemberPrice = function (MSRP) {
        return It.PrepMathForView(
            It.PrepMoneyForMath(MSRP) * It.PrepMoneyForMath(0.9),
            1
        );
    };
    It.PrintMemberPrice = function (MSRP) {
        return It.PrintPrice(It.CalcMemberPrice(MSRP));
    };
    It.PrintPrice = function (Value) {
        return '$' + parseFloat(Value).toFixed(2);
    };
    It.ShowUI = function () {
        LT.Cart.RefreshCount();
        $('html').animate({ opacity: 1 }, 250);
    };

    return It;
}

if (!LT) var LT = {};
if (!LT.LTCodes) {
    LT.LTCodes = function () {
        var U = new LTPublicUtils();
        var Codes = {};
        var Requests = [];
        var APIsByKey = {
            'AffiliateLocationRelationTypeOptions': '/API/Core/GetEnums/AffiliateLocationRelationTypeOptions',
            'ItemTypes': '/API/FieldService/ItemTypesExt',
            'LocationAccuracyOptions': '/API/Core/GetEnums/LocationAccuracyOptions',
            'PreferredCommunicationOptions': '/API/Core/GetEnums/PreferredCommunicationOptions',
            'ShipViaList': '/API/Core/GetShipViaList',
        };
        return {
            Get: function (Key) {
                var Promise = new $.Deferred();
                if (Codes.hasOwnProperty(Key)) {
                    Promise.resolve(Codes[Key]);
                } else {
                    if (APIsByKey.hasOwnProperty(Key)) {
                        if (!Requests[Key]) {
                            Requests[Key] = U.AJAX(APIsByKey[Key], 'GET', false, false, 'silent')
                                .then(function (Result) {
                                    if (APIsByKey[Key].substr(0, 19) == '/API/Core/GetEnums/') {
                                        return Result[Key];
                                    } else {
                                        return Result;
                                    }
                                });
                        }
                        Requests[Key]
                            .then(function (Results) {
                                Codes[Key] = Results instanceof Array ? Results : Results.items;
                                Promise.resolve(Codes[Key]);
                            }, function () {
                                Promise.reject({ message: 'Error' });
                            });
                    } else {
                        Promise.reject({ message: 'Invalid key' });
                    }
                }
                return Promise;
            },
            Find: function (Key, Field, Value) {
                return $.when(LT.LTCodes.Get(Key)).then(function (Values) {
                    return Values.find(function (V) { return V[Field] == Value; });
                });
            },
        };
    }();
}
if (!LT.Cart) {
    LT.Cart = {
        AddItem: function (ItemId, Qty, ItemTypeId) {
            if (ItemId && Qty) {
                var ItemTypePromise = ItemTypeId
                    ? LT.LTCodes.Find('ItemTypes', 'id', ItemTypeId)
                    : {};
                return $.when(ItemTypePromise).then(function (ItemType) {
                    var Items = LT.Cart.GetItems();
                    // TODO: The "if" branch path must be modified to allow for multiple Service-type Items, if all the others are Single Plans; the same idea that only one Base or Combo plan can be purchased is still true
                    if (ItemType && ItemType.name == 'Service') {
                        var Existing = Items.find(function (Ix) { return Ix.itemTypeId == ItemTypeId; });
                        if (Existing) {
                            Items = LT.Cart.RemoveItem(Existing.id);
                        }
                        Items.push({ id: parseInt(ItemId, 10), quantity: 1, itemTypeId: parseInt(ItemTypeId, 10) });
                    } else {
                        var Existing = Items.find(function (Ix) { return Ix.id == ItemId; });
                        if (Existing) {
                            Existing.quantity += parseInt(Qty, 10);
                        } else {
                            Items.push({ id: parseInt(ItemId, 10), quantity: parseInt(Qty, 10), itemTypeId: parseInt(ItemTypeId, 10) });
                        }
                    }
                    return LT.Cart.SetItems(Items);
                });
            } else {
                return false;
            }
        },
        Clear: function () {
            localStorage.removeItem('LTEcomCart');
        },
        GetItems: function () {
            return JSON.parse(localStorage.getItem('LTEcomCart') || '[]');
        },
        GetFullItems: function () {
            var Items = LT.Cart.GetItems();
            return Items.length
                ? new LTPublicUtils()
                    .AJAX('/API/Inventory/ItemsExt?$filter=id eq ' + Items.map(function(Ix) { return Ix.id; }).join(' or id eq ') + '&$orderby=description asc', 'GET', false, false, 'silent')
                    .then(function (Result) {
                        Result.items.forEach(function (Ix) {
                            Ix['Quantity'] = Items.find(function (Ix2) { return Ix2.id == Ix.id; }).quantity;
                        });
                        return Result.items;
                    })
                : new $.Deferred().resolve([]);
        },
        RefreshCount: function () {
            var Count = LT.Cart.GetItems().length;
            $('.zuc-cart-count > span').text(Count);
            return true;
        },
        RemoveItem: function (ItemId) {
            if (ItemId) {
                var Items = LT.Cart.GetItems();
                var Item = Items.find(function (Ix) { return Ix.id == ItemId; });
                Items.splice(Items.indexOf(Item), 1);
                if (LT.Cart.SetItems(Items)) {
                    return Items;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },
        SetItems: function (Items) {
            if (Items instanceof Array) {
                localStorage.setItem('LTEcomCart', JSON.stringify(Items));
                LT.Cart.RefreshCount();
                return true;
            } else {
                return false;
            }
        },
        UpdateItemQuantity: function (ItemId, NewQuantity) {
            if (ItemId && NewQuantity) {
                var Items = LT.Cart.GetItems();
                var Item = Items.find(function (Ix) { return Ix.id == ItemId; });
                if (Item) {
                    Item.quantity = parseInt(NewQuantity, 10);
                    return LT.Cart.SetItems(Items);
                }
            }
            return false;
        },
    };
}
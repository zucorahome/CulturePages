/*

    ecomplan Controller for the View "ecomplan"
    Copyright 2018, LimeTAC Inc. All rights reserved.

*/

(function () {

    function FlyIn(Config) {

        var It = this;

        if (Config && Config.Title && Config.Content && Config.DoneButtonText) {

            if (!Config.CloseButtonText) Config.CloseButtonText = 'Close';

            It.Elem =
                $('<div class="ModalWrapper IEBoxModel">'
                    + '<div class="FlyIn IEBoxModel">'
                        + '<h1 class="Title">' + Config.Title + '</h1>'
                        + (Config.Subtitle ? '<h4 class="Description">' + Config.Subtitle + '</h4>' : '')
                        + Config.Content
                        + '<div class="ButtonStrip">'
                            + '<button class="zuc-btn zuc-btn-primary Close">' + Config.CloseButtonText + '</button>'
                            + '<button class="zuc-btn zuc-btn-secondary Done">' + Config.DoneButtonText + '</button>'
                        + '</div>'
                    + '</div>'
                + '</div>')
                    .appendTo('body');

            It.Decommission = function () {
                if (Config.CloseCallback) {
                    Config.CloseCallback(It);
                }
                It.Elem.remove();
            };

            It.Elem.find('.Done, .Close').on('click', function () {
                if ($(this).is('.Done')) {
                    if (Config.DoneCallback) {
                        Config.DoneCallback(It);
                    }
                }
                It.Decommission();
            });

            if (Config.ShowCallback) {
                Config.ShowCallback(It);
            }

        } else {

            throw new Error('Please provide required parameters when initialising.');

        }

        return It;

    }

    var NumberScroller = function () {
        $(document).on('click', '.NumberScroller i', function (E) {
            var Input = $(this).siblings('input');
            var Val = parseInt(Input.val() || 0, 10);
            if ($(this).is(':first-child')) { // minus
                var NewVal = Val - 1;
                var Min = Input.attr('data-lt-min');
                Input.val(NewVal >= Min ? NewVal : Min);
            } else { // add
                var NewVal = Val + 1;
                var Max = Input.attr('data-lt-max');
                if (!U.IsNumber(Max)) Max = Infinity;
                Input.val(NewVal <= Max ? NewVal : Val);
            }
            Input.trigger('change');
        });
        $(document).on('change', '.NumberScroller input', function () {
            var Val = $(this).val();
            if (U.IsNumber(Val)) {
                var Min = $(this).attr('data-lt-min');
                var Max = $(this).attr('data-lt-max');
                if (!U.IsNumber(Max)) Max = Infinity;
                if (Val < Min || Val > Max) {
                    $(this).val(0);
                }
                if ($(this).val() % 0 != 0) {
                    $(this).val(parseInt($(this).val(), 10));
                }
            } else {
                $(this).val(0);
            }
        });
        return function (Config) {

            if (!Config) Config = {};

            if (true) {

                var Id = Config.Id || U.GetRandomString(35);
                var Val = Config.DefaultValue || 0;
                var Min = Config.Minimum || 0;

                return '<div class="NumberScroller' + (!Config.Label ? ' NoLabel' : '') + '"'
                    + (typeof Config.CustomContainerAttributes != 'undefined' ? ' ' + Config.CustomContainerAttributes : '') + '>'
                    + (Config.Label ? '<label class="IEBoxModel" for="' + Id + '">' + Config.Label + '</label>' : '')
                    + '<span' + (!Config.Label ? ' class="ClearFixGroup"' : '') + '>'
                        + '<i>-</i>'
                        + '<input id="' + Id + '" type="text" data-lt-min="' + Min + '"' + (Config.Maximum ? ' data-lt-max="' + Config.Maximum + '"' : '') + ' value="' + Val + '" />'
                        + '<i>+</i>'
                    + '</span>'
                + '</div>';

            } else {

                throw new Error('Please provide all required paramters when initialising.');

            }

        };
    }();

    var U = new LTPublicUtils();

    var ItemCode = U.GetURIParam('i');

    var BasePlansPromise =
        $.when(
            LT.LTCodes.Find('ItemTypes', 'name', 'Service'),
            LT.LTCodes.Find('ItemTypes', 'name', 'Combo Plans')
        ).then(function (ServiceItemType, ComboPlansItemType) {
            return U.AJAX('/API/Inventory/ItemsExt?$filter=itemTypeId eq ' + ServiceItemType.id + ' and containerTypeId ne ' + ComboPlansItemType.id + ' and hasLabel eq true', 'GET', false, false, 'silent')
                .then(function (Result) {
                    return Result.items.sort(function (A, B) {
                        return A.msrp > B.msrp
                            ? 1
                            : A.msrp < B.msrp
                                ? -1
                                : A.code > B.code
                                    ? 1
                                    : A.code < B.code
                                        ? -1
                                        : 0;
                    }).map(function (Ix) {
                        Ix['DetailItems'] = Ix.details.split('\n').map(function (D) {
                            return D.split('|')[1];
                        });
                        Ix['AvailableToUser'] = U.IsProductServiceAvailableToUser(Ix.code) !== false;
                        return Ix;
                    });
                });
        });
    var ComboPlansPromise =
        $.when(
            LT.LTCodes.Find('ItemTypes', 'name', 'Service'),
            LT.LTCodes.Find('ItemTypes', 'name', 'Combo Plans')
        ).then(function (ServiceItemType, ComboPlansItemType) {
            return U.AJAX('/API/Inventory/ItemsExt?$filter=itemTypeId eq ' + ServiceItemType.id + ' and containerTypeId eq ' + ComboPlansItemType.id + ' and hasLabel eq true', 'GET', false, false, 'silent')
                .then(function (Result) {
                    return Result.items.map(function (Ix) {
                        Ix['IncludedBasePlans'] = Ix.details.split('\n').sort();
                        return Ix;
                    });
                });
        });
    var PointsSettingsPromise = U.AJAX("/API/Core/ApplicationConfigsExt?$filter=name eq 'RewardPointsSettings'", 'GET', false, false, 'silent')
        .then(function (Result) {
            return Result && Result.items && Result.items.length && Result.items[0].value
                ? Result.items[0].value.split('|')
                : [];
        });
    var SinglePlansPromise =
        LTAppSettingUserIsSignedIn
            ? $.when(
                LT.LTCodes.Find('ItemTypes', 'name', 'Service'),
                LT.LTCodes.Find('ItemTypes', 'name', 'Combo Plans')
            ).then(function (ServiceItemType, ComboPlansItemType) {
                return U.AJAX('/API/Inventory/ItemsExt?$filter=itemTypeId eq ' + ServiceItemType.id + ' and containerTypeId ne ' + ComboPlansItemType.id + ' and hasLabel eq false', 'GET', false, false, 'silent')
                    .then(function (Result) {
                        Result.items.forEach(function (SP) {
                            SP['Quantity'] = ko.observable(0);
                        });
                        return Result.items.sort(function (A, B) {
                            return A.code > B.code ? 1 : A.code < B.code ? -1 : 0;
                        });
                    });
            })
            : new $.Deferred().resolve([]);
    var ApplicationOwnerPromise =
        LTAppSettingUserIsSignedIn
            ? U.AJAX('/API/Core/GetApplicationOwner', 'GET', false, false, 'silent')
                .then(function (Result) {
                    return U.AJAX('/API/Core/Affiliates?$filter=id eq ' + Result.id, 'GET', false, false, 'silent');
                })
                .then(function (Result) {
                    return Result.items[0];
                })
            : new $.Deferred().resolve({});

    $(function () {
        var VM = function () {

            var VM = this;

            VM.PrepMoneyForMath = U.PrepMoneyForMath;
            VM.PrepMathForView = U.PrepMathForView;

            VM.SinglePlans = ko.observableArray([]);
            VM.BasePlans = ko.observableArray([]);
            VM.ComboPlans = ko.observableArray([]);
            VM.SelectedPlan = ko.observable(null);
            VM.CoveredBasePlans = ko.computed(function () {
                var SP = VM.SelectedPlan();
                if (SP) {
                    var IBPs = [];
                    if (SP.IncludedBasePlans instanceof Array) {
                        SP.IncludedBasePlans.forEach(function (Code) {
                            IBPs.push(VM.BasePlans().find(function (BP) { return BP.code == Code; }));
                        });
                    } else {
                        IBPs.push(SP);
                    }
                    return IBPs.sort(function (A, B) {
                        return A.code > B.code ? 1 : A.code < B.code ? -1 : 0;
                    });
                }
                return [];
            });
            VM.ToggleBasePlan = function (BasePlan) {
                VM.SinglePlans().forEach(function (SP) {
                    if (SP.containerTypeId == BasePlan.containerTypeId) {
                        SP.Quantity(0);
                    }
                });
                var DesiredCoverage = VM.CoveredBasePlans().indexOf(BasePlan) < 0
                    ? VM.CoveredBasePlans().concat([BasePlan]).map(function (P) { return P.code; }).sort() // cover
                    : VM.CoveredBasePlans().map(function (P) { return P.code; }).filter(function (Code) { return Code != BasePlan.code; }); // decover
                var NewPlan = DesiredCoverage.length > 1
                    ? VM.ComboPlans().find(function (CP) {
                        return CP.IncludedBasePlans.sort().join(',') === DesiredCoverage.join(',');
                    })
                    : VM.BasePlans().find(function (BP) {
                        return BP.code == DesiredCoverage[0];
                    });
                VM.SelectedPlan(NewPlan);
            };
            VM.Discount = ko.computed(function () {
                var SP = VM.SelectedPlan();
                var CBPs = VM.CoveredBasePlans();
                if (SP && CBPs.length > 1) {
                    var BPCost = CBPs.reduce(function (Acc, P) { return Acc + U.PrepMoneyForMath(P.msrp); }, 0);
                    var SPCost = U.PrepMoneyForMath(SP.msrp);
                    return parseFloat(Math.ceil(U.PrepMathForView(BPCost - SPCost)));
                }
                return 0;
            });
            VM.RewardsPercentage = ko.observable(null);
            VM.Rewards = ko.computed(function () {
                var SP = VM.SelectedPlan();
                return SP
                    ? parseFloat(
                        U.PrepMathForView(
                            U.PrepMoneyForMath(SP.msrp) * U.PrepMoneyForMath(VM.RewardsPercentage()),
                            1
                        )
                    )
                    : 0;
            });
            VM.PointsFactor = ko.observable(null);
            VM.Points = ko.computed(function () {
                return Math.round(
                    U.PrepMathForView(
                        U.PrepMoneyForMath(VM.Rewards()) * U.PrepMoneyForMath(VM.PointsFactor()),
                        1
                    )
                );
            });

            VM.Step = ko.computed(function () {
                return 1 + VM.CoveredBasePlans().length;
            });
            VM.StepLabel = ko.computed(function () {
                return 'Step ' + VM.Step();
            });
            VM.StepTitle = ko.computed(function () {
                var S = VM.Step();
                if (S == 1) {
                    return 'Choose your Smarter Living Plan:';
                } else if (S == 2) {
                    return 'Make it a Combo:';
                } else if (S == 3) {
                    return 'Complete your bundle:';
                } else if (S == 4) {
                    return 'Complete your purchase:';
                }
            });

            VM.AddToCart = function (ignore, E, CheckOut) {
                var Item = VM.SelectedPlan();
                var AddPromises = [LT.Cart.AddItem(Item.id, 1, Item.itemTypeId)];
                VM.SinglePlans().forEach(function (SP) {
                    if (SP.Quantity() > 0) {
                        AddPromises.push(
                            LT.Cart.AddItem(SP.id, SP.Quantity(), SP.itemTypeId)
                        );
                    }
                });
                $.when.apply(null, AddPromises).done(function () {
                    if (LTAppSettingUserIsSignedIn) {
                        window.location.href = '/Zuc/ecomcheckout';
                    } else {
                        window.location.href = CheckOut ? '/Zuc/ecomcart' : '/Zuc/ecomhome';
                    }
                });
            };
            VM.DowngradeToSinglePlan = function (BasePlan, E) {
                E.stopImmediatePropagation();
                LT.LTCodes.Find('ItemTypes', 'id', BasePlan.containerTypeId).done(function (BPContType) {
                    new FlyIn({
                        Title: BPContType.name,
                        Subtitle: 'Select the item(s) you want to cover',
                        Content:
                            '<div class="Inputs">'
                                + VM.SinglePlans().reduce(function (A, SP) {
                                    return SP.containerTypeId == BPContType.id
                                        ? A + NumberScroller({
                                            Minimum: 0,
                                            Label: SP.code,
                                            DefaultValue: SP.Quantity(),
                                            CustomContainerAttributes: 'data-lt-plan-id="' + SP.id + '"',
                                        })
                                        : A;
                                }, '')
                            + '</div>',
                        DoneButtonText: 'Select',
                        DoneCallback: function (FI) {
                            // unselect base plan, if necessary
                            if (VM.CoveredBasePlans().indexOf(BasePlan) > -1) {
                                VM.ToggleBasePlan(BasePlan);
                            }
                            // maintain single plan quantities
                            $('.NumberScroller', FI.Elem).each(function () {
                                var Val = parseInt($(this).find('input').val(), 10);
                                var ItemId = $(this).attr('data-lt-plan-id');
                                var Item = VM.SinglePlans().find(function (SP) { return SP.id == ItemId; });
                                Item.Quantity(Val);
                            });
                        },
                    });
                });
            };
            VM.PlayBasePlanVideo = function () {
                var CloseLearnMore = $.noop;
                $(document).on('keyup', function (E) {
                    if (E.which == 27) { // [Esc]
                        CloseLearnMore();
                    }
                });
                return function (BP, E) {
                    var Att = BP.attachments.find(function (AX) { return AX.address.split('.').pop().toUpperCase() == 'MP4'; });
                    if (Att) {
                        var VidCont =
                            $('<div class="LearnMoreWrapper FlexContainer FlexCentreAll">'
                                + '<div class="LearnMoreContainer Invisible">'
                                    + '<video class="LearnMoreVideo" src="' + Att.address + '" controls autoplay preload="auto"></video>'
                                    + '<span class="CloseLearnMore"></span>'
                                + '</div>'
                            + '</div>')
                                .appendTo('body');
                        setTimeout(function () { VidCont.find('.Invisible').removeClass('Invisible'); });
                        CloseLearnMore = function () {
                            VidCont.find('video')[0].pause();
                            VidCont.addClass('Done');
                            setTimeout(function () { VidCont.remove(); }, 600);
                            CloseLearnMore = $.noop;
                        };
                        VidCont.on('click', '.CloseLearnMore', function () {
                            CloseLearnMore();
                        });
                    }
                    E.stopImmediatePropagation();
                };
            }();

            return VM;

        }();
        // set up breadcrumbs
        $('.zuc-ec-breadcrumbs').children().not(':eq(0), :eq(1), :eq(6)').remove();
        $('.zuc-ec-breadcrumbs').children(':eq(0)').attr('href', '/Zuc/ecomhome');
        $('.zuc-ec-breadcrumbs').children(':eq(2)').text('Smarter Living Plans');
        // ingest plans
        $.when(
            BasePlansPromise,
            ComboPlansPromise,
            PointsSettingsPromise,
            SinglePlansPromise,
            ApplicationOwnerPromise
        ).done(function (BasePlans, ComboPlans, PointsSettings, SinglePlans, AO) {
            VM.SinglePlans(SinglePlans);
            VM.BasePlans(BasePlans);
            VM.ComboPlans(ComboPlans);
            if (ItemCode) {
                var TargetPlan = BasePlans.concat(ComboPlans).find(function (P) { return P.code == ItemCode; });
                if (TargetPlan) {
                    var TargetPlanAvailableToUser = TargetPlan.IncludedBasePlans
                        ? TargetPlan.IncludedBasePlans.every(function (Code) { return VM.BasePlans().find(function (P) { return P.code == Code; }).AvailableToUser; })
                        : VM.BasePlans().find(function (P) { return P.code == TargetPlan.code; }).AvailableToUser;
                    if (TargetPlanAvailableToUser) {
                        VM.SelectedPlan(TargetPlan);
                    }
                }
            }
            VM.RewardsPercentage(parseFloat(PointsSettings[3]) || 0.01);
            VM.PointsFactor(parseFloat(PointsSettings[0]) || 1000);
            if (LTAppSettingUserIsSignedIn) {
                LT.Cart.Clear();
                $('body').addClass('SalesFlow');
                var AOIntroVideoURL =
                    AO.attachments.find(function (A) {
                        var Ext = A.address.split('.').pop().toUpperCase();
                        var Name = decodeURIComponent(A.address.split('/').pop());
                        return Ext == 'MP4' && /Cover Intro/.test(Name);
                    }).address;
                var Intro = $('<div class="Intro FullSplash IEBoxModel">'
                    + '<div class="zuc-nav-wrapper">'
                        + '<nav class="zuc-main-nav flex flex-hor-start flex-hor-between flex-vert-center u-uppercase">'
                            + '<a class="zuc-nav-brand" href="/Zuc/ecomplan"><img src="/Images/Zuc/images/ZucoraHome-brand-white.svg"></a>'
                        + '</nav>'
                    + '</div>'
                    + '<div class="Info">'
                        + '<h1>Discover Smarter Living Plans</h1>'
                        + '<video src="' + AOIntroVideoURL + '" controls preload="metadata"></video>'
                    + '</div>'
                    + '<button class="Close zuc-btn zuc-btn-secondary">Next</button>'
                + '</div>').appendTo('body');
                Intro.find('.Close').on('click', function () {
                    Intro.fadeOut(500, function () {
                        $(this).remove();
                    });
                });
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
                        + '<img class="partner_logo" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAABQCAMAAAD84m1YAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MjA3Q0VGOEQyNjQ4MTFFOTk4MzY5RDY1QzVEMjg4NzkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MjA3Q0VGOEUyNjQ4MTFFOTk4MzY5RDY1QzVEMjg4NzkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyMDdDRUY4QjI2NDgxMUU5OTgzNjlENjVDNUQyODg3OSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoyMDdDRUY4QzI2NDgxMUU5OTgzNjlENjVDNUQyODg3OSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkB/WzMAAABgUExURbOqAP/yAJKLAHJtBf/+AFFNAPPoADEvAOXaAP/1AP/6AAAAANTKAOziANzSAMC3AMrBABQTAKKbAIN9AGJdAPnwAPzzAP3wAPrtAEA9APr0APbuAAsKACEfAA4OEwAAAOfTPx8AAAAgdFJOU/////////////////////////////////////////8AXFwb7QAACU1JREFUeNrMmguXoyoSgFEKeSiiQidhonf//7/cQsCYtJpH9+xdzkyfdNrEz3pXAfnP/9EiP/v4Pw/rX4CpV2sc+6mf8F8/juv3/wcw6U795B21AzFNI4Suqgr/CyGazpDSOuan8SMi8iZIz50dOnE9wbyUkkqmhS9VfPNctWagjI9vEpHXQcbJlUbIcDu8dXGwECxcVbXEsukNHvIiyeSG5hye+pDigQmRVNWVrH8RiLxAMnrbfT1wzM/+ClmQpDaUv8JDnpOULd5YPtxAd4SQ7gIvCQqvv3Yzz+cw+GFumxOoh+9WykRTqHl5VS+qDOBiXH/MQ45QGKk2VAENi44VfnitXrYhAFEeiofsooyuURtakDDMHsuN7sI3M/mGSSv4In4fh+yg9LQFtSluGxWkQcEQXhEo3lgSUMd7OGRHKtsoKOoyJoEWEaALL5kqivdwwPhtGrLFwrodlAJIjPNlEAeYOQJVsnhzwYlMWzjkO8o0qL2HVaKPSrrKRUpjq96FQelUdoOGfGNxej94QPSjepjtRLn5l+59mOIkIZj/MUzdD7D/3VlJ0ywYWU0fw4Qv+6KPNOReLL498A158hHGwgptbD6DQV2Rvt6FQRV9HflpFkyykqSzXsviwwXtvarImsUepxqVBBOdWYlYrvDzxzAFaLamISuW8jvLunCBblybb4p+NYXi86W+1jTkkKWo9OUGQ1PNKdTKfGvzE5hCyRUNOWQB25f5XsvdGaxCcc2lLH5E84c9wgRpb3wpCoPBg/nGZJTDX9LZT2iuvH6AYSe5nYkWZwFX37xHqhT++Jf8IQz6VPZwkmKdUHvOnPS0aMnBSkk/tJjbXW4wu3WA1H09xfLpTktgxl9wpRuNW8PslgEhsLG52Mu+FJI0NMlg/M+VFJ95qjPMQeKdqwSHWVxeFi1JMImFi1cr4CcuF7SeYdy+sGdD9Q1AsxjJn3LMLK8q6XIuDrHl15RgMNUdwOggkZ42NmuJ8ITFBJxf9F7HuT8se1A0CcYfXHaCZorDhtzy596/PL2areUJ+d0fbMV3tRXCVoQ5jlvQ+vr7ciJ1/jLX/WnJ3Ebiml+gvaC98RNchBCXvTYU2AzztG5UX+V0T9Jjvd4aUg7EtBLmZlcQS52jlgjEkcJaO5REgeiMUKjqvq0oH8ees7I7b90OO40Zhj9zTwl66JfZ0MQGASSNO7D7JQoNy/ULKK1SD1N7E1r+0cmT0O3tebjZoFHNWAcY99wnQKebsba9oEboenTVQMXXcvPXlDn6JUzeX7EVtYMqA4x9AWaoc1pEladc0MdRB+aLlLV4enoi79VqIX2CdQNGCr6ZBrFyCzAv5N3cFYwhyqWEPXbpXduOCapNdG0SUQpIFk48JQ9QjSth2/0Rhv7zvD+VWUs+uEIq8RykzF3G36dLVuYwpJAEPIkzVag107DbHtIA80KzvCTJ8FC5RzCQJDLwBJcvIy4J5MyTUbV5EDqVeyV/hPnnuZoWg23UUoijIKJEepLNKV02dtFkGshXytPNfvlOuA+ZG22mfAazJMnZ9JSJGssWwobcv0iePDp1DcnssSRYHCCwbbc2qPMA87QmidOG3LxlgdBckNMEqpIybLapJKnwqXUw2H54fJIA83SmkZuSGCCyZyX/KmHxlPT4hiW1JeMiISarcgmLmw8/JyeEeTrTkCk5ofLxl/Mqfk0OI96UTSba7dSMaYKTQgBmm5C5WtofwITCKcA8q2Oz+GOolqktsGTAtANCR38eMSdFKkqS2iDZzqnyzIYkZg/6CfxjzNq7RpPm7+Vdj5IMyDWiJdb37SXCuSHF4YZmk7GpzZqhRp7S2WZvHvwtwmzrCbP/GZMuIZ1f9ShLix2+Pzy3OvH72kLlSJeMa8kW60fa1FIsOzcEFzK1m/q724TaBGnsfd5RZH2Vr1J92kLVJ6un023zx2+H2LmciTDfOzGobP9YT02UaIWJEkjKkFhP8A6DSEv91Pf9NHGPAbZzjjFGMYe4eWmprk2odhhz1py3E1MoIBLMN9efBycbq2flvJ2hG1Sf6Zo4FlAgK611ddGtvshqrubUKQyhU+kXN1lmA5R7Zf+tb+rv59xST/Xu4o6ItNe01LRhs0liXBmnFmgJ8zA7/EAxyjD6TQPy2+vtljK1t+6uMo0m52lZ2ryDdS8gb41WDwkYrizEEOUNdKSS0hBZ6BY1W5EuSAffwJKQGLnZgax77TsbDhqsxyFtq7ltASEQEcVckst5sytMmvlVaV4NzDFFnbcVp4xpRieMZPMbrafTNwuWytX3Uwgsle7ruiGqV+l+X2M9d6Vp9bmoxMDCAxhQxguuG0482rnh+KNkMBiF74MpyQDsm+umdnI9LJpu7WGIVmO0IpUzEfXjDtE4cZ58F+8DJSW9YxTrudKVVFnbTAyrBnAYBECUbnrsRZYZxHqMxjWsJYNVNMpeu5xpVVuyAyHNF6ELgRuo1Z3wHb5yQRCVphNGBAwwrfCD8Rf5wDLWGwNGn2nmZDRag9EhetUYRItfKIjbd7MxKBbTKBa5V9Zx0/LWN1c/eEWYJidOGj9woAweQm9fb45eeZ5I37Ui6FbZnubtPbutsHgRRroL4WxQpWekcpfWVRgBW+MA3+ha7ujd/pRcy+VhKD2lu8rrisYPEu42SqUYMOTeS4UNxTKIVFqrkxQazgWKShbYaZ0x5IhKSfxLdZdzyr2hdPCp5ENSGccxwnNmu/O3qBn2T3UT9vZDiA89bSPXF83Pvgggz2bkHGwKebB7QB72VOgVUri8YIi/qL3tYpk6/RSMPhssPu6BPe6q1LyD/CRS/sqQbG+7MvTvzza/RnuF4m8vCYJ93/0iG7uCnAD8ZZRr2b+wE5c2KRtQf48F6zG+uWNKdja1afuXcNJe8jub7AGnAZC/jyLJ7rb2/vGDEMmM/F3xKKiGgw3/o4MZ88EL8WviwZDVzbnuwyMr8yyR6NgV/Eg7IcsOIan96DDP3MMGHiU/txOQ7Vx8PTvN88Ixp9QVfH0CJMNBJxMT/W8dAItdQdlUc7chX9RMyKfmnSNgLx+Ni32cp0OnzyoeipMHJ9HURZiS8v6tw3FvHRrMZTijJemwEM8H85aFhBfRdNg/ev7BucH3j1PeCvHJe6xmqC1t+GcpdrCeT/348YnKjw+aHlXm/9Kp199d/xVgAHHsDI1Pd69JAAAAAElFTkSuQmCC" style="height: 40px; vertical-align: middle;" />'
                        + '<span class="username" style="vertical-align: middle; margin-left: 0.5vw;">' + LTAppSettingUserName + '</span>'
                    + '</div>'
                );
                $('.zuc-nav-brand').attr('href', null);
            }
            // bind to data
            ko.applyBindings(VM);
            // auto-select all available plans, if user signed in and no plan was passed as a parameter
            if (LTAppSettingUserIsSignedIn && !VM.SelectedPlan()) {
                $('.zuc-ec-action-zone-info-col').trigger('click');
            }
            U.ShowUI();
        });
        // top sellers
        U.PopulateTopSellers();
    });


})();
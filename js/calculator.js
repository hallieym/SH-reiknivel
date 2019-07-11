(function($) {

    // const

    var ASSETS_LIMIT_LOWER = 6500000.0;
    var ASSETS_LIMIT_UPPER = ASSETS_LIMIT_LOWER * 1.6;
    var INCOME_SUBTRACTION_RATIO = 0.09;
    var MAX_SUPPORT_RATIO = 0.75;

    var DWELLERS_BASE_1 = 389520.0;
    var DWELLERS_BASE_2 = 515172.0;
    var DWELLERS_BASE_3 = 603132.0;
    var DWELLERS_BASE_4 = 653388.0;

    var DWELLERS_LIMIT_1 = 3885000.0;
    var DWELLERS_LIMIT_2 = 5138226.0;
    var DWELLERS_LIMIT_3 = 6015484.0;
    var DWELLERS_LIMIT_4 = 6516774.0;

    // special

    var LOW_RENT = 91300.0;
    var SPECIAL_SUPPORT_RATIO = 1.00
    var MAX_SUPPORT_RATIO_LOWER = 0.75;
    var MAX_SUPPORT_RATIO_HIGHER = 0.75;
    var MAX_TOTAL_SUPPORT = 90000.0;
    var MAX_ASSETS = 5769000.0;
    var MIN_HOUSING_COST = 40000.0;

    var DWELLERS_LOWER_1 = 3885000.0;
    var DWELLERS_LOWER_2 = 5138226.0;
    var DWELLERS_LOWER_3 = 6015484.0;
    var DWELLERS_LOWER_4 = 6516774.0;

    var DWELLERS_UPPER_1 = 4856250.0;
    var DWELLERS_UPPER_2 = 6422783.0;
    var DWELLERS_UPPER_3 = 7519355.0;
    var DWELLERS_UPPER_4 = 8145968.0;

    // dom

    var dwellers = document.getElementById('dwellers');
    var income = document.getElementById('income');
    var assets = document.getElementById('assets');
    var cost = document.getElementById('cost');

    var incomeError = document.getElementById('income-error');
    var assetsError = document.getElementById('assets-error');
    var costError = document.getElementById('cost-error');

    var supportDisplay = document.getElementById('support');
    var specialSupportDisplay = document.getElementById('special-support');
    var totalDisplay = document.getElementById('total');
    var supportRatioDisplay = document.getElementById('support-ratio');
    var supportLevelDisplay = document.getElementById('support-level');

    var dotAmonunt = function(value) {
        value = value.split('.').join('');
        value = value.replace(/\B(?=(\d{3})+\b)/g, '.');
        return value;
    }

    $('.currency').on('keydown', function(e) {
        clearResult();
        if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'End', 'Home'].indexOf(e.key) !== -1)
            return;
        if (e.key === 'Enter')
            calculate();
        if (isNaN(e.key))
            e.preventDefault();
    });

    $('.currency').on('keyup', function(e) {
        if (isNaN(e.key) && e.key !== 'Backspace')
            return;

        var pos = e.target.selectionStart;
        var current = e.target.value;
        var fixed = dotAmonunt(current);
        e.target.value = fixed;
        if (fixed.length > current.length)
            pos += 1;
        e.target.setSelectionRange(pos, pos);
    });

    $('.currency').on('blur', function(e) {
        e.target.value = dotAmonunt(e.target.value);
    });

    var clearErrors = function() {
        $(incomeError).removeClass('has-error');
        $(assetsError).removeClass('has-error');
        $(costError).removeClass('has-error');
    }

    var clearResult = function() {
        supportDisplay.innerHTML = specialSupportDisplay.innerHTML = totalDisplay.innerHTML = '';
        supportRatioDisplay.innerHTML = supportLevelDisplay.innerHTML = '';
    }

    var validate = function() {
        clearErrors();
        var re = /^\d.+$/;
        var isValid = true;

        if (!income.value.length) {
            isValid = false;
            $(incomeError).addClass('has-error');
        }

        if (!assets.value.length) {
            isValid = false;
            $(assetsError).addClass('has-error');
        }

        if (!cost.value.length) {
            isValid = false;
            $(costError).addClass('has-error');
        }

        return isValid;
    }

    // calc

    var getDwellersBase = function(dwellers) {
        switch (dwellers) {
            case 1: return DWELLERS_BASE_1;
            case 2: return DWELLERS_BASE_2;
            case 3: return DWELLERS_BASE_3;
            case 4: return DWELLERS_BASE_4;
        }
    }

    var getDwellersLimit = function(dwellers) {
        switch (dwellers) {
            case 1: return DWELLERS_LIMIT_1;
            case 2: return DWELLERS_LIMIT_2;
            case 3: return DWELLERS_LIMIT_3;
            case 4: return DWELLERS_LIMIT_4;
        }
    }

    var getDwellersLower = function(dwellers) {
        switch (dwellers) {
            case 1: return DWELLERS_LOWER_1;
            case 2: return DWELLERS_LOWER_2;
            case 3: return DWELLERS_LOWER_3;
            case 4: return DWELLERS_LOWER_4;
        }
    }

    var getDwellersUpper = function(dwellers) {
        switch (dwellers) {
            case 1: return DWELLERS_UPPER_1;
            case 2: return DWELLERS_UPPER_2;
            case 3: return DWELLERS_UPPER_3;
            case 4: return DWELLERS_UPPER_4;
        }
    }

    var getIncomeSubtraction = function(yearlyIncome, incomeLimit, baseAmount) {
        if (yearlyIncome <= incomeLimit)
            return 0.0;
        if (baseAmount + ((incomeLimit - yearlyIncome) * INCOME_SUBTRACTION_RATIO) < 0.0)
            return -baseAmount;
        return (incomeLimit - yearlyIncome) * INCOME_SUBTRACTION_RATIO;
    }

    var getAssetSubtraction = function(assets, support) {
        if (assets > ASSETS_LIMIT_UPPER)
            return -support;
        if (assets <= ASSETS_LIMIT_LOWER)
            return 0.0;
        return (assets - ASSETS_LIMIT_LOWER) / (ASSETS_LIMIT_UPPER - ASSETS_LIMIT_LOWER) * -support;
    }

    var getMaxRatio = function(cost) {
        if (cost >= LOW_RENT)
            return MAX_SUPPORT_RATIO_HIGHER;
        return MAX_SUPPORT_RATIO_LOWER;
    }

    var getMaxSupport = function (cost, hb_monthlySupport) {
        if ((cost - hb_monthlySupport) > MIN_HOUSING_COST)
            return cost - MIN_HOUSING_COST;
        return 0.0;
    }

    var getSpecialSubtraction = function(yearlyIncome, incomeLower, incomeUpper, specialSupport) {
        if (yearlyIncome < incomeLower)
            return 0.0;
        if (yearlyIncome > incomeUpper)
            return -specialSupport;
        return (incomeLower - yearlyIncome) / (incomeUpper - incomeLower) * specialSupport;
    }

    var getFixedSpecialSupport = function(minValue, hb_monthlySupport, assets) {
        if (minValue - hb_monthlySupport < 0.0)
            return 0.0;
        if (assets > MAX_ASSETS)
            return 0.0;
        return minValue - hb_monthlySupport;
    }

    var getSupportRatio = function(cost, hb_monthlySupport, income) {
        if (cost - hb_monthlySupport === 0 || income === 0)
            return 0.0;
        return (cost - hb_monthlySupport) / income;
    }

    var getSupportLevel = function(supportRatio) {
        if (supportRatio > 0.3)
            return 2;
        if (supportRatio > 0.2)
            return 1;
        return 0;
    }

    var parseInput = function(value) {
        return parseFloat(value.replace(/\./g, ''));
    }

    var printFormat = function(value) {
        return dotAmonunt(Math.round(value).toString());
    }

    var calculate = function() {
        if (!validate())
            return;

        var cleaned = {};
        cleaned.dwellers = parseInt(dwellers.value);
        cleaned.income = parseInput(income.value);
        cleaned.assets = parseInput(assets.value);
        cleaned.cost = parseInput(cost.value);

        var yearlyIncome = cleaned.income * 12.0;
        var baseAmount = getDwellersBase(cleaned.dwellers);
        var incomeLimit = getDwellersLimit(cleaned.dwellers);

        // general

        var incomeSubtraction = getIncomeSubtraction(yearlyIncome, incomeLimit, baseAmount);
        var support = baseAmount + incomeSubtraction;

        var assetSubtraction = getAssetSubtraction(cleaned.assets, support);
        var support = support + assetSubtraction;

        var hb_monthlySupport = Math.round(support / 12.0);

        var maxSupport = cleaned.cost * MAX_SUPPORT_RATIO;

        if (hb_monthlySupport > maxSupport)
            hb_monthlySupport = maxSupport;

        supportDisplay.innerHTML = printFormat(hb_monthlySupport);

        // special

        // var maxRatio = getMaxRatio(cleaned.cost);
        var incomeLower = getDwellersLower(cleaned.dwellers);
        var incomeUpper = getDwellersUpper(cleaned.dwellers);

        var specialSupport = hb_monthlySupport * SPECIAL_SUPPORT_RATIO;

        var specialSubtraction = getSpecialSubtraction(
                yearlyIncome, incomeLower, incomeUpper, specialSupport);

        var specialSupport = specialSupport + specialSubtraction;

        if (cleaned.assets > MAX_ASSETS)
            specialSupport = 0.0;

        var totalSupport = hb_monthlySupport + specialSupport;

        // var maxSpecialSupport = cleaned.cost * maxRatio;
        var maxSupportComparedToMinHousingCost = getMaxSupport(cleaned.cost, hb_monthlySupport);

        var minValue = Math.min(totalSupport, MAX_TOTAL_SUPPORT, maxSupportComparedToMinHousingCost);

        var fixedSpecialSupport = getFixedSpecialSupport(
                minValue, hb_monthlySupport, cleaned.assets);

        specialSupportDisplay.innerHTML = printFormat(fixedSpecialSupport);

        totalDisplay.innerHTML = printFormat(hb_monthlySupport + fixedSpecialSupport);

        // ratio

        var supportRatio = getSupportRatio(cleaned.cost, hb_monthlySupport, cleaned.income);

        supportRatioDisplay.innerHTML = Math.floor(supportRatio * 1000) / 10 + '%';

        supportLevelDisplay.innerHTML = getSupportLevel(supportRatio);
    }

    document.getElementById('calculate').onclick = calculate;

    document.getElementById('clear').onclick = function(e) {
        clearErrors();
        clearResult();
        dwellers.value = '1';
        income.value = assets.value = cost.value = '';
    }

})(jQuery);

'use strict';

var typeis = require('blear.utils.typeis');
var array = require('blear.utils.array');
var BigInt = require('./big-integer/BigInteger');


var reFormat = /(\d)(?=(\d{3})+$)/g;
// k,m,g,t,p
// @ref http://searchstorage.techtarget.com/definition/Kilo-mega-giga-tera-peta-and-all-that
var ABBR_SUFFIX = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
var STR_62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
var reEndZero =/((\.\d*[1-9])0+|\.0+)$/;

exports.BigInt = BigInt;

/**
 * 整数化
 * @param num {*} 待转换对象
 * @param [dftNum=0] {*} 当为 NaN 时的默认值
 * @returns {*}
 */
var parseInt2 = exports.parseInt = function (num, dftNum) {
    dftNum = dftNum || 0;
    num = parseInt(num, 10);

    return typeis.NaN(num) ? dftNum : num;
};


/**
 * 浮点化
 * @param num {*} 待转换对象
 * @param [dftNum=0] {*} 当为 NaN 时的默认值
 * @returns {*}
 */
var parseFloat2 = exports.parseFloat = function (num, dftNum) {
    dftNum = dftNum || 0;
    num = parseFloat(num);

    return typeis.NaN(num) ? dftNum : num;
};


/**
 * 数字格式化
 * @param num {String|Number} 数字（字符串）
 * @param [separator=","] {String} 分隔符
 * @returns {string} 分割后的字符串
 * @example
 * number.format(123456.789);
 * // => "123,456.789"
 * number.format(123456.789, '-');
 * // => "123-456.789"
 */
var format = exports.format = function (num, separator) {
    separator = separator || ',';

    var arr = String(num).split('.');
    var p1 = arr[0].replace(reFormat, '$1' + separator);

    return p1 + (arr[1] ? '.' + arr[1] : '');
};


/**
 * 数字缩写
 * @param num {Number} 数值
 * @param [fixedLength=0] {Number} 修正长度
 * @param [maxLevel=2] {Number} 最大级数，到 K
 * @returns {*}
 * @example
 * number.abbr(123456.789);
 * // => "123K"
 * number.abbr(123456.789, 2);
 * // => "123.46K"
 */
exports.abbr = function (num, fixedLength, maxLevel) {
    // 123.321 => 123
    num = parseFloat2(num, 0);
    fixedLength = fixedLength || 0;

    var step = 1000;
    var i = 0;
    var j = Math.min(ABBR_SUFFIX.length, maxLevel || 2);

    while (num >= step && ++i < j) {
        num = num / step;
    }

    if (i === j) {
        i = j - 1;
    }

    return format(num.toFixed(fixedLength)).replace(reEndZero, '$2') + ABBR_SUFFIX[i];
};

/**
 * 十进制转换为任意进制字符串
 * @param number10 {String} 十进制数值或字符串，可以是任意长度，会使用大数进行计算
 * @param [pool] {String} 进制池，默认为 62 进制
 * @returns {String}
 */
exports.toAny = function (number10, pool) {
    var bigInt = BigInt(number10);
    pool = pool || STR_62;
    var ret = [];
    var decimal = pool.length;
    var _cal = function () {
        var y = bigInt.mod(decimal);
        bigInt = bigInt.divide( decimal);
        ret.unshift(pool[y]);

        if (bigInt.gt(0)) {
            _cal();
        }
    };

    _cal();
    return ret.join('');
};


/**
 * 任意进制转换为十进制
 * @param numberAny {String} 任意进制字符串
 * @param [pool] {String} 进制池，默认为 62 进制
 * @returns {String}
 */
exports.fromAny = function (numberAny, pool) {
    var bigInt = BigInt(0);
    var len = numberAny.length;
    pool = pool || STR_62;
    var decimal = pool.length;
    var map = {};

    array.each(new Array(62), function (index) {
        map[pool[index]] = index;
    });

    array.each(new Array(len), function (index) {
        var pos = numberAny[index];
        var pos10 = map[pos];

        bigInt = bigInt.add(
            BigInt(pos10).multiply(
                BigInt(decimal).pow(len - index - 1)
            )
        );
    });

    return bigInt.toString();
};

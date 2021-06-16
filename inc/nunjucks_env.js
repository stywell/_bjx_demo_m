const nunjucks = require('nunjucks')
const path = require('path')


const isProd = process.env.NODE_ENV === 'production'

const filter = {
    //时间处理(未使用)
    date2name: function(dateStr) {
        var out = '';
        var now = new Date(),
            yesterday = new Date(),
            beforeYesterday = new Date(),
            tomorrow = new Date(),
            afterTomorrow = new Date();
        yesterday.setDate(now.getDate() - 1);
        yesterday.setHours('0','0','0','0');
        beforeYesterday.setDate(now.getDate() - 2);
        beforeYesterday.setHours('0','0','0','0');
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours('23','59','59','999');
        afterTomorrow.setDate(now.getDate() + 2);
        afterTomorrow.setHours('23','59','59','999');

        //https://blog.csdn.net/liangxw1/article/details/78810882
        //非标准时间
        //"/Date(1530519394224)/"             //Microsoft JSON date

        //标准时间
        //"2018-07-02T08:47:42.858Z"          //ISO标准时间 (这个时间是UTC时间! 直接初始化这个时间就能获取到本地时间! 或者把末尾的Z替换为时区偏移 也能初始化出对应时区的本地时间!)
        //"2018-07-02T16:17:22.999+08:00"     //精确到毫秒
        //"2018-07-02T16:17:22.999999+08:00"  //精确到微妙
        //"2018-07-02T16:17:22.999+0800"      //精确到毫秒
        //"2018-07-02T16:17:22.999999+0800"   //精确到微妙
    
        //自己格式化的非法时间
        //"2018-07-02T16:47:59.343"           //投递了该职位还投递了接口 (字符串中的T代表是UTC时间! 末尾不带Z! 则不偏移! 所以手动偏移!)

        //IE支持的时间格式真的有限的点
        //"2018-07-02 08:47:42"               //这居然是一个错误的时间格式  只能替换为"2018/07/02 08:47:42"

        var ds = /Date\((\d+)\)/.exec(dateStr);
        if (ds && ds[1]) {
            var dateObj = new Date(parseInt(ds[1]));
        } else if(/\dT\d/.test(dateStr)) {
            if (/Z$|\+\d{2}\:\d{2}$|\+\d{4}$|\+\d{2}$/.test(dateStr)) {
                var dateObj = new Date(dateStr);
            }else {
                var dateObj = new Date(dateStr+'+08:00');
            }
        } else {
            var dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) {
                var ds = /(\d{4})[^\d]+(\d{2})[^\d]+(\d{2})[^\d]+(\d{2})[^\d]+(\d{2})[^\d]+(\d{2})/.exec(dateStr);
                if (ds) {
                    var dateObj = new Date(ds[1]+'/'+ds[2]+'/'+ds[3]+' '+ds[4]+':'+ds[5]+':'+ds[6]);
                }
            }
        }

        var dataDiff = now.getTime() - dateObj.getTime();
        if (isNaN(dataDiff)) return;

        if (dataDiff > 0){
            var m = dataDiff/(1000*60);
            if (m < 1){
                out = '刚刚';
            }else if (m < 60){
                out = Math.round(m)+'分钟前';
            } else if (m < 60*24) {
                out = Math.round(m/60)+'小时前';
            } else if (m <= ((now - yesterday)/(1000*60))) {
                out = '昨天';
            } else if (m <= ((now - beforeYesterday)/(1000*60))) {
                out = '前天';
            } else {
                var year = dateObj.getFullYear();
                var month = dateObj.getMonth()+1;
                var day = dateObj.getDate();
                out = year+'-'+ (month<10?'0'+month:month) +'-'+ (day<10?'0'+day:day);
            }
        } else {
            var m = Math.abs(dataDiff/(1000*60));
            if (m < 60){
                out = Math.round(m)+'分钟后';
            } else if (m < 60*24) {
                out = Math.round(m/60)+'小时后';
            } else if (m <= ((tomorrow - now)/(1000*60))) {
                out = '明天';
            } else if (m <= ((afterTomorrow - now)/(1000*60))) {
                out = '后天';
            } else {
                var year = dateObj.getFullYear();
                var month = dateObj.getMonth()+1;
                var day = dateObj.getDate();
                out = year+'-'+ (month<10?'0'+month:month) +'-'+ (day<10?'0'+day:day);
            }
        }
        return out;
    },

    //时间处理2
    date2name2: function(dateStr) {
        var out = '';
        var now = new Date(),
            beforeNow = new Date(),
            afterNow = new Date(),
            yesterday = new Date(),
            beforeYesterday = new Date(),
            tomorrow = new Date(),
            afterTomorrow = new Date();
        beforeNow.setHours('0','0','0','0');
        afterNow.setHours('23','59','59','999');
        yesterday.setDate(now.getDate() - 1);
        yesterday.setHours('0','0','0','0');
        beforeYesterday.setDate(now.getDate() - 2);
        beforeYesterday.setHours('0','0','0','0');
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours('23','59','59','999');
        afterTomorrow.setDate(now.getDate() + 2);
        afterTomorrow.setHours('23','59','59','999');

        var ds = /Date\((\d+)\)/.exec(dateStr);
        if (ds && ds[1]) {
            var dateObj = new Date(parseInt(ds[1]));
        } else if(/\dT\d/.test(dateStr)) {
            if (/Z$|\+\d{2}\:\d{2}$|\+\d{4}$|\+\d{2}$/.test(dateStr)) {
                var dateObj = new Date(dateStr);
            }else {
                var dateObj = new Date(dateStr+'+08:00');
            }
        } else {
            var dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) {
                var ds = /(\d{4})[^\d]+(\d{2})[^\d]+(\d{2})[^\d]+(\d{2})[^\d]+(\d{2})[^\d]+(\d{2})/.exec(dateStr);
                if (ds) {
                    var dateObj = new Date(ds[1]+'/'+ds[2]+'/'+ds[3]+' '+ds[4]+':'+ds[5]+':'+ds[6]);
                }
            }
        }

        var dataDiff = now.getTime() - dateObj.getTime();
        if (isNaN(dataDiff)) return;

        if (dataDiff > 0){
            var m = dataDiff/(1000*60);
            if (m <= ((now - beforeNow)/(1000*60))){
                out = '今天';
            } else if (m <= ((now - yesterday)/(1000*60))) {
                out = '昨天';
            } else if (m <= ((now - beforeYesterday)/(1000*60))) {
                out = '前天';
            } else {
                var year = dateObj.getFullYear();
                var month = dateObj.getMonth()+1;
                var day = dateObj.getDate();
                out = year+'-'+ (month<10?'0'+month:month) +'-'+ (day<10?'0'+day:day);
            }
        } else {
            var m = Math.abs(dataDiff/(1000*60));
            if (m <= ((afterNow - now)/(1000*60))){
                out = '今天';
            } else if (m <= ((tomorrow - now)/(1000*60))) {
                out = '明天';
            } else if (m <= ((afterTomorrow - now)/(1000*60))) {
                out = '后天';
            } else {
                var year = dateObj.getFullYear();
                var month = dateObj.getMonth()+1;
                var day = dateObj.getDate();
                out = year+'-'+ (month<10?'0'+month:month) +'-'+ (day<10?'0'+day:day);
            }
        }
        return out;
    },

    //格式化时间
    date_format: function(dateStr, fmt) {
        var ds = /Date\((\d+)\)/.exec(dateStr);
        if (ds && ds[1]) {
            var dateObj = new Date(parseInt(ds[1]));
        } else if(/\dT\d/.test(dateStr)) {
            if (/Z$|\+\d{2}\:\d{2}$|\+\d{4}$|\+\d{2}$/.test(dateStr)) {
                var dateObj = new Date(dateStr);
            }else {
                var dateObj = new Date(dateStr+'+08:00');
            }
        } else {
            var dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) {
                var ds = /(\d{4})[^\d]+(\d{2})[^\d]+(\d{2})[^\d]+(\d{2})[^\d]+(\d{2})[^\d]+(\d{2})/.exec(dateStr);
                if (ds) {
                    var dateObj = new Date(ds[1]+'/'+ds[2]+'/'+ds[3]+' '+ds[4]+':'+ds[5]+':'+ds[6]);
                }
            }
        }

        //yyyy-MM-dd hh:mm:ss
        var o = {
            "M+" : dateObj.getMonth()+1,        //月份
            "d+" : dateObj.getDate(),           //日
            "h+" : dateObj.getHours(),          //小时
            "m+" : dateObj.getMinutes(),        //分
            "s+" : dateObj.getSeconds()         //秒
        };
        if (/(y+)/.test(fmt)) {
            fmt=fmt.replace(RegExp.$1, (dateObj.getFullYear()+"").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("("+ k +")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
            }
        }
        return fmt;
    },

    //高亮关键词
    highlight: function(htmlStr, word) {
        var isHtml = /\<.*?\>/g.test(htmlStr);
        var reg = new RegExp(word, 'gi');  //如: 工程师|火电
        if (isHtml) {
            var tmp = htmlStr.replace(/\<.*?\>/g, '');
            return htmlStr.replace(/>[^<]+</g, function($0){
                return $0.replace(reg, '<span class="highlight">$&</span>');
            }).replace(/^[^<]+</, function($0){
                return $0.replace(reg, '<span class="highlight">$&</span>');
            }).replace(/>[^<]+$/, function($0){
                return $0.replace(reg, '<span class="highlight">$&</span>');
            });
        } else {
            return htmlStr.replace(reg, '<span class="highlight">$&</span>');
        }
    },

    //字符串截取
    substr: function(str, start, length, postfix) {
        if (str && typeof str == 'string') {
            str = str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '').replace(/\s+/g, ' ');
            if (str.length < length) {
                return str;
            } else {
                if (postfix && typeof postfix == 'string') {
                    return str.substr(start, length)+postfix;
                } else {
                    return str.substr(start, length);
                }
            }
        } else {
            return '';
        }
    },

    //中文字符串截取
    cn_substr: function(str, start, length, postfix) {
        if (str && typeof str == 'string') {
            var str1 = str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '').replace(/\s+/g, ' ');
            var num1 = 0,
                num2 = 0,
                flag = true;
            for(i = 0; i < str1.length; i++) {
                if ((num1+0.5) >= start) {
                    break;
                }
                if (/[\u4e00-\u9fa5]/.test(str1.charAt(i))) {
                    num1 += 1;
                }else if (/[\uff00-\uffff]/.test(str1.charAt(i))) {
                    num1 += 1;
                } else if (/\s/.test(str1.charAt(i))) {
                    continue;
                } else {
                    num1 += 0.5;
                }
            }
            var str2 = str1.substr(i+1);
            for(j = 0; j < str2.length; j++) {
                if ((num2+0.5) >= length) {
                    flag = false;
                    break;
                }
                if (/[\u4e00-\u9fa5]/.test(str2.charAt(j))) {
                    num2 += 1;
                }else if (/[\uff00-\uffff]/.test(str2.charAt(j))) {
                    num2 += 1;
                } else if (/\s/.test(str2.charAt(j))) {
                    continue;
                } else {
                    num2 += 0.5;
                }
            }
            if (flag) {
                return str1;
            }
            if (postfix && typeof postfix == 'string') {
                return str1.substr(i, j)+postfix;
            } else {
                return str1.substr(i, j);
            }
        } else {
            return '';
        }
    },

    //字符串分割
    split: function(str, val) {
        if (str && typeof str == 'string') {
            val = val||'';
            return str.split(val);
        } else {
            return '';
        }
    },

    //数组截取
    arr_slice: function(arr, start, end) {
        if (arr && Object.prototype.toString.call(arr)== '[object Array]') {
            start = start||0
            if (end) {
                return arr.slice(start, end)
            } else  {
                return arr.slice(start)
            }
        } else {
            return [];
        }
    },

    //数组合并
    arr_join: function(arr, val) {
        if (arr && Object.prototype.toString.call(arr)== '[object Array]') {
            val = val||'';
            return arr.join(val)
        } else {
            return '';
        }
    },

    //导航激活
    activate: function(url, path) {
        url = url.replace('/2020', '');
        if (!url || !path) {
            return '';
        }
        if ((path === '/' && url === '/') || (path !=='/' && url.indexOf(path) === 0)) {
            return 'active';
        } else {
            return '';
        }
    },

    //去除HTML标签
    removeHTMLTag: function(str) {
        if (!str || typeof str !== 'string') return '';
        str = str.replace(/<\/?[^>]*>/g,''); //去除HTML标签
        str = str.replace(/&nbsp;/ig,'');    //去掉空格实体
        str = str.replace(/[\r\n|\n]/g,'');  //去除换行符
        return str;
    },

    //评论分数转样式
    num2class: function(numStr) {
        var num = parseFloat(numStr);
        var base = Math.floor(num);
        if (num > 5) {
            return 5;
        } else if (num >= 0 && num <= 5){
            if (num == base){
                return base;
            }else if (num <= (base+0.5)){
                return base+'5';
            } else if (num <= (base+0.9)) {
                return base+1;
            }
        } else {
            return 0;
        }
    },

    //tirm URL
    trimURL: function(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '').replace(/^http:\/\/|^https:\/\//, '').replace(/\/$/, '');
    },

    //fix URL
    fixURL: function(str) {
        if (!str || typeof str !== 'string') return '';
        return /^http/.test(str)?str:'http://'+str;
    },

    //TXT转为HTML(escape+nl2br+空格转实体)
    txt2html: function(str) {
        if (!str || typeof str !== 'string') return '';
        if (/<[\w\/ ]+>/.test(str)) {
            return str;
        } else {
            return str.replace(/\r\n|\n/g, '<br/>\n').replace(/ |\t|\v|\f/g, '&nbsp;');
        }
    },
}

const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(path.join(__dirname, '../views')),
    {
        noCache: !isProd    //是否缓存模板
    }
)

for (let n in filter) {
    env.addFilter(n, filter[n])
}


module.exports = env
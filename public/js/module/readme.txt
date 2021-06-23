该目录为js模块目录, 构建之后不会存在该目录结构!!




JS模块对使用

1. views目录下 模板文件中引入模块
    <script type="module" src="/js/xxx.esm.js"></script>    //注意属性中要包含 type="module" 文件名用.esm.js

2. public/js目录下 需要打捆的文件名必须为xxx.esm.js 并且只能在该目录下!
    public/js/module目录下存放入口文件的子模块 传统处理js对gulp任务不会对该目录有任何操作

3. 日常开发的话，请在chrome浏览器, 或者支持ES模块的浏览器下
    import { foo } from './my_module.esm.js';    //导入模块
    import './lodash.js';    //执行模块

4. 构建项目的生产文件时,会做如下操作
    1>. 处理public/js/xxx.esm.js文件们    打捆(esbuild) -> 替换某些文件内的特征 -> ES5转码(babel) -> 混淆压缩(uglify) -> 改名为xxx.js -> 输出到dist下的js目录
    2>. 处理views/xxx.htm文件们    把内容中的type="module"去掉 .esm.js替换为.js
    3>. 生产文件就是你想要的结果了

5. 然后就没有然后了, 可以参考一下vite的运行模式, 当然我这是小巫见大巫
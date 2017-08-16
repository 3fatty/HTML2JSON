# HTML2JSON
simple HTML2JSON &amp; JSON2HTML converter


##  HTML 和 JSON 的相互转换

### 主要优点:
1. 服务器端和客户端双端都可以运行
2. JSON 数据保留 DOM 元素所有结构
3. 2JSON 和 2HTML 可配置
4. 提供 DOM 同名解析函数, 如 getElementById

### 提供的接口主要分为两部分:
* #### 转换 ![image](https://github.com/3fatty/HTML2JSON/blob/master/imgs/convert.png)
* #### 解析 ![image](https://github.com/3fatty/HTML2JSON/blob/master/imgs/parse.png)

### 默认处理和还原的HTML数据如下 (可自定义) :
* ####  ![image](https://github.com/3fatty/HTML2JSON/blob/master/imgs/defaultprops.png)


### 用法:
```
var converter = new Converter(optsObj);       // 如果不传 opts, 将使用 Converter.defaultProps
// 转换
var jsonObj  = converter.HTML2JSON(DOMElem)  // 获取 dom 节点对应的 json 数据
var htmlStr  = converter.JSON2HTML(jsonObj)   // 获取 json 数据对应的 html 字符串

// 解析
var elems    = converter.getElementsByClassName(jsonObj, 'value');
var text     = converter.getElementsByClassName(jsonObj);
...
// 解析方法的核心是 getElementsByAttrs 和 getElementsByProps, 两个方法用法一致
// byClassName/byTagName 等都是基于这两个方法的封装.
var elems    =  converter.getElementsByAttrs(jsonObj, 'name', 'value',  {
  isValueMult   : false, // 是否有多个值,    getElementsByClassName 默认为true
  isCaseIgnored : false, // 是否忽略大小写,  getElementsByTagName 默认为true
  isResultSole  : false, // 是否只取一个结果, getElementById 默认为true
});

...

```

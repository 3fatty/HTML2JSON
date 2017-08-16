/*
 * HTMLConvertor 转换器
 */
var VERSION = '0.4';

// 构造函数
function Convertor( opts ) {
  opts       = opts || {};
  this.props = Array.isArray(opts.props)? this.defaultProps.concat(opts.props):  this.defaultProps;
};
// 默认转换的属性, new 的时候传进来的opts 可自定义
Convertor.prototype.defaultProps = [
  {'name':'nodeName'},
  {'name':'nodeType'},
  {'name':'textContent', toJSON:function(domElem, p) {
    // return domElem.nodeType === 3 ? new Convertor().escapeHTMLCharacters(domElem.textContent): '';
    return domElem.nodeType === 3 ? domElem.textContent.replace(/\>/g, '&gt;').replace(/\</g, '&lt;').replace(/\"/g, '&quot;'): '';
  }},
  {'name':'attributes', toJSON:function(domElem, p) {
    return [].map.call( domElem[p]||[], function(attr) {
      return {
        name : attr.name,
        value: attr.value
                // .replace(/\&/g, '&amp;')
                // .replace(/\</g, '&lt;')
                // .replace(/\>/g, '&gt;')
                // .replace(/\"/g, '&quot;')
      };
    });
    }, toHTML(obj, type) {
      return obj.attributes.map(function(attr){
        return `${attr.name}${attr.value?`="${attr.value}"`:''}`;
      }).join(' ');
    }
  },
  {'name':'childNodes', toJSON:function(domElem, p) {
    return [];
  }}
];
// 是否 DOM 元素
  // Convertor.prototype.isHTMLElement = function(domElem) {
  //   return typeof HTMLElement === 'object'?
  //           !!domElem && domElem instanceof HTMLElement:
  //           !!domElem && !!domElem.nodeName && !!domElem.nodeType;
  // },
  // 是否集合
  // Convertor.prototype.isHTMLCollection  = function(arrayLike) {
  //   return arrayLike && arrayLike.constructor === HTMLCollection;
  // };

// 检测 DOM 节点是否表现为自闭合标签
Convertor.prototype.isSelfClosingElement = (function() {
  var tags = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  return function(obj) {
    return tags.some(function(tag) {
      // console.log(tag, obj.nodeName.toLowerCase === tag);
      return obj.nodeName.toLowerCase() === tag;
    });
  }
}()),



/*********** 转换 ***********/
// 给 HTML 字符转义 ( < > & " )
Convertor.prototype.escapeHTMLCharacters = (function(htmlStr) {
  return htmlStr
          .replace(/\&/g, '&amp;')
          .replace(/\</g, '&lt;')
          .replace(/\>/g, '&gt;')
          .replace(/\"/g, '&quot;')
});
// 将 DOM 节点转成 JSON 对象
Convertor.prototype.HTML2JSON = function(domElem, sup) {
  var that        = this;
  var obj         = {};
  var p, v, props = this.props;

  props.forEach(function(p){
    !!(v = p.toJSON? p.toJSON(domElem, p.name): domElem[p.name]) &&
      (obj[p.name] = v);
  })
  if ( !!sup ) {
    sup.childNodes.push(obj);
  } else {
    obj.isRoot  = true;
    obj.version = VERSION;
  }
  [].forEach.call( domElem.childNodes, function(c) {
    that.HTML2JSON(c, obj);
  });

  return obj;
}
// 将 DOM 节点转成 JSON 字符串
Convertor.prototype.HTML2JSONString = function(domElem) {
  return JSON.stringify( this.HTML2JSON(domElem) );
}
// 将 JSON 转成 HTML 字符串 (默认innerHTML)
Convertor.prototype._JSON2HTML = function(jsonObj, getOuterHTML) {
  var html    = '';
  var that    = this;

  if ( jsonObj.isRoot && !getOuterHTML ) {
    jsonObj.childNodes.forEach(function(c,i) {
      html += that._JSON2HTML(c);
    });
  } else {
    var tagName = jsonObj.nodeName.toLowerCase();
    var isSelfClosingElement = that.isSelfClosingElement(jsonObj)&&jsonObj.childNodes.length===0;

    // 属性, 写在标签上
    var attrs = this.props.filter(function(p){
      return !!p.toHTML;
    }).map(function(p) {
      return p.toHTML(jsonObj);
    }).join(' ');

    if ( jsonObj.nodeType === 1 ) {
      html += `<${tagName}${attrs?' '+attrs:''}>`;
      jsonObj.childNodes.forEach(function(c,i) {
        html += that._JSON2HTML(c);
      });
      if ( !isSelfClosingElement )
        html += `</${tagName}>`;
    } else if ( jsonObj.nodeType === 3 ) {
      html += jsonObj.textContent||'';
    };
  }
  return html;
}
// 将 JSON 转成 HTML 字符串 (默认innerHTML)
Convertor.prototype.JSON2HTML = function(jsonObj, getOuterHTML) {
  if ( !jsonObj ) return '';
  // let a = '';
    // console.log( typeof jsonObj );
  try {
    if ( typeof jsonObj === 'string' ) jsonObj = JSON.parse(jsonObj);
  } catch(e) {
    return '<p>'+jsonObj+'</p>';
  }

  // var obj = null;
  // try {
    // obj =
  // } catch(e) {
  // }

  // if ( typeof jsonObj === 'object' ) {
  //   console.log( jsonObj );
  // }

  return this._JSON2HTML(jsonObj, getOuterHTML)
},
// 将 JSON 对象转成 outerHTML 字符串
Convertor.prototype.JSON2OuterHTML = function(jsonObj) {
  return this.JSON2HTML(jsonObj, true);
}
// 将 JSON 对象转成 innerHTML 字符串, 和 JSON2HTML 方法完全一致
Convertor.prototype.JSON2InnerHTML = function(jsonObj) {
  return this.JSON2HTML(jsonObj, false);
}



/*********** 解析 ***********/
// 是否配套的JSON对象
Convertor.prototype.isJSONObject       = function(jsonObj) {
  return typeof jsonObj.attributes==='object'
        && typeof jsonObj.attributes==='object'
        && typeof jsonObj.nodeName==='string'
        && typeof jsonObj.nodeType==='number';
};
// 获取特性匹配的(所有)子类, 比如 id, class, style, data-xxx等
Convertor.prototype._getElementsByAttr = function(jsonObj, name, value, opt) {
  if ( !this.isJSONObject(jsonObj) ) return {err:'类型错误'};
  var children = this.getAllChildren(jsonObj);
  var i=0, len=children.length, c=null, r=[];
  for ( ; i<len; i++ ) {
    c = children[i];
    if ( c.attributes.some(function(a) {
        return a.name===name && (opt.isValueMult? a.value.split(/\s+/).some(function(v) {
          return opt.isCaseIgnored? v.toLowerCase()===value.toLowerCase(): v===value;
        }): opt.isCaseIgnored? a.value.toLowerCase()===value.toLowerCase(): a.value===value);
    }) ) {
      if ( opt.isResultSole ) return c;
      else r.push(c);
    }
  }
  return !!r.length? r : (opt.isResultSole? null: r);
}
// 获取属性匹配的(所有)子类, 由 props 设置所决定, 默认的由 nodeName, nodeType
Convertor.prototype._getElementsByProp = function(jsonObj, name, value, opt) {
  if ( !this.isJSONObject(jsonObj) ) return {err:'类型错误'};
  var children = this.getAllChildren(jsonObj);
  var i=0, len=children.length, c=null, r=[], p='';
  for ( ; i<len; i++ ) {
    c = children[i];
    if ( Object.keys(c).some(function(p) {
        return p===name && (opt.isValueMult? c[p].split(/\s+/).some(function(v) {
          return opt.isCaseIgnored? v.toLowerCase()===value.toLowerCase(): v===value;
        }): opt.isCaseIgnored? c[p].toLowerCase()===value.toLowerCase(): c[p]===value );
    }) ) {
      if ( opt.isResultSole ) return c;
      else r.push(c);
    }
  }
  return !!r.length? r : (opt.isResultSole? null: r);
}
// 获取所有元素子类( nodeType === 1 )
Convertor.prototype.getAllChildren     = function(jsonObj) {
  var allChildNodes = this.getAllChildNode(jsonObj);
  return allChildNodes.filter(function(c) {
    return c.nodeType === 1;
  })
};
// 获取所有子类(目前只有 元素&文本 两种类型)
Convertor.prototype.getAllChildNode    = function(jsonObj, sup) {
  sup = sup || [];
  var convertor     = this;
  jsonObj.childNodes.forEach(function(c) {
    sup.push( c );
    convertor.getAllChildNode( c, sup );
  });
  return sup;
};
// 获取id匹配的元素 ( 默认返回一个, 可在传入的opt上做更改 )
Convertor.prototype.getElementById     = function(jsonObj, value, opt) {
  return this._getElementsByAttr(jsonObj, 'id', value, opt||{isResultSole:true});
};
// 获取类名匹配的元素 ( 默认返回全部, 可在传入的opt上做更改 )
Convertor.prototype.getElementsByClassName = function(jsonObj, value, opt) {
  return this._getElementsByAttr(jsonObj, 'class', value, opt||{isValueMult:true});
}
// 获取标签名匹配的元素 ( 默认返回全部, 可在传入的opt上做更改 )
Convertor.prototype.getElementsByNodeName  =
Convertor.prototype.getElementsByTagName   = function(jsonObj, value, opt) {
  return this._getElementsByProp(jsonObj, 'nodeName', value, opt||{isCaseIgnored:true});
}
// 获取元素的文本内容
Convertor.prototype.getElementTextContent = function(jsonObj) {
  var that = this;
  var text = '';
  if ( jsonObj.nodeType === 3 ) {
    text = jsonObj.textContent;
  } else {
    jsonObj.childNodes.forEach(function(c) {
      text += that.getElementTextContent(c);
    });
  }
  return text;
};
// 用Map的形式获取 标签-文本 (key-value) 的内容, 但标签具有唯一性, 所以相同标签的内容会进行合并
Convertor.prototype.getMapOfTextContentByTags = function(jsonObj) {
  if ( !this.isJSONObject(jsonObj) ) return {err:'类型错误'};
  var that = this;
  var obj  = {};
  var key  = '';
  jsonObj.childNodes.forEach(function(c, i) {
    key = c.nodeName.toLowerCase();
    // obj[ key ] = ( obj[ key ]||'' ) + c.textContent;
    obj[ key ] = ( obj[ key ]||'' ) + that.getElementTextContent(c);
  });

  return obj;
}


export default Convertor;

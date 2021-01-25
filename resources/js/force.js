var links;
var linkForce; 
var svg; 
var simulation; 
var svg_nodes; 
var svg_texts; 
var svg_links; 
var marker; 

function generateNewNodes(d) {
    window.location.assign("force.html" + "?q=" + d.title + "&changeAncestor=false");
    //d3.select("svg").remove();
    //drawPicture(nodes2);
};

// 由节点的pageid构成指向节点wiki的url
function openNodeInWiki(d) {
    window.open("https://en.wikipedia.org/?curid=" + d.pageid);    
}

// 在探测到tick事件时, 进行更新的handler.
function ticked() {
    svg_links
        .attr('d', drawLink)
        .attr('marker-end', 'url(#resolved)'); // 指定路径和箭头

    svg_nodes
        .attr('cx', function(d) {
            return d.x;
        })
        .attr('cy', function(d) {
            return d.y;
        });

        svg_texts
        .attr('x', function(d) {
            return d.x;
        })
        .attr('y', function(d) {
            return d.y;
        });
};

function drawPicture (nodes) {

    // 从原始数据构建点
    nodes = constructNodes(nodes);

    // 创建节点颜色
    const color = d3 
        .scaleLinear()
        .domain([0, nodes.length])
        .range(['red', 'blue']);

    // 构建图的边
    links = constructLinks(nodes);

    
    // 设定弹力值
    linkForce = specifyLinkForce(links);

    // 绘制画布
    svg = constructSvg();

    // 动态计算点的位置
    simulation = calcLayoutForNodes(nodes, linkForce) 

    // 开始绘图
    svg_nodes = drawNodes(svg, nodes, radius, color, dragstarted, dragged, dragended); 

    // 显示文字
    svg_texts = writeTitleForNodes(svg, nodes, radius, fontSize);

    // 监听tick, 进行更新
    /*
    function ticked() {
        svg_nodes 
            .attr('cx', function(d) {
                return d.x;
            })
            .attr('cy', function(d) {
                return d.y;
            })
    }
    */

    // 开始绘制边
    svg_links = createSvgLinks(svg, links)

        
    // draw arrow
    marker = createArrow(svg);

    // 当发生tick时, 进行更新
    registerTickedListenerForAllNodes(simulation, nodes, ticked);

    // 双击事件: 以新节点为中心更新图
    svg_nodes.on("dblclick", generateNewNodes);
    // ctrl + 单击事件: 在另一个窗口打开wiki
    svg_nodes.on("click", function (d) {
        // console.log(d);
        if (d3.event.ctrlKey){
            openNodeInWiki(d);
        }
    })

    // 增加一个按钮star, 表示找到了想要的节点, 并和ancestor之间建立关系.
    d3
    .select('svg')
    .append('rect')
    .attr("x", 5)
    .attr("y", 5)
    .attr("width", 40)
    .attr("height", 40)
    .attr("fill", "steelblue")
    .attr("transform", "translate(" + 50 + "," + 50 + ")")
    // data driven data driven, 这里的d绑定的是形状的数据! 如果图形没有数据, d就是undefined, 而不是形状本身!
    // console.log用来调试真好用, 在浏览器的开发者模式中能看到输出.
    .on("click", function () {
        let self = d3.select(this);
        // 在当前情况下, 因为rect只有一个, 所以和下述表达等价.
        // 寻找并验证等价关系是了解原理的很好的方式.
        // let singlerec= d3.select('rect');
        // console.log(self);
        // console.log(singlerec);
        self.attr("fill", "red");
        //onsole.log('ancestor=', ancestor.pageid);
        //console.log(JSON.stringify(nodes[0]));
        // cookie相关的设定必须要在服务器模式下才能生效, 只是打开html是没有用的.
        appendCookie(
            JSON.stringify(ancestor.pageid), 
            JSON.stringify({pageid: nodes[0].pageid, title: nodes[0].title}));
        //console.log(document.cookie);
        // console.log(getCookie(JSON.stringify(ancestor.pageid)));
    });

    // 增加一个按钮, 清除和本节点相关的所有special节点的记录.
    d3
    .select('svg')
    .append('rect')
    .attr("x", 5)
    .attr("y", 5)
    .attr("width", 40)
    .attr("height", 40)
    .attr("fill", "dark")
    .attr("transform", "translate(" + 50 + "," + 100 + ")")
    .on("click", function () {
        let self = d3.select(this);
        self.attr("fill", "white");
        deleteCookie(JSON.stringify(nodes[0].pageid));

        /*
        x = document.cookie;
        var keys = x.match(/[^ =;]+(?=\=)/g);
        if (keys) {
            for (var i = keys.length;i--;){
                deleteCookie(keys[i]);
            }
        }
        console.log('after black cookie:', document.cookie);
        */
    })
}

drawPicture(nodes);


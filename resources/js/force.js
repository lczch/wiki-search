var links;
var linkForce; 
var svg; 
var simulation; 
var svg_nodes; 
var svg_texts; 
var svg_links; 
var marker; 

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

function generateNewNodes(d) {
    window.location.assign("force.html" + "?q=" + d.title);
    //d3.select("svg").remove();
    //drawPicture(nodes2);
};

function drawPicture (nodes) {

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

    // 双击事件
    svg_nodes.on("dblclick", generateNewNodes);
}

drawPicture(nodes);


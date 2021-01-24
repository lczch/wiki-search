
const svgWidth = 1200;
const svgHeight = 800;
const fontSize = 12;
const radius = 20;

var ancestor = null; 
// type is in ['core', 'child', 'parent', 'special'], special是通过cookie记录下来的曾经搜索成功的匹配
/*
const nodes = [
    {title: 'Dwarf Fortress', type: 'core'}, 
    {title: 'Rimworld', type: 'child'},
    {title: 'FortressCraft', type: 'child'}, 
    {title: 'Tarn Adoms', type: 'child'},
    {title: 'Rougualike', type: 'child'}, 
    {title: 'Dwarf(folkler)', type: 'child'},
];

const nodes2 = [
    {title: 'Dwarf Fortress', type: 'parent'}, 
    {title: 'Rimworld', type: 'child'},
    {title: 'FortressCraft', type: 'core'}, 
    {title: 'Tarn Adoms', type: 'child'},
    {title: 'Rougualike', type: 'child'}, 
    {title: 'Dwarf(folkler)', type: 'child'},
];
*/

// 将nodes的原始数据加工
function constructNodes(nodes){
    var i;
    for (i = 0; i < nodes.length; i++){
        if (i === 0) {
            nodes[i].type = 'core'
        }
        else {
            nodes[i].type = 'child'
        }
    }
    return nodes;
}

// construct links
function constructLinks(nodes){
    var coreNode = -1; 
    for (var i = 0; i < nodes.length; i++){
        if (nodes[i].type === 'core') {
            coreNode = i;
            break
        }
    }
    var links = [];
    var t = 0;
    for (var i = 0; i < nodes.length; i++){
        if (coreNode != i) {
            var link = new Object();
            if (nodes[i].type === 'child') {
                link.source = coreNode; 
                link.target = i;
                link.type = 'normal'
            } 
            else if (nodes[i].type === 'parent') {
                link.source = i;
                link.target = coreNode;
                link.type = 'normal'
            }
            else if (nodes[i].type === 'special') {
                link.source = coreNode; 
                link.target = i; 
                link.type = 'special'
            }
            links[t] = link;
            t++    
        }
    }
    return links;
}

// example for links. type is ini ['normal', 'special']. special要用其他颜色标记出来, 表示曾经成功配对的记忆. 
/*
const links = [
    { source:0, target: 1, type: 'normal'},
    { source:0, target: 2, type: 'normal'},
    { source:0, target: 3, type: 'normal'},
    { source:0, target: 4, type: 'normal'},
    { source:0, target: 5, type: 'normal'},
];
*/

// 绘制幕布
function constructSvg(){
    return d3
    .select("body")
    .append("svg")
    .attr('class', 'relationship-chart')
    .attr('height', svgHeight)
    .attr('width', svgWidth);
};

// 设定弹力
function specifyLinkForce(links){
    return d3 
    .forceLink(links) 
    .id(node => node.index) 
    .strength(link => 2)
    .distance(200);
}

// 动态计算每个节点的位置
function calcLayoutForNodes(nodes, linkForce){
    return d3
    .forceSimulation(nodes)
    .force('yt', d3.forceY().strength(() => 0.025))
    .force('yb', d3.forceY(svgHeight).strength(() => 0.025))
    .force('link', linkForce)
    .force('charge', d3.forceManyBody().strength(-400))
    .force('collision', d3.forceCollide().radius(d => radius))
    .force('center', d3.forceCenter(svgWidth/2, svgHeight/2)); 
};

// 创建节点颜色
const color = d3 
    .scaleLinear()
    .domain([0, 10])
    .range(['red', 'blue']);


// 定义拖拽函数
function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart(); 
    d.fx = d.x; 
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// 定义画图函数
function drawNodes (svg, nodes, radius, color, dragstarted, dragged, dragended){
    return svg 
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('cx', function(d) { return d.x })
    .attr('cy', function(d) { return d.y })
    .attr('r', radius)
    .attr('fill', function(d, i){ return color(i)})
    .attr('fill-opacity', 0.6)
    /*
    .on('mouseover', function(d) {
        d3.select(this).classed('node-hover', true);
        tooltip
            .html(d.title)
            .style('left', d3.event.pageX + 20 + 'px')
            .style('top', d3.event.pageY + 'px')
            .style('opacity', 1.0)
    })
    .on('mousemove', function(d){
        d3.select(this).classed('node-hover', true);
        tooltip
            .style('left', d3.event.pageX + 20 + 'px')
            .style('top', d3.event.pageY + 'px')
    })
    .on('mouseout', function(d){
        d3.select(this).classed('node-hover', false);
        tooltip.style('opacity', 0.0)
    })
    */   
    .call(
        d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged) 
        .on('end', dragended)
    );
};

// 添加描述节点的文字
function writeTitleForNodes(svg, nodes, radius, fontSize){
    return svg
    .selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    .style('fill', 'black')
    .attr('font-size', fontSize)
    .attr('text-anchor', 'middle') // 文字相对于坐标居中
    .attr('dominant-baseline', 'middle') // 文字相对于坐标居中
    .attr('dy', radius + fontSize)
    .text(function(d) {
      return d.title;
    });
};

// 监听tick event, 在每次发生tick时, 更新每个node的坐标.
// 如果不更新, 由simulation计算的x和y就传递不到cx和cy里.
// 但还是很奇怪, 就算赋值了, simulation什么时候重新绘图的呢? 难道是自动监听了每个node的坐标变化?

function registerTickedListenerForAllNodes (simulation, nodes, listener) {
    simulation
        .nodes(nodes)
        .on('tick', listener);
} 


// 开始绘制边
function createSvgLinks(svg, links){
    return svg
    .selectAll('.mypath')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'mypath')
    .attr('stroke-width', 1)
    .attr('stroke', '#ddd')
    .call(
      d3
        .zoom() //创建缩放行为
        .scaleExtent([-5, 2]), //设置缩放范围
    );
};

// 绘制箭头
function createArrow(svg){
    return svg 
    .append('marker') // 后面会使用id进行相应的挂载
    .attr('id', 'resolved')
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('viewBox', '0 -5 10 10') //坐标系的区域
    .attr('refX', 0) //箭头坐标
    .attr('refY', 0)
    .attr('markerWidth', 12) //标识的大小
    .attr('markerHeight', 12)
    .attr('orient', 'auto') //绘制方向，可设定为：auto（自动确认方向）和 角度值
    .attr('stroke-width', 2) //箭头宽度
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5') //箭头的路径，可自定义修改样式
    .attr('fill', '#ddd'); //箭头颜色
};

// 计算实际连线时的坐标
function drawLink(d) {
    const { source, target } = d;
    const x1 = source.x;
    const y1 = source.y;
    const x2 = target.x;
    const y2 = target.y;
    const length = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2)); // 两点间距离
    const startDistance = radius + 15; // 设置线段起点与节点的间距
    const endDistance = radius + 15; // 设置线段终点与节点的间距

// 利用相似三角形求出距离（x1，y1）、（x2, y2）一定距离的 （x3, y3）、（x4, y4）
    const X3 = (x2 - x1) * (startDistance / length) + x1;
    const y3 = (y2 - y1) * (startDistance / length) + y1;
    const X4 = (x2 - x1) * ((length - endDistance) / length) + x1;
    const y4 = (y2 - y1) * ((length - endDistance) / length) + y1;
    return 'M ' + X3 + ' ' + y3 + ' L ' + X4 + ' ' + y4;
}
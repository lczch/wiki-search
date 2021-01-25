const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs');
// const sw = require('./searchWiki');
var nunjucks = require('nunjucks');
const { rawListeners } = require('process');
const Readable  = require('stream').Readable;

var ancestor = null;
var sancestor; 

var workDir = path.resolve('.');

const wikiUrl = 'https://en.wikipedia.org/w/api.php';
/*
searchKeywords('Dwarf Fortress')
    .then((nodes) => {
        console.log(nodes);
    });
*/

nunjucks.configure(
    path.resolve(__dirname, 'resources'),
    {autoescape: false}); 

// 创建服务器:
var server = http.createServer(function (request, response) {
    var pathname = url.parse(request.url).pathname; 
    var filepath = path.join(workDir, 'resources', pathname);

    // console.log(pathname);
    fs.stat(filepath, function (err, stats) {
        if (!err && stats.isFile()) {
            // 没有出错并且文件存在:
            console.log('200 ' + request.url);
            // 发送200响应:
            response.writeHead(200);
            // 将文件流导向response:
            if (pathname.match(/force.html$/)) {
                let params = new URLSearchParams (url.parse(request.url).search);
           
                
                var urlparams = {
                    action: 'query', 
                    list: 'search', 
                    srsearch: params.get("q"), 
                    format: 'json'
                }; 
   
                 // construct url to search in wiki
                var myurl = wikiUrl + '?';
                Object.keys(urlparams).forEach( 
                    function(key){
                    myurl = myurl + key + '=' + urlparams[key] + '&';
                });
                myurl = myurl.replace(/&$/, '');
                console.log(myurl);
    
                https.get(myurl, res => {
                    res.setEncoding('utf8');
                    let body = "";
                    res.on('data', data => {
                       body += data;
                    });
                    res.on('end', () => {
                        body = JSON.parse(body);
                        let data = body.query.search;
                
                        console.log("data=", data);
                        if (params.get('changeAncestor') != 'false') {
                            // 如果ancestor为null, 说明这是逻辑上的第一次搜索
                            ancestor = data[0];
                            sancestor = JSON.stringify(ancestor);
                        }
                        let sdata = JSON.stringify(data);
                        const newForce = nunjucks.render('force.html', {nodesDef: sdata, ancestorDef: sancestor});
                        // 把填充后的模板转化成字符流, 以便塞给response
                        const s = new Readable();
                        s._read = () => {};
                        s.push(newForce);
                        s.push(null);
                        s.pipe(response);
                    })})
                



                

                /*
                sw.searchKeywords(params.get('q'))
                .then((data) => {
                    if (params.get('changeAncestor') != 'false') {
                        // 如果ancestor为null, 说明这是逻辑上的第一次搜索
                        ancestor = data[0];
                        sancestor = JSON.stringify(ancestor);
                    }
                    let sdata = JSON.stringify(data);
                    const newForce = nunjucks.render('force.html', {nodesDef: sdata, ancestorDef: sancestor});
                    // 把填充后的模板转化成字符流, 以便塞给response
                    const s = new Readable();
                    s._read = () => {};
                    s.push(newForce);
                    s.push(null);
                    s.pipe(response);
                })
                */
            }
            else {
                if (pathname.match(/index.html$/)) {
                    //这时候开始重新搜索了, ancestor清空
                    ancestor = null;
                }
                fs.createReadStream(filepath).pipe(response);
            }
            
        } else {
            // 出错了或者文件不存在:
            console.log('404 ' + request.url);
            // 发送404响应:
            response.writeHead(404);
            response.end('404 Not Found');
        }
    });
});


server.listen(80);

// console.log('Server is running at http://127.0.0.1:8080/');
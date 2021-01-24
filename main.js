var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var sw = require('./searchWiki');
var nunjucks = require('nunjucks');
const { rawListeners } = require('process');
const Readable  = require('stream').Readable;

var workDir = path.resolve('.');

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

    console.log(pathname);
    fs.stat(filepath, function (err, stats) {
        if (!err && stats.isFile()) {
            // 没有出错并且文件存在:
            console.log('200 ' + request.url);
            // 发送200响应:
            response.writeHead(200);
            // 将文件流导向response:
            if (pathname.match(/force.html$/)) {
                let params = new URLSearchParams (url.parse(request.url).search);

                sw.searchKeywords(params.get('q'))
                .then((data) => {
                    let sdata = JSON.stringify(data);
                    const newForce = nunjucks.render('force.html', {nodesDef: sdata});
                    // 把填充后的模板转化成字符流, 以便塞给response
                    const s = new Readable();
                    s._read = () => {};
                    s.push(newForce);
                    s.push(null);
                    //console.log(newForce);
                    console.log(data);
                    s.pipe(fs.createWriteStream('temp'));
                    s.pipe(response);
                })
                //console.log(nunjucks.render('force.html', {nodesDef: data}))
            }
            else {
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

server.listen(8080);

console.log('Server is running at http://127.0.0.1:8080/');
const puppeteer = require('puppeteer');
const wikiUrl = 'https://en.wikipedia.org/w/api.php';

// https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=abc&format=json
 
// 如果出现异步函数, 那么所有的"顺序"执行部分, 必须被包装在异步函数之中, 否则无法保证代价间执行的顺序.
// 也就是说, 一旦出现了async, 你原来拥有的sequential的程序, 必须要建立一个新的async函数, 把async函数和顺序的程序包裹起来. 
exports.searchKeywords = 
async function searchKeywords (keywords) {
    var params = {
        action: 'query', 
        list: 'search', 
        srsearch: keywords, 
        format: 'json'
    }; 
   
    // construct url to search in wiki
    var url = wikiUrl + '?';
    Object.keys(params).forEach( 
        function(key){
            url = url + key + '=' + params[key] + '&';
        });
    url = url.replace(/&$/, '');
    console.log(url);
    
    let browser = await puppeteer.launch();
    let page = await browser.newPage();

    let response = await page.goto(url); 
    let jsonData = await response.json();

    let searchData = jsonData.query.search;
//    console.log(searchData);

    await browser.close();

    return searchData;
}


import Koa from 'koa';
import util from 'util';
import koaStatic from 'koa-static';
import fs from "fs"
import koaRouter from 'koa-router'
import request from 'co-request';
import cheerio from 'cheerio';
import _ from 'lodash';
import mongoose from 'mongoose';
var parse = require('co-body');

const router = koaRouter();
const app = new Koa();


router
  .get('/post', gerArticleList)
  .get('/post/:index', getArticleCon)
  .get('/lagou', getLaGouList)
  .get('/save', saveCat)
  .get('/list', listCat)
  .post('/add', addCat)
  .get('/get6', get6);

app
  .use(router.routes())
  .use(router.allowedMethods());

async function get6(ctx) {
    const cet4 = [];
    const res = await request('https://www.shanbay.com/wordbook/2');
    const body = res.body;
    let $ = cheerio.load(body);
    const menuList = $(".wordbook-create-candidate-wordlist");
    console.log('menu', menuList.length);

    for (let i = 0; i < menuList.length; i++) {
        const wordListUrl = $('.wordbook-wordlist-name a', $(menuList[i])).attr('href');
        for(let j = 1; j<=10; j++){
            const wordRes = await request('https://www.shanbay.com'+wordListUrl+'?page='+j);
            const WordListbody = wordRes.body;
            $ = cheerio.load(WordListbody);

            const pageWordList = $('.table tbody .row');
            console.log('pageWordList', pageWordList.length);
            for (let k = 0; k < pageWordList.length; k++) {
                let item = {};
                const word = $('.span2 strong', $(pageWordList[k])).text().trim();
                const explain = $('.span10', $(pageWordList[k])).text().trim();
                item.word = word;
                item.explain = explain;
                cet4.push(item);
            }
        }

    }
    ctx.body = cet4;
}


mongoose.connect("mongodb://localhost/test");

const Cat = mongoose.model("Cat", {
    name: String,
    friends: [String],
    age: Number
});

async function saveCat(ctx) {
    var kitty = new Cat({name: '发打发士大夫', friend: ['tom', 'jerry']});
    kitty.age = 3;
    console.log('save', await kitty.save());
    ctx.body = {};
}

async function listCat(ctx) {
    ctx.body = await Cat.find({});
}

async function addCat(ctx) {
    var body = await parse(ctx);
    var ki = new Cat(body);
    await ki.save();
    ctx.body = {};
}

const readdirSy = (path) => new Promise((resolve, reject)=> {
    fs.readdir(path, (err, data)=> {
        if (err) {
            return reject(err);
        }
        return resolve(data);
    });
});

const readFileSy = (file)=>new Promise((resolve, reject)=> {
    fs.readFile(file, 'utf8', (err, data)=> {
        if (err) {
            return reject(err);
        }
        return resolve(data);
    });
});

async function gerArticleList(ctx) {
    //遍历文件夹下的文件
    const articleList = await readdirSy("./article");
    //读取文件的内容
    const articleConList = articleList.map(async (article)=> {
        const articleObj = {};
        articleObj.id = article[7];

        const con = await readFileSy("./article/" + article);
        const con_line = con.split('\n');
        let flag = false;

        for (let i = 0; i < con_line.length; i++) {
            if (flag === false) {
                if (con_line[i][0] === '#') {
                    articleObj.title = con_line[i].substring(2, con_line[i].length - 1);
                }
                if (con_line[i][0] === 't') {
                    articleObj.tag = con_line[i].substring(4, con_line[i].length - 1);
                }
                if (con_line[i][0] === 'd' && con_line[i][1] === 'a') {
                    articleObj.date = con_line[i].substring(5, con_line[i].length - 1);
                }
                if (con_line[i][0] === 'd' && con_line[i][1] === 'e') {
                    articleObj.description = con_line[i].substring(12, con_line[i].length - 1);
                }
                if (con_line[i][0] === '-' && con_line[i][1] === '-') {
                    flag = true;
                    //articleObj.content =con_line.slice(i+1).join();
                    break;
                }
            }
        }
        return articleObj;
    });
    ctx.body = await Promise.all(articleConList);
}


async function getArticleCon(ctx) {
    const articleObj = {};
    const index = ctx.params.index;
    articleObj.id = index[7];
    const con = await readFileSy("./article/" + index);
    const con_line = con.split('\n');
    let flag = false;

    for (let i = 0; i < con_line.length; i++) {
        if (flag === false) {
            if (con_line[i][0] === '#') {
                articleObj.title = con_line[i].substring(2, con_line[i].length - 1);
            }
            if (con_line[i][0] === 't') {
                articleObj.tag = con_line[i].substring(4, con_line[i].length - 1);
            }
            if (con_line[i][0] === 'd' && con_line[i][1] === 'a') {
                articleObj.date = con_line[i].substring(5, con_line[i].length - 1);
            }
            if (con_line[i][0] === 'd' && con_line[i][1] === 'e') {
                articleObj.description = con_line[i].substring(12, con_line[i].length - 1);
            }
            if (con_line[i][0] === '-' && con_line[i][1] === '-') {
                flag = true;
                articleObj.content = con_line.slice(i + 1).join();
                break;
            }
        }
    }

    ctx.body = articleObj;
}

async function getLaGouList(ctx) {
    const res = await request('http://cnodejs.org/');

    //console.log(1);
    //await sleep();
    //console.log(2);
    const body = res.body;
    const $ = cheerio.load(body);
    const list = $('#topic_list .cell');
    //console.log(list.length);
    const cnOb = _.map(list, li=> {
        const item = {};
        const title = $('.topic_title', $(li)).text().trim();
        const time = $('.last_time span', $(li)).text().trim();
        const reply_count = $('.reply_count .count_of_replies', $(li)).text().trim();
        const click_count = $('.reply_count .count_of_visits', $(li)).text().trim();
        item.title = title;
        item.time = time;
        item.reply_count = reply_count;
        item.click_count = click_count;
        return item;
    });
    //ctx.body = cnOb;
}

//// response
//app.use(async (ctx) => {
//  const path = ctx.path;
//  if(path === '/post'){
//    gerArticleList(ctx);
//  }else{
//    var pathQL = path.split('/');
//    getArticleCon(ctx,pathQL[2][7]);
//  }
//
//});

app.listen(3000, () => console.log('server started 3000'));

export default app;


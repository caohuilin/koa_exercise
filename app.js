import Koa from 'koa';
import util from 'util';
import koaStatic from 'koa-static';
import fs from "fs"
import koaRouter from 'koa-router'
import request from 'co-request';
import cheerio from 'cheerio';
import _ from 'lodash';

const router = koaRouter();
const app = new Koa();


router
  .get('/post',gerArticleList)
  .get('/post/:index',getArticleCon)
  .get('/lagou', getLaGouList);

app
  .use(router.routes())
  .use(router.allowedMethods());

const readdirSy = (path) => new Promise((resolve,reject)=>{
  fs.readdir(path,(err,data)=>{
    if(err){
      return reject(err);
    }
    return resolve(data);
  });
});

const readFileSy = (file)=>new Promise((resolve, reject)=>{
  fs.readFile(file, 'utf8', (err, data)=>{
    if(err){
      return reject(err);
    }
    return resolve(data);
  });
});

async function gerArticleList(ctx){
  //遍历文件夹下的文件
  const articleList = await readdirSy("./article");
  //读取文件的内容
  const articleConList= articleList.map(async (article)=>{
    const articleObj = {};
    articleObj.id = article[7];

    const con = await readFileSy("./article/"+article);
    const con_line = con.split('\n');
    let flag = false;

    for(let i=0; i<con_line.length;i++){
      if(flag === false){
        if(con_line[i][0] === '#'){
          articleObj.title = con_line[i].substring(2,con_line[i].length - 1);
        }
        if(con_line[i][0] === 't'){
          articleObj.tag = con_line[i].substring(4,con_line[i].length - 1);
        }
        if(con_line[i][0] === 'd' && con_line[i][1] === 'a'){
          articleObj.date = con_line[i].substring(5,con_line[i].length - 1);
        }
        if(con_line[i][0] === 'd' && con_line[i][1] === 'e'){
          articleObj.description = con_line[i].substring(12,con_line[i].length - 1);
        }
        if(con_line[i][0] === '-' && con_line[i][1] === '-' ){
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



async function getArticleCon(ctx){
  const articleObj = {};
  const index = ctx.params.index;
  articleObj.id = index[7];
  const con = await readFileSy("./article/"+index);
  const con_line = con.split('\n');
  let flag = false;

  for(let i=0; i<con_line.length;i++){
    if(flag === false){
      if(con_line[i][0] === '#'){
        articleObj.title = con_line[i].substring(2,con_line[i].length - 1);
      }
      if(con_line[i][0] === 't'){
        articleObj.tag = con_line[i].substring(4,con_line[i].length - 1);
      }
      if(con_line[i][0] === 'd' && con_line[i][1] === 'a'){
        articleObj.date = con_line[i].substring(5,con_line[i].length - 1);
      }
      if(con_line[i][0] === 'd' && con_line[i][1] === 'e'){
        articleObj.description = con_line[i].substring(12,con_line[i].length - 1);
      }
      if(con_line[i][0] === '-' && con_line[i][1] === '-' ){
        flag = true;
        articleObj.content =con_line.slice(i+1).join();
        break;
      }
    }
  }

  ctx.body = articleObj;
}

async function  getLaGouList(ctx){
  const res = await request('http://cnodejs.org/');
  console.log(1);
  await sleep();
  console.log(2);
  const body = res.body;
  const $ = cheerio.load(body);
  const list = $('#topic_list .cell');
  const cnOb = _.map(list, li=>{
    const item = {};
    const title = $('.topic_title', $(li)).text().trim();
    const time = $('.last_time span',$(li)).text().trim();
    const reply_count = $('.reply_count .count_of_replies',$(li)).text().trim();
    const click_count = $('.reply_count .count_of_visits',$(li)).text().trim();
    item.title = title;
    item.time = time;
    item.reply_count = reply_count;
    item.click_count = click_count;
    return item;
  });
  ctx.body = cnOb;
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


const Koa = require("koa");
const cors = require("koa2-cors");
// const bodyParser = require("koa-bodyparser");
const KoaBody = require('koa-body')
const Router = require("koa-router");
const stdout = require("shancw-stdout");
const fs = require('fs')
const { renameFile, mergeChunkFile } = require('./utils')
const path = require('path')
const PORT = 5000;
const server = new Koa();
const router = new Router()

const uploadChunkPath = path.resolve(__dirname, './data')

if (!fs.existsSync(uploadChunkPath)) {
    fs.mkdirSync(uploadChunkPath)
}

server.listen(PORT, () => {
    stdout.bgGreen(`server start at port:${PORT}`);
});

router.post('/upload', ctx => {
    if (ctx.request.body.type === 'merge') {
        try {
            const { token, chunkCount, fileName } = ctx.request.body
            mergeChunkFile(fileName, uploadChunkPath, chunkCount, token, './data')
            ctx.body = 'ok'
        } catch (e) {
            ctx.body = "merge fail"
        }
    } else if (ctx.request.body.type === 'upload') {
        try {
            const { index, token, name } = ctx.request.body
            const chunkFile = ctx.request.files.chunk
            const chunkName = chunkFile.path.split('/').pop()
            renameFile(uploadChunkPath, chunkName, `${name}-${index}-${token}`)
            ctx.body = 'upload chunk success'
        } catch (e) {
            ctx.body = 'upload chunk fail'
        }
    } else {
        ctx.body = "unkown type"
    }
})

server
    .use(cors())
    .use(KoaBody({
        multipart: true, // 支持文件上传 
        formidable: {
            //设置文件的默认保存目录，不设置则保存在系统临时目录下  os
            uploadDir: uploadChunkPath
        },
    }))
    .use(router.allowedMethods())
    .use(router.routes())
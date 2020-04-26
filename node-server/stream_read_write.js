const fs = require("fs");
const path = require("path");

/**
 *  
 * @param {String} fileName 生成文件的文件名
 * @param {String} chunkPath 缓存目录的路径
 * @param {String} fileToken 文件的token
 * @param {String} dataDir 可选，生成文件的相对路径
 */
const mergeChunkFile = (fileName,chunkPath,chunkCount,fileToken,dataDir="")=>{
    //如果chunkPath 不存在 则直接结束
    if(!fs.existsSync(path.resolve(__dirname,chunkPath))) return _=>console.log('chunkDir is not exist')

    const dataPath = path.resolve(__dirname, dataDir+'/'+fileName);
    let writeStream = fs.createWriteStream(dataPath); 
    let mergedChunkNum = 0
    return function mergeCore(){
        if (mergedChunkNum > chunkCount) {
            //删除chunkDir
            fs.rmdirSync(path.resolve(__dirname,chunkPath))
            return 
        };
        //创建chunk readStream 
        const curChunk = path.resolve(
            __dirname,
            `${chunkPath}/${fileName}-${mergedChunkNum}-${fileToken}`
        );
        const curChunkReadStream = fs.createReadStream(curChunk);
        //将readStream 写入 writeStream
        curChunkReadStream.pipe(writeStream, { end: false }); //end = false 则可以连续给writeStream 写数据
        curChunkReadStream.on("end", () => {
            //readStream 传输结束 则 递归 进行下一个文件流的读写操作
            console.log(curChunk)
            fs.unlinkSync(curChunk) //删除chunkFile
            mergedChunkNum += 1
            mergeCore();
        });

    }
}

const mergeUserTxt = mergeChunkFile('shancw.txt','./data/chunkList',5,'xx','./data')
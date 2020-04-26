const path = require('path')
const fs = require('fs')
function renameFile(dir, oldName, newName) {
    const oldPath = path.resolve(dir, oldName)
    const newPath = path.resolve(dir, newName)
    fs.renameSync(oldPath, newPath)
}
/**
 *  
 * @param {String} fileName 生成文件的文件名
 * @param {String} chunkPath 缓存目录的路径
 * @param {String} fileToken 文件的token
 * @param {String} dataDir 可选，生成文件的相对路径
 * @returns {Boolean} 
 */
const mergeChunkFile = (fileName, chunkPath, chunkCount, fileToken, dataDir = "./") => {
    //如果chunkPath 不存在 则直接结束`
    if (!fs.existsSync(chunkPath)) return false
    const dataPath = path.join(__dirname, dataDir, fileName);
    let writeStream = fs.createWriteStream(dataPath);
    let mergedChunkNum = 0

    return mergeCore()

    function mergeCore() {
        if (mergedChunkNum >= chunkCount) {
            return true
        };
        const curChunk = path.resolve(chunkPath, `${fileName}-${mergedChunkNum}-${fileToken}`)
        const curChunkReadStream = fs.createReadStream(curChunk);
        //将readStream 写入 writeStream
        curChunkReadStream.pipe(writeStream, { end: false }); //end = false 则可以连续给writeStream 写数据
        curChunkReadStream.on("end", () => {
            //readStream 传输结束 则 递归 进行下一个文件流的读写操作
            fs.unlinkSync(curChunk) //删除chunkFile
            mergedChunkNum += 1
            mergeCore();
        });
        curChunkReadStream.on('error', () => {
            return false
        })

    }
}


module.exports = { renameFile, mergeChunkFile }
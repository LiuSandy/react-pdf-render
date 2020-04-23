// 上传文件组件

import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { Progress } from 'antd'
import axios from 'axios'
import 'antd/dist/antd.css'
import './style.css'

// 需要分片文件的大小
const largeFileSize = 20 * 1000 * 1000;

let loadedLen = 0
let fileChunkLen = 0

const Index = props => {

    const { disabled, accept, multiple, children, action } = props
    const [progress, setProgress] = useState(100);

    const { beforeUpload, onUploadProgress } = props

    const axiosConfig = {
        onUploadProgress: progressEvent => {
            const curPercent = (loadedLen / fileChunkLen * 100).toFixed(2)
            setProgress(curPercent)
            // onUploadProgress(curPercent)
        }
    };


    const onUpload = file => {
        const params = new FormData()
        params.append('file', file)
        console.log("params", params);

        axios.request({
            url: action,
            method: 'POST',
            headers: { 'Content-Type': 'multipart/form-data' },
            data: params,
        }).then(res => {
            console.log("返回结果", res);
        })
    }

    const onChooseFile = e => {
        const files = Object.assign({}, e.target.files);
        beforeUpload && beforeUpload(files).then(res => {
            Object.keys(res).map(fileItem => {
                const file = files[fileItem]
                const { size } = file
                if (size > largeFileSize) {
                    submitUpload(file, "/upload")
                } else {
                    onUpload(files[fileItem])
                }
            })
        }).catch(err => {
            // 文件存在问题，终止上传
            console.log("err", err);
        })
    }

    const createLimitPromise = (limitNum, promiseListRaw) => {
        let resArr = [];
        let handling = 0;
        let resolvedNum = 0;
        let promiseList = [...promiseListRaw]
        let runTime = promiseListRaw.length

        return new Promise(resolve => {
            //并发执行limitNum 次
            for (let i = 1; i <= limitNum; i++) {
                run();
            }

            function run() {
                if (!promiseList.length) return
                handling += 1;
                handle(promiseList.shift())
                    .then(res => {
                        resArr.push(res);
                    })
                    .catch(e => {
                        //ignore
                        console.log("catch error");
                    })
                    .finally(() => {
                        handling -= 1;
                        resolvedNum += 1;

                        //进度条 变量
                        loadedLen = resolvedNum

                        if (resolvedNum === runTime) {
                            resolve(resArr)
                        }
                        run();
                    });
            }
            function handle(promise) {
                return new Promise((resolve, reject) => {
                    promise.then(res => resolve(res)).catch(e => reject(e));
                });
            }
        });
    }

    const createChunkPromiseList = (chunkList, name, TOKEN) => {
        return chunkList
            .map((chunk, index) => {
                // console.log(chunk);
                let formdata = new FormData();
                formdata.append("type", "upload");
                formdata.append("name", name);
                formdata.append("token", TOKEN);
                formdata.append("chunk", chunk);
                formdata.append("index", index);
                return formdata;
            })
            .map(formdata => {
                return axios.post("/upload", formdata, axiosConfig);
            });
    }

    const sliceFile = (file, chunkSize) => {
        let chunkList = [];
        let start = 0;
        let end = chunkSize;
        while (true) {
            let curChunk = file.slice(start, end);
            if (!curChunk.size) break;
            chunkList.push(curChunk);
            start += chunkSize;
            end = start + chunkSize;
        }
        return chunkList;
    }

    const submitUpload = async (file, url) => {
        const CHUNKSIZE = 1 * 1024 * 1024; // 2M
        const TOKEN = Date.now();
        //切割数组
        const chunkList = sliceFile(file, CHUNKSIZE);
        fileChunkLen = chunkList.length
        //创建formdata 并上传
        let promiseList = createChunkPromiseList(chunkList, file.name, TOKEN);
        //并发控制 上传
        await createLimitPromise(2, promiseList);

        //合并分片
        let mergeFormData = new FormData();
        mergeFormData.append("type", "merge");
        mergeFormData.append("token", TOKEN);
        mergeFormData.append("chunkCount", chunkList.length);
        mergeFormData.append("fileName", file.name);
        //结束后发送合并请求
        let res = await axios.post(url, mergeFormData, axiosConfig);
    }

    return (
        <div className="container">
            <div className="uploadContainer">
                <input
                    className="fileInput"
                    type="file"
                    disabled={disabled}
                    accept={accept}
                    multiple={multiple}
                    onChange={onChooseFile}
                />
                {children}
            </div>
            {progress ? (
                <div className="progress-container">
                    <Progress percent={progress} strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                    }} />
                </div>
            ) : null}

        </div>

    )
}

Index.defaultProps = {
    disabled: false,
    multiple: false,
    accept: '.pdf',
    action: '/upload'
}

Index.propTypes = {
    action: PropTypes.string, // 上传的地址
    disabled: PropTypes.bool,// 是否禁用
    accept: PropTypes.string,// 上传接受的文件类型多个类型使用逗号隔开
    multiple: PropTypes.bool,// 是否支持多文件上传
    beforeUpload: PropTypes.func,// 上传文件之前的钩子，参数为上传的文件，若返回 false 则停止上传。支持返回一个 Promise 对象
}


export default Index;
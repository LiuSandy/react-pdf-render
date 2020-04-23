import React from 'react'
import $ from 'jquery';
import WebUploader from 'webuploader'
import axios from 'axios'

class Index extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            uploadPercent: 0, //上传进度
            tips: ''//提示
        };
        this.uploader = '';//存储创建后的WebUploader对象
        this.blockInfo = [];//分片信息存储
    }
    componentDidMount() {
        this.createUploader();
    }
    createUploader() {
        WebUploader.Uploader.register(
            {
                "before-send": "beforeSend"
            },
            {
                beforeSend: (block) => {
                    console.log('检测分片是否上传');
                    let deferred = WebUploader.Deferred();
                    let chunk = block.chunk;
                    if ($.inArray(chunk.toString() + '.part', this.blockInfo) >= 0) {
                        console.log("已有分片.正在跳过分片" + block.chunk.toString() + '.part');
                        deferred.reject();
                    } else {
                        deferred.resolve();
                    }
                    return deferred.promise();
                }
            }
        );
        //配置可直接查看官网
        this.uploader = WebUploader.create({
            swf: '/webuploader-0.1.5/Uploader.swf',
            auto: false,
            chunked: true,
            chunkSize: 1 * 1024 * 1024,
            fileSizeLimit: 2 * 1024 * 1024 * 1024,
            fileSingleSizeLimit: 2 * 1024 * 1024 * 1024,
            resize: false,
            accept: {
                title: 'mp4,jpg',
                extensions: 'mp4,jpg',
                mimeTypes: 'video/mp4,image/jpg'
            },
            chunkRetry: false,
            threads: 1,
            fileNumLimit: 1,
            //附加数据
            formData: {
                guid: WebUploader.Base.guid('hzk_'),
                id: '100'
            }
        });

        //这里我用的是单文件上传，所以每次在文件入列之前，重置uploader和分片信息
        this.uploader.on('beforeFileQueued', (file) => {
            this.uploader.reset();
            this.blockInfo = [];
        });

        //文件切面
        this.uploader.on('fileQueued', (file) => {
            this.uploader.md5File(file, 0, 4 * 1024 * 1024)
                .progress((percentage) => {
                    this.setState({
                        tips: '正在读取文件...' + percentage.toFixed(2) * 100 + '%'
                    });
                })
                .then((fileMd5) => {
                    let formData = this.uploader.option('formData');
                    formData.md5 = fileMd5;
                    this.uploader.option('formData', formData);
                    let fileInfo = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        ext: file.ext
                    };
                    //下面这个方法是一个验证分片是否存在的请求，如果存在的话直接续传
                    axios({
                        method: 'post',
                        url: 'upload-large-test',
                        headers: { 'Content-Type': 'multipart/form-data' },
                        data: {
                            ...fileInfo,
                            ...formData
                        }
                        // data: {
                        //     firstName: 'Fred',
                        //     lastName: 'Flintstone'
                        //   }
                    }).then(({ data, msg }) => {
                        switch (data.code) {
                            // 断点
                            case '0':
                                this.setState({
                                    tips: '正在从上次断开的地方上传文件...'
                                });
                                for (let i in data.blockInfo) {
                                    this.blockInfo.push(data.blockInfo[i]);
                                }
                                file.status = 0;
                                break;
                            // 无断点
                            case '1':
                                this.setState({
                                    tips: '正在上传文件...'
                                });
                                file.status = 1;
                                break;
                        }
                        this.uploader.upload();
                    }, msg => {
                        this.setState({
                            tips: <span style={{ color: 'red' }}>{msg}</span>
                        });
                    })
                });
        });

        //所有分片上传完成后
        this.uploader.on('uploadSuccess', (file, response) => {
            let formData = this.uploader.option('formData');
            let fileInfo = {
                name: file.name,
                size: file.size,
                type: file.type,
                ext: file.ext
            };
            this.setState({
                tips: '正在验证文件...'
            });
            //请求合并
            axios({
                method: 'post',
                url: '/file/uploadMerge',
                data: { ...formData, ...fileInfo }
            }).then(({ data, msg }) => {
                this.setState({
                    tips: <span style={{ color: 'green' }}>{msg}</span>
                });
            }, msg => {
                this.setState({
                    tips: <span style={{ color: 'red' }}>{msg}</span>,
                    uploadPercent: 0
                });
            })
        });

        //进度处理
        this.uploader.on('uploadProgress', (file, percentage) => {
            this.setState({
                uploadPercent: percentage,
                uploading: true
            })
        });

        this.uploader.on('error', (type) => {
            switch (type) {
                case 'Q_EXCEED_NUM_LIMIT':
                    alert('一次只能上传一个文件');
                    break;
                case 'Q_EXCEED_SIZE_LIMIT':
                    alert('文件大小超过限制');
                    break;
                case 'Q_TYPE_DENIED':
                    alert('文件格式只能是video/mp4');
                    break;
            }
        });
        //创建上传按钮
        this.uploader.addButton({
            id: '#picker',
            multiple: false
        });
    }

    //render一个简单的进度条和上传提示信息
    render() {
        return (<div>
            <div style={{ height: "3px", background: "#EFEFEF", width: "400px" }}>
                <div style={{ height: "3px", background: "#1890ff", width: this.state.uploadPercent * 400 + 'px' }}></div>
            </div>
            <span>
                {this.state.tips}
                {this.state.uploadPercent > 0 ? (this.state.uploadPercent * 100).toFixed(2) + '%' : ''}
            </span>
            <span id={"picker"}>上传视频</span>
        </div>)
    }
}

export default Index
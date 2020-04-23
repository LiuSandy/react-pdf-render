import React from 'react'
import axios from 'axios'
import { InboxOutlined } from '@ant-design/icons';
import './style.css'
import { FileUpload, Upload } from '../../components'

const Index = props => {

    const testConnection = () => {
        axios({
            url: '/test-connection',
            method: 'GET'
        })
    }

    return (
        <div>
            {/* <button onClick={()=>testConnection()}>测试连接</button> */}
            <Upload
                beforeUpload={(file, fileList) => {
                    return new Promise((resolve, reject) => {
                        resolve(file)
                    });
                }}
                onUploadProgress={curPercent => {
                    console.log("上传进度", `${curPercent}%`);

                }}
            >
                <div className="">
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ fontSize: 48, color: '#40a9ff' }} />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">
                        Support for a single or bulk upload. Strictly prohibit from uploading company data or other
                        band files
                    </p>
                </div>
            </Upload>
        </div>
    )
}

export default Index;
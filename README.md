> 使用 PDF.js 在 react页面渲染 pdf 文件，不使用官方提供的viewe.html 工具，实现简单的工具栏操作

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## 文件说明

> 本项目原来是为了PDF预览的几种方式创建，后来又添加了大文件分片上传的服务，让整个项目更加灵活

- App.js

```react
import React from 'react'
// 通过修改引入pages的文件不同显示不同的界面
// uploadFile 上传文件服务的客户端
// other PDF 预览页面
import Other from './pages/other'

const Index = props => {
  return <Other />
}

export default Index;
```

- other/index.js

```react
import React from 'react'
// 引入不同的组件
import { PDFViewer } from '../../components'

const url = 'http://127.0.0.1:9002/demo.pdf'

const Index = props => {
    return (<div>
        <PDFViewer url={url}/>
    </div>)
}

export default Index;
```

- components/index.js

> components 是项目的组件目录
>
> - PDF 正常的PDF预览方式 实现功能有翻页，缩放
> - PDFViewer 使用pdf.js 推荐的方式实现预览，实现功能有 翻页 缩放 文字查找高亮显示
> - Upload 文件上传的组件
> - VirtualizedPdf 使用react-virtualized实现大文件预览，其实PDFViewer也支持大文件预览

## 如何使用

```
git clone https://github.com/LiuSandy/react-pdf-render.git
cd react-pdf-render
npm install / yarn install
npm start / yarn start
```

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `yarn build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify

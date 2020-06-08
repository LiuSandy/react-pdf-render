import React from 'react'
import { PDFViewer } from '../../components'

const url = 'http://127.0.0.1:9002/p4.pdf'

const Index = props => {
    return (<div>
        <PDFViewer url={url}/>
    </div>)
}

export default Index;
import React, { useRef, useEffect, useState } from 'react';
import { TextLayerBuilder } from 'pdfjs-dist/web/pdf_viewer';
import 'pdfjs-dist/web/pdf_viewer.css';
import './style.css'

import pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';



pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const src = 'http://127.0.0.1:9002/p2.pdf'
const devicePixelRatio = window.devicePixelRatio;

const Index = () => {
    const canvasRef = useRef(null)
    // 保存PDF实例
    const [pdfInstance, setPdfInstance] = useState(null);
    // 保存PDF页码
    const [numPages, setNumPages] = useState(0);
    // 当前页
    const [currentPage, setCurrentPage] = useState(1);
    // 设置大小
    const [scale, setScale] = useState(1)

    const renderPdf = async (pdf, num) => {

        const page = await pdf.getPage(num);

        const viewport = page.getViewport({ scale: scale * devicePixelRatio });

        // Prepare canvas using PDF page dimensions
        const canvas = canvasRef.current;

        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        await renderTask.promise.then(() => {
            return page.getTextContent()
        }).then(textContent => {
            renderText(textContent, canvas, page, viewport)
        })
    }

    const renderText = (textContent, canvas, page, viewport) => {
        const textLayerDiv = document.createElement('div');

        textLayerDiv.setAttribute('class', 'textLayer');

        textLayerDiv.style.width = `${canvas.width}px`
        textLayerDiv.style.height = `${canvas.height}px`

        // 将文本图层div添加至每页pdf的div中
        const pageDom = canvas.parentNode
        pageDom.appendChild(textLayerDiv);

        // 创建新的TextLayerBuilder实例
        const textLayer = new TextLayerBuilder({
            textLayerDiv,
            pageIndex: page.pageIndex,
            viewport,
        });

        textLayer.setTextContent(textContent);

        textLayer.render();
    }

    useEffect(() => {
        const fetchPdf = async () => {
            const loadingTask = pdfjs.getDocument(src);

            const pdf = await loadingTask.promise;
            setPdfInstance(pdf);
            setNumPages(pdf.numPages)
            renderPdf(pdf, currentPage)
        };


        fetchPdf();
    }, [src]);

    const percentZoom = `${Number(scale*100).toFixed(0)}%`

    return (
        <div>
            <div className='toolBus'>
                <div className='pagination'>
                    <button
                        className="toolbarButton pageUp"
                        title="Previous Page"
                        id="previous"
                        onClick={() => {
                            const previousPage = currentPage - 1;
                            setCurrentPage(previousPage);
                            renderPdf(pdfInstance, previousPage);
                        }}
                        disabled={currentPage === 1}
                    >
                        Previous Page
                    </button>
                    <input
                        type="number"
                        id="pageNumber"
                        className="toolbarField pageNumber"
                        value={currentPage}
                        onChange={e => {
                            const val = parseInt(e.target.value)
                            if (val >= 1 && val <= numPages) {
                                setCurrentPage(val)
                                renderPdf(pdfInstance, val)
                            }
                        }}
                    />
                    / {numPages}
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <button
                        className="toolbarButton pageDown"
                        title="Next Page"
                        id="next"
                        onClick={() => {
                            const nextPage = currentPage + 1;
                            setCurrentPage(nextPage);
                            renderPdf(pdfInstance, nextPage);
                        }}
                        disabled={currentPage === numPages}
                    >
                        Next Page
                    </button>
                </div>
                <div className='zoom'>
                    <button
                        onClick={() => {
                            const curScale = scale + 0.1;
                            if (scale <= 2) {
                                setScale(curScale)
                                renderPdf(pdfInstance, currentPage)
                            }
                        }}
                    >
                        Zoom In
                    </button>
                    <input
                        disabled
                        value={percentZoom}
                    />
                    <button
                        onClick={() => {
                            const curScale = scale - 0.1;
                            if (scale > 0.5) {
                                setScale(curScale)
                                renderPdf(pdfInstance, currentPage)
                            }
                        }}

                    >
                        Zoom Out
                    </button>
                </div>
            </div>
            <div className="container">
                <canvas
                    ref={canvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                />
            </div>
        </div>


    );
}

export default Index;

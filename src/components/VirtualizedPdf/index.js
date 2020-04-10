import React, { useState, useEffect } from 'react'
import pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { List as VList } from 'react-virtualized';
import { TextLayerBuilder } from 'pdfjs-dist/web/pdf_viewer';
import 'pdfjs-dist/web/pdf_viewer.css';
import './style.css'

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const src = 'http://127.0.0.1:9002/p2.pdf';

const firstPageNumber = 1;
const devicePixelRatio = window.devicePixelRatio;

const Index = props => {

    const [numPages, setNumPages] = useState([]);

    const [pdf, setPdf] = useState(null);

    const [scale, setScale] = useState(1);

    const [currentPage, setCurrentPage] = useState(2)

    const getCanvasDom = num => document.querySelector(`canvas[data-page-number='${num + 1}']`)

    const renderPdf = async (num, curPdf) => {

        const page = await curPdf.getPage(num + 1);
        const viewport = page.getViewport({ scale: scale * devicePixelRatio });

        // Prepare canvas using PDF page dimensions
        const canvas = getCanvasDom(num);

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
            renderText(textContent, num, page, viewport)
        })
    }

    const renderText = (textContent, num, page, viewport) => {
        const textLayerDiv = document.querySelector(`div[data-page-number='${num + 1}']`)
        if (textLayerDiv) {
            // 创建新的TextLayerBuilder实例
            const textLayer = new TextLayerBuilder({
                textLayerDiv,
                pageIndex: page.pageIndex,
                viewport,
            });

            textLayer.setTextContent(textContent);

            textLayer.render();
        }
    }

    const getPageInfo = async (curPdf) => {

        const page = await curPdf.getPage(firstPageNumber);
        const viewport = page.getViewport({ scale: scale * devicePixelRatio });
        const width = viewport.width;
        const height = viewport.height;
        const array = []
        for (let index = 0; index < curPdf.numPages; index++) {
            array.push({ width, height })
        }
        setNumPages(array)
    }

    const getItemHeight = ({ index }) => numPages[index].height;

    const renderItem = ({ key, index, style }) => (
        <div key={key} style={{ ...style, border: '1px solid #dddddd' }}>
            <canvas
                data-page-number={index + 1}
                style={{ width: style.width, height: style.height }}
            />
            <div
                data-page-number={index + 1}
                className="textLayer"
                style={{ width: style.width, height: style.height }}
            ></div>
        </div>
    )

    const fetchPdf = async () => {
        const loadingTask = pdfjs.getDocument(src);

        const curPdf = await loadingTask.promise;
        await setPdf(curPdf);
        getPageInfo(curPdf);
    };

    useEffect(() => {
        fetchPdf();

    }, [])

    return (
        <div>
            <div className="toolBus">
                <div className='pagination'>
                    <button
                        className="toolbarButton pageUp"
                        title="Previous Page"
                        id="previous"
                        disabled={currentPage === 1}
                        onClick={()=>{
                            const previousPage = currentPage - 1;
                            setCurrentPage(previousPage);
                        }}
                    >
                        Previous Page
                    </button>
                    <input
                        type="number"
                        id="pageNumber"
                        className="toolbarField pageNumber"
                        value={currentPage}
                    />
                    / {numPages.length}
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <button
                        className="toolbarButton pageDown"
                        title="Next Page"
                        id="next"
                        disabled={currentPage === numPages.length}
                        onClick={()=>{
                            const nextPage = currentPage + 1;
                            setCurrentPage(nextPage);
                        }}
                    >
                        Next Page
                    </button>
                </div>
            </div>
            <div className='container'>
                {pdf && numPages.length ? (
                    <VList
                        style={{
                            margin: 'auto'
                        }}
                        overscanRowCount={3}
                        scrollToAlignment="start"
                        rowCount={numPages?.length}
                        width={numPages[0].width}
                        height={numPages[0].height}
                        rowRenderer={renderItem}
                        rowHeight={getItemHeight}
                        scrollToIndex={currentPage - 1}
                        onRowsRendered={({
                            overscanStartIndex,
                            overscanStopIndex,
                            startIndex,
                            stopIndex,
                        }) => {
                            renderPdf(startIndex, pdf)
                            setCurrentPage(stopIndex + 1)
                        }}
                    />
                ) : null}
            </div>

        </div>
    )
}

export default Index;
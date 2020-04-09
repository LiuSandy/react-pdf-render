import React, { useState, useEffect } from 'react'
import pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { List as VList } from 'react-virtualized';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const src = 'http://127.0.0.1:9002/p2.pdf';

const firstPageNumber = 1;
const devicePixelRatio = window.devicePixelRatio;

const Index = props => {

    const [numPages, setNumPages] = useState([]);

    const [pdf, setPdf] = useState(null);

    const getCanvasDom = num => document.querySelector(`canvas[data-page-number='${num + 1}']`)

    const renderPdf = async (num, curPdf) => {

        const page = await curPdf.getPage(num + 1);

        const scale = 1;
        const viewport = page.getViewport({ scale: scale*devicePixelRatio });

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

        await renderTask.promise;
    }

    const getPageInfo = async (curPdf) => {

        const page = await curPdf.getPage(firstPageNumber);
        const viewport = page.getViewport({ scale: 1 * devicePixelRatio });
        const width = viewport.width / devicePixelRatio;
        const height = viewport.height / devicePixelRatio;
        const array = []
        for (let index = 0; index < curPdf.numPages; index++) {
            array.push({ width, height })
        }
        setNumPages(array)
    }

    const getItemHeight = ({ index }) => numPages[index].height;

    const renderItem = ({ key, index, style }) => (
        <canvas
            key={index}
            data-page-number={index + 1}
            style={{...style,margin:5}}
        />
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
            {pdf && numPages.length ? (
                <VList
                    scrollToAlignment="start"
                    rowCount={numPages?.length}
                    width={numPages[0].width}
                    height={numPages[0].height}
                    rowRenderer={renderItem}
                    rowHeight={getItemHeight}
                    onRowsRendered={({
                        overscanStartIndex,
                        overscanStopIndex,
                        startIndex,
                        stopIndex,
                    }) => {
                        renderPdf(startIndex, pdf)
                    }}
                />
            ) : null}
        </div>
    )
}

export default Index;
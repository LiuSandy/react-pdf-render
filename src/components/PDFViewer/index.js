import React, { useRef, useEffect, useState } from 'react'
import pdfjs from 'pdfjs-dist';
import {useKeyPress} from '@umijs/hooks';
import { PDFLinkService, PDFFindController, PDFViewer,DownloadManager } from 'pdfjs-dist/web/pdf_viewer';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import 'pdfjs-dist/web/pdf_viewer.css';
import './style.css'
import { getVisibleElements } from './utils'

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// 显示文字类型 0 不显示 1 显示 2 启用增强
const TEXT_LAYER_MODE = 2;
// 是否通过CSS控制放大缩小 true false
const USE_ONLY_CSS_ZOOM = true

const Index = props => {
    const containerRef = useRef(null);

    const [viewer = {}, setViewer] = useState({});
    const [currentPageNumber = 1, setCurrentPageNumber] = useState(1);
    const [numPages = 1, setNumPages] = useState(1);
    const [pageData = 1, setPageData] = useState([]);
    const [scale = 1, setScale] = useState("auto");
    const [searcher = {}, setSearcher] = useState({
        phraseSearch: true,
        query: '',
        findPrevious: true,
        highlightAll: true,
    });
    const [pdfDom = 1, setPdfDom] = useState(null);
    const [matchesCount = {}, setMatchesCount] = useState({});

    // 页面滚动时操作
    const scrollPages = () => {
        // 当前试图显示的页面
        // {
        //     first: // 当前页面
        //     last:  // 最后一个页面
        // }
        const viewers = getVisibleElements(pdfDom, pageData, true, false);
        console.log("currentPage", viewers);
    }

    const changePage = (num) => {
        viewer.currentPageNumber = num
        setCurrentPageNumber(num)
    }

    // 渲染页面
    const initialViewer = (url) => {
        const linkService = new PDFLinkService();
        const findController = new PDFFindController({
            linkService,
        });
        const newViewer = new PDFViewer({
            container: containerRef.current,
            linkService,
            useOnlyCssZoom: USE_ONLY_CSS_ZOOM,
            textLayerMode: TEXT_LAYER_MODE,
            // renderer:'svg',
            findController,
        });
        linkService.setViewer(newViewer);
        // 设置初始缩放
        newViewer.currentScaleValue = scale;

        const loadingTask = pdfjs.getDocument({ url });
        loadingTask.promise.then(pdf => {
            if (pdf) {
                const nums = pdf.numPages
                setNumPages(nums)
                newViewer.setDocument(pdf);
                linkService.setDocument(pdf);
                setViewer(newViewer)
                // 判断是否已经渲染完毕
                const interval = setInterval(() => { loadPdf() }, 1000);
                function loadPdf() {
                    if (newViewer.pageViewsReady) {
                        // 暂时没有用到
                        const pdfDom = document.getElementById('innerContainer')
                        const pageData = []
                        pdfDom.childNodes.forEach((item, index) => {
                            pageData.push({
                                div: item,
                                id: index
                            })
                        })
                        clearInterval(interval);
                        setPageData(pageData)
                        setPdfDom(pdfDom)
                    }
                }
            }
        })
    }

    const { url } = props

    useEffect(() => {
        if (url) {
            initialViewer(url)
        }
        // 监听事件
        document.addEventListener('pagechanging', function (evt) {
            const page = evt.detail.pageNumber;
            changePage(page)
        })
    }, [url])

    // useEffect(() => {
    //     if (viewer) {
    //         const searchBar = document.getElementById("searchInput")
    //         searchBar.addEventListener('keydown', e => {
    //             console.log("searcher",searcher);
    //             if (e.keyCode === 13 && viewer.findController) {
    //                 viewer.findController.executeCommand('findagain', searcher);
    //             }
    //         })
    //     }
    // }, [])

    useKeyPress('enter', event => {
        viewer.findController.executeCommand('findagain', searcher);
      });

    useEffect(() => {
        window.addEventListener('updatefindcontrolstate', e => {
            setMatchesCount(e.detail.matchesCount);
        });
        window.addEventListener('updatefindmatchescount', e => {
            setMatchesCount(e.detail.matchesCount);
        })
    })

    return (
        <div>
            <div className="toolBus">
                <div className='pagination'>
                    <button
                        className="toolbarButton pageUp"
                        title="Previous Page"
                        id="previous"
                        onClick={() => {
                            const newCurrentPageNumber = currentPageNumber - 1
                            changePage(newCurrentPageNumber)

                        }}
                        disabled={currentPageNumber === 1}
                    >
                        Previous Page
                    </button>
                    <input
                        type="number"
                        id="pageNumber"
                        value={currentPageNumber}
                        onChange={e => {
                            const val = parseInt(e.target.value)
                            if (val >= 1 && val <= numPages) {
                                changePage(val)
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
                            const newCurrentPageNumber = currentPageNumber + 1
                            changePage(newCurrentPageNumber)
                        }}
                        disabled={currentPageNumber === numPages}
                    >
                        Next Page
                    </button>
                </div>
                <div className="selection">
                    <select
                        value={`${scale}`}
                        onChange={e => {
                            const newScale = e.target.value
                            viewer.currentScaleValue = newScale;
                            setScale(newScale)
                        }}
                    >
                        <option value="auto">自动缩放</option>
                        <option value="page-actual">实际大小</option>
                        <option value="page-fit">适合页面</option>
                        <option value="page-width">适合页宽</option>
                        <option value="0.50">50%</option>
                        <option value="0.75">75%</option>
                        <option value="1">100%</option>
                        <option value="1.25">125%</option>
                        <option value="1.50">150%</option>
                        <option value="1.75">175%</option>
                        <option value="2">200%</option>
                        <option value="3">300%</option>
                        <option value="4">400%</option>
                    </select>
                </div>
                <div className='findTool'>
                    <input
                        type="text"
                        id="searchInput"
                        onChange={e => {
                            setSearcher({
                                ...searcher,
                                query: e.target.value,
                            });
                        }}
                    />
                    {matchesCount.total ? (
                        <span>{`第 ${matchesCount.current} 项, 共匹配 ${matchesCount.total} 项`}</span>
                    ) : null}
                </div>
            </div>
            <div
                id="viewerContainer"
                className="viewerContainer"
                ref={containerRef}
            >
                <div
                    className="pdfViewer"
                    id="innerContainer"
                />
            </div>
        </div>
    )
}

Index.displayName = "PDFViewer"

export default Index;

function binarySearchFirstItem(items, condition) {
    let minIndex = 0;
    let maxIndex = items.length - 1;
  
    if (items.length === 0 || !condition(items[maxIndex])) {
      return items.length;
    }
    if (condition(items[minIndex])) {
      return minIndex;
    }
  
    while (minIndex < maxIndex) {
      let currentIndex = (minIndex + maxIndex) >> 1;
      let currentItem = items[currentIndex];
      if (condition(currentItem)) {
        maxIndex = currentIndex;
      } else {
        minIndex = currentIndex + 1;
      }
    }
    return minIndex; /* === maxIndex */
  }
  
  function backtrackBeforeAllVisibleElements(index, views, top) {
    // binarySearchFirstItem's assumption is that the input is ordered, with only
    // one index where the conditions flips from false to true: [false ...,
    // true...]. With vertical scrolling and spreads, it is possible to have
    // [false ..., true, false, true ...]. With wrapped scrolling we can have a
    // similar sequence, with many more mixed true and false in the middle.
    //
    // So there is no guarantee that the binary search yields the index of the
    // first visible element. It could have been any of the other visible elements
    // that were preceded by a hidden element.
  
    // Of course, if either this element or the previous (hidden) element is also
    // the first element, there's nothing to worry about.
    if (index < 2) {
      return index;
    }
  
    // That aside, the possible cases are represented below.
    //
    //     ****  = fully hidden
    //     A*B*  = mix of partially visible and/or hidden pages
    //     CDEF  = fully visible
    //
    // (1) Binary search could have returned A, in which case we can stop.
    // (2) Binary search could also have returned B, in which case we need to
    // check the whole row.
    // (3) Binary search could also have returned C, in which case we need to
    // check the whole previous row.
    //
    // There's one other possibility:
    //
    //     ****  = fully hidden
    //     ABCD  = mix of fully and/or partially visible pages
    //
    // (4) Binary search could only have returned A.
  
    // Initially assume that we need to find the beginning of the current row
    // (case 1, 2, or 4), which means finding a page that is above the current
    // page's top. If the found page is partially visible, we're definitely not in
    // case 3, and this assumption is correct.
    let elt = views[index].div;
    let pageTop = elt.offsetTop + elt.clientTop;
  
    if (pageTop >= top) {
      // The found page is fully visible, so we're actually either in case 3 or 4,
      // and unfortunately we can't tell the difference between them without
      // scanning the entire previous row, so we just conservatively assume that
      // we do need to backtrack to that row. In both cases, the previous page is
      // in the previous row, so use its top instead.
      elt = views[index - 1].div;
      pageTop = elt.offsetTop + elt.clientTop;
    }
  
    // Now we backtrack to the first page that still has its bottom below
    // `pageTop`, which is the top of a page in the first visible row (unless
    // we're in case 4, in which case it's the row before that).
    // `index` is found by binary search, so the page at `index - 1` is
    // invisible and we can start looking for potentially visible pages from
    // `index - 2`. (However, if this loop terminates on its first iteration,
    // which is the case when pages are stacked vertically, `index` should remain
    // unchanged, so we use a distinct loop variable.)
    for (let i = index - 2; i >= 0; --i) {
      elt = views[i].div;
      if (elt.offsetTop + elt.clientTop + elt.clientHeight <= pageTop) {
        // We have reached the previous row, so stop now.
        // This loop is expected to terminate relatively quickly because the
        // number of pages per row is expected to be small.
        break;
      }
      index = i;
    }
    return index;
  }
  

export const getVisibleElements=(scrollEl, views, sortByVisibility = false, horizontal = false)=>{
    const top = scrollEl.scrollTop,
      bottom = top + scrollEl.clientHeight;
    const left = scrollEl.scrollLeft,
      right = left + scrollEl.clientWidth;
  
    // Throughout this "generic" function, comments will assume we're working with
    // PDF document pages, which is the most important and complex case. In this
    // case, the visible elements we're actually interested is the page canvas,
    // which is contained in a wrapper which adds no padding/border/margin, which
    // is itself contained in `view.div` which adds no padding (but does add a
    // border). So, as specified in this function's doc comment, this function
    // does all of its work on the padding edge of the provided views, starting at
    // offsetLeft/Top (which includes margin) and adding clientLeft/Top (which is
    // the border). Adding clientWidth/Height gets us the bottom-right corner of
    // the padding edge.
    function isElementBottomAfterViewTop(view) {
      const element = view.div;
      const elementBottom = element.offsetTop + element.clientTop + element.clientHeight;
      return elementBottom > top;
    }
  
    function isElementRightAfterViewLeft(view) {
      const element = view.div;
      const elementRight = element.offsetLeft + element.clientLeft + element.clientWidth;
      return elementRight > left;
    }
  
    const visible = [],
      numViews = views.length;
    let firstVisibleElementInd =
      numViews === 0
        ? 0
        : binarySearchFirstItem(
            views,
            horizontal ? isElementRightAfterViewLeft : isElementBottomAfterViewTop
          );
  
    // Please note the return value of the `binarySearchFirstItem` function when
    // no valid element is found (hence the `firstVisibleElementInd` check below).
    if (firstVisibleElementInd > 0 && firstVisibleElementInd < numViews && !horizontal) {
      // In wrapped scrolling (or vertical scrolling with spreads), with some page
      // sizes, isElementBottomAfterViewTop doesn't satisfy the binary search
      // condition: there can be pages with bottoms above the view top between
      // pages with bottoms below. This function detects and corrects that error;
      // see it for more comments.
      firstVisibleElementInd = backtrackBeforeAllVisibleElements(firstVisibleElementInd, views, top);
    }
  
    // lastEdge acts as a cutoff for us to stop looping, because we know all
    // subsequent pages will be hidden.
    //
    // When using wrapped scrolling or vertical scrolling with spreads, we can't
    // simply stop the first time we reach a page below the bottom of the view;
    // the tops of subsequent pages on the same row could still be visible. In
    // horizontal scrolling, we don't have that issue, so we can stop as soon as
    // we pass `right`, without needing the code below that handles the -1 case.
    let lastEdge = horizontal ? right : -1;
  
    for (let i = firstVisibleElementInd; i < numViews; i++) {
      const view = views[i],
        element = view.div;
      const currentWidth = element.offsetLeft + element.clientLeft;
      const currentHeight = element.offsetTop + element.clientTop;
      const viewWidth = element.clientWidth,
        viewHeight = element.clientHeight;
      const viewRight = currentWidth + viewWidth;
      const viewBottom = currentHeight + viewHeight;
  
      if (lastEdge === -1) {
        // As commented above, this is only needed in non-horizontal cases.
        // Setting lastEdge to the bottom of the first page that is partially
        // visible ensures that the next page fully below lastEdge is on the
        // next row, which has to be fully hidden along with all subsequent rows.
        if (viewBottom >= bottom) {
          lastEdge = viewBottom;
        }
      } else if ((horizontal ? currentWidth : currentHeight) > lastEdge) {
        break;
      }
  
      if (
        viewBottom <= top ||
        currentHeight >= bottom ||
        viewRight <= left ||
        currentWidth >= right
      ) {
        continue;
      }
  
      const hiddenHeight = Math.max(0, top - currentHeight) + Math.max(0, viewBottom - bottom);
      const hiddenWidth = Math.max(0, left - currentWidth) + Math.max(0, viewRight - right);
      const percent =
        (((viewHeight - hiddenHeight) * (viewWidth - hiddenWidth) * 100) / viewHeight / viewWidth) |
        0;
      visible.push({
        id: view.id,
        x: currentWidth,
        y: currentHeight,
        view,
        percent,
      });
    }
  
    const first = visible[0],
      last = visible[visible.length - 1];
  
    if (sortByVisibility) {
      visible.sort(function(a, b) {
        let pc = a.percent - b.percent;
        if (Math.abs(pc) > 0.001) {
          return -pc;
        }
        return a.id - b.id; // ensure stability
      });
    }
    return { first, last, views: visible };
  }
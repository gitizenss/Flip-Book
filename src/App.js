import React, { useRef, useState, useEffect, forwardRef } from "react";
import audio from "./audio/meyaditemp.mp3";
import flippingPageAudio from "./audio/page-flip-8.mp3";
import {
  Document,
  Page as ReactPdfPage,
  pdfjs,
} from "react-pdf/dist/esm/entry.webpack5";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "./App.css";
import { Highlight, PdfHighlighter, PdfLoader } from "react-pdf-highlighter";
import transcript from "./transcript/csvjsonnew.json";
import HTMLFlipBook from "react-pageflip";
import { Pageview } from "@mui/icons-material";

const App = () => {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

  const introRef = useRef(null);
  const flippingRef = useRef(null);
  const [resultsindex, setResultsIndex] = useState(0);
  const [alternativeindex, setAlternativeindex] = useState(0);
  const [wordsindex, setWordsIndex] = useState(0);
  const [highlights, setHighlights] = useState([]);
  const pdfViewerRef = useRef(null);
  const [scrollto, setScrollTo] = useState(0);
  const [pdf, setPdf] = useState(null);
  const [spanindex, setSpanindex] = useState(0);
  const [transcriptindex, setTranscriptIndex] = useState(0);
  const [startingWord, setStartingWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const [span, setSpan] = useState(null);
  const pageFlip = useRef(null);
  const width = 700;
  const height = 1081;

  function flipNextPage() {
    pageFlip.current.pageFlip().flipNext();
    return true;
  }

  function flipPrevPage() {
    pageFlip.current.pageFlip().flipPrev();
  }

  function getSpans() {
    // const spans = document.querySelectorAll('span[role="presentation"]');
    const parentDiv = document.querySelector(
      `div[data-page-number="${
        pageFlip.current.pageFlip().getCurrentPageIndex() + 1
      }"]`
    );
    const childDiv = parentDiv.querySelector("div");
    const spans = childDiv.querySelectorAll('span[role="presentation"]');
    return spans;
  }

  function modifySpans() {
    const updatedspans = getSpans();
    const spans = document.querySelectorAll('span[role="presentation"]');

    const newpageIndex = pageFlip.current.pageFlip().getCurrentPageIndex();
    if (updatedspans.length > 0) {
      setLastWord(
        transcript.results[newpageIndex].words[
          transcript.results[newpageIndex].words.length - 1
        ].Word
      );
    }

    const newSpans = [];

    for (let i = 0; i < spans.length - 1; i++) {
      const span = spans[i];
      const top = span.style.top;
      const otherspan = spans[i + 1];
      if (otherspan.style.top === top) {
        //Loop through the remaining spans
        for (let j = i + 1; j <= i + 3; j++) {
          const otherSpan = spans[j];
          const othertop = otherSpan.style.top;

          // If the top position of the current span and the other span is the same,
          // add the other span's text content to the current span's text content
          if (top === othertop) {
            span.textContent += otherSpan.textContent;

            // Remove the other span from the DOM
            if (otherSpan.parentNode) {
              otherSpan.parentNode.removeChild(otherSpan);
            }
          } else {
            break;
          }
        }
      }
    }
    return newSpans;
  }

  const [prevSpan, setPrevSpan] = useState(null);
  const [fixedSpans, setFixedSpans] = useState(0);
  const [disable, setDisable] = useState(false);

  function handleAudioTimeUpdate(
    resultsindex,
    alternativeindex,
    transcriptindex
  ) {
    const time = introRef.current.currentTime;
    const updatedspans = getSpans();
    if (fixedSpans === 0) {
      modifySpans();
      setFixedSpans(fixedSpans + 1);
    }
    if (resultsindex !== pageFlip.current.pageFlip().getPageCount()) {
      if (updatedspans.length > 0) {
        if (time > parseFloat(transcript.results[resultsindex].data_end)) {
          setResultsIndex(resultsindex + 1);
          const index = transcript.results[resultsindex].words.findIndex(
            (word) => word.Word === startingWord
          );
          setTranscriptIndex(0);
          setWordsIndex(index);
        } else if (
          time >
            parseFloat(
              transcript.results[resultsindex].words[transcriptindex].data_start
            ) &&
          transcriptindex <= transcript.results[resultsindex].words.length - 1
        ) {
          if (updatedspans[wordsindex]) {
            const words = updatedspans[wordsindex].textContent.split(" ");
            const currspan = updatedspans[wordsindex];
            const oldwords = words;
            if (prevSpan) {
              prevSpan.style.backgroundColor = "";
            }

            words[spanindex] = `<span>${words[spanindex]}</span>`;
            currspan.innerHTML = words.join(" ");
            const currinnerspan = currspan.querySelector("span");
            if (currinnerspan) {
              currinnerspan.style.backgroundColor = "#ffd9c4";
              // currinnerspan.scrollIntoView({ behavior: "smooth", block: "center" });
              setPrevSpan(currinnerspan);
            }

            if (spanindex == words.length - 1) {
              setSpanindex(0);
              setWordsIndex(wordsindex + 1);
            } else {
              setSpanindex(spanindex + 1);
            }
            if (
              transcriptindex !==
              transcript.results[resultsindex].words.length - 1
            ) {
              setTranscriptIndex(transcriptindex + 1);
            }
            if (
              transcript.results[resultsindex].words[
                transcript.results[resultsindex].words.length - 1
              ].Word === lastWord &&
              transcriptindex ===
                transcript.results[resultsindex].words.length - 2
            ) {
              setTimeout(() => {
                flipNextPage();
              }, 500);
            }
          }
        }
      }
    }
  }
  useEffect(() => {
    introRef.current.volume = 0.1;
  }, []);

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [file, setFile] = useState("/intro2.pdf");

  function onDocumentLoadSuccess({ numPages: nextNumPages }) {
    setNumPages(nextNumPages);
  }

  const goToPrevPage = () =>
    setPageNumber(pageNumber - 1 <= 1 ? 1 : pageNumber - 1);

  const goToNextPage = () =>
    setPageNumber(pageNumber + 1 >= numPages ? numPages : pageNumber + 1);

  function updateHighlights(newHighlights) {
    setHighlights(newHighlights);
  }

  const [Page, setPage] = useState([]);
  const handleLoadSuccess = async (pdfDocument) => {
    const newPages = [];
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      newPages.push({ page, textContent });
    }
    setPage(newPages);
  };
  useEffect(() => {
    // Load PDF document when component mounts
    const loadDocument = async () => {
      try {
        if (pdf != null) {
          handleLoadSuccess(pdf);
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadDocument();
  }, [file, pdf]);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (introRef && introRef.current) {
      if (playing) {
        introRef.current.play();
      } else {
        introRef.current.pause();
      }
    }
  }, [playing]);

  function useInterval(callback, delay) {
    const savedCallback = useRef(null);

    //Remember the latest callback
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }
  useInterval(() => {
    if (introRef && introRef.current) {
      const { currentTime, duration } = introRef.current;
      setProgress(Math.ceil((currentTime * 100) / duration));
    }
  });
  const [oldpageindex, setOldpageindex] = useState(0);
  const [oldstate, setOldState] = useState("read");

  function changeTimeOnPageChange(newState, oldState) {
    const updatedspans = getSpans();
    modifySpans();
    const newpageIndex = pageFlip.current.pageFlip().getCurrentPageIndex();
    if (updatedspans.length > 0) {
      if (newState.data === "read") {
        if (oldstate === "flipping") {
          introRef.current.currentTime = parseFloat(
            transcript.results[newpageIndex].words[0].data_start - 0.5
          );
          console.log(oldpageindex);
          console.log(newpageIndex);

          setResultsIndex(newpageIndex);
          setStartingWord(transcript.results[newpageIndex].words[0].Word);
          const spans = getSpans();
          const index = Array.from(spans).findIndex((word) =>
            word.textContent.includes(
              transcript.results[newpageIndex].words[0].Word
            )
          );
          setTranscriptIndex(0);
          setSpanindex(0);
          setWordsIndex(index);
          if (disable) {
            setDisable(!disable);
          }
        }
      }
    } else {
      introRef.current.currentTime =
        transcript.results[newpageIndex - 1].data_end - 0.5;
      setDisable(!disable);
      if (playing) {
        setPlaying(!playing);
      }
    }

    if (newState.data === "flipping") {
      flippingRef.current.play();
      setOldState(newState.data);
      setOldpageindex(pageFlip.current.pageFlip().getCurrentPageIndex());
    }
    if (newState.data === "fold_corner") {
      setOldState(newState.data);
      setOldpageindex(pageFlip.current.pageFlip().getCurrentPageIndex());
    }
    if (newState.data === "user_fold") {
      setOldState(newState.data);
      setOldpageindex(pageFlip.current.pageFlip().getCurrentPageIndex());
    }

    if (oldstate === "user_fold" && newState.data === "read") {
      const newpageIndex = pageFlip.current.pageFlip().getCurrentPageIndex();
      console.log(oldpageindex);
      console.log(newpageIndex);
      if (updatedspans.length > 0) {
        introRef.current.currentTime = parseFloat(
          transcript.results[newpageIndex].words[0].data_start - 1
        );

        setResultsIndex(newpageIndex);
        setStartingWord(transcript.results[newpageIndex].words[0].Word);
        const spans = getSpans();
        const index = Array.from(spans).findIndex((word) =>
          word.textContent.includes(
            transcript.results[newpageIndex].words[0].Word
          )
        );
        setTranscriptIndex(0);
        setSpanindex(0);
        setWordsIndex(index);
      }
    }
  }

  return (
    <div className="App">
      <div className="Example">
        <header>
          <h1>react-pdf sample page</h1>
        </header>
        <div className="Example__container__document">
          <audio
            ref={introRef}
            onTimeUpdate={() => {
              handleAudioTimeUpdate(
                resultsindex,
                alternativeindex,
                transcriptindex
              );
            }}
          >
            <source src={audio} type="audio/mpeg" />
          </audio>
          <audio ref={flippingRef}>
            <source src={flippingPageAudio} type="audio/mpeg" />
          </audio>
          {/* <button onClick={goToPrevPage}> Go to Prev Page </button>
          <button onClick={goToNextPage}> Go to next Page </button> */}
          {/* <Document file={file} onLoadSuccess={onDocumentLoadSuccess} onLoadError={(error) => {
              console.log(error)
            }} >
                

                
                    <Page pageNumber={pageNumber} />
                    
              
                
            </Document> */}
          {/* <PdfLoader
            url={file}
            beforeLoad={<div>Loading...</div>}
            onError={(error) => console.error(error)}
          >
            {(pdfDocument) => {
              setPdf(pdfDocument);
              return (
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  ref={pdfViewerRef}
                  highlights={highlights}
                ></PdfHighlighter>
              );
            }}
          </PdfLoader> */}
          <div className="progress-wrapper">
            <div className="bar-wrapper">
              <div className="purple-bar"></div>
              <div
                className="green-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {!playing && (
              <svg
                viewBox="0 0 1024 1024"
                fill="currentColor"
                height="3em"
                width="3em"
                onClick={() => {
                  if (!disable) {
                    setPlaying(!playing);
                  }
                }}
              >
                <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
                <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 00398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 000-25.8zm-257.6 134V390.9L628.5 512 461.8 633.1z" />
              </svg>
            )}
            {playing && (
              <svg
                viewBox="0 0 1024 1024"
                fill="currentColor"
                height="3em"
                width="3em"
                onClick={() => {
                  setPlaying(!playing);
                }}
              >
                <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm-88-532h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8zm224 0h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8z" />
              </svg>
            )}
          </div>
          <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
            <HTMLFlipBook
              width={width}
              height={height}
              ref={pageFlip}
              onChangeState={changeTimeOnPageChange}
            >
              {Array.from({ length: numPages }, (_, index) => (
                <div key={`page_${index + 1}`} className="pagespdf">
                  <ReactPdfPage
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    width={width}
                    height={height}
                  />
                </div>
              ))}
            </HTMLFlipBook>
          </Document>
        </div>
      </div>
    </div>
  );
};

export default App;

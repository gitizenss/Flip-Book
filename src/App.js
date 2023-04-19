import React, { useRef, useState, useEffect, forwardRef } from "react";
import audio from "./audio/doc2merged.mp3";
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
import transcript from "./transcript/csvjsonmergedUpdated.json";
import HTMLFlipBook from "react-pageflip";
import { Pageview } from "@mui/icons-material";
import loading from "./images/loading.gif";
import logo from "./images/logo.png";

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
  const [pageStates, setPageStates] = useState([]);
  const [pageSpans, setPageSpans] = useState([]);
  const [volume, setVolume] = useState(1);
  const [oldvolume, setoldVolume] = useState(1);
  const [mute, setMute] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const pageFlip = useRef(null);
  const [width, setWidth] = useState(700);
  const [height, setHeight] = useState(1081);

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
    const spans = document.querySelectorAll('span[role="presentation"]');

    for (let i = 0; i < spans.length - 1; i++) {
      const span = spans[i];
      const top = span.style.top;

      let j = i + 1;
      let nextSpan = spans[j];
      while (nextSpan && nextSpan.style.top === top) {
        span.textContent += nextSpan.textContent;

        if (nextSpan.parentNode) {
          nextSpan.parentNode.removeChild(nextSpan);
        }

        j++;
        nextSpan = spans[j];
      }

      // Update the loop counter to skip the merged spans
      i = j - 1;
    }
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
    if (resultsindex !== transcript.results.length) {
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
              currinnerspan.style.backgroundColor = "yellow";
              currinnerspan.style.opacity = 0.7;
              setPrevSpan(currinnerspan);
              const currentPageIndex = pageFlip.current
                .pageFlip()
                .getCurrentPageIndex();
              const newPageSpans = [...pageSpans];
              newPageSpans[currentPageIndex] = currinnerspan;
              setPageSpans(newPageSpans);
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
              transcriptindex ===
              transcript.results[resultsindex].words.length - 2
            ) {
              setTimeout(() => {
                flipNextPage();
              }, 200);
            }
          }
        }
      }
    }
  }

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const [file, setFile] = useState("/Flip-Book/docs/Brevinn WIP Format.pdf");



  function onDocumentLoadSuccess() {
    const documentPdf = document.getElementsByClassName("react-pdf__Page");
    const loadingPlaceholder = document.getElementsByClassName("placeholder");
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }

  function handleSuccess({ numPages: nextNumPages }) {
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

  const handleVolumeChange = (event) => {
    const volume = parseFloat(event.target.value);
    setVolume(volume);
    introRef.current.volume = volume;
    if (volume === 0) {
      setMute(true);
    } else {
      setMute(false);
    }
  };

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
  function saveCurrentPageState(
    resultsindex,
    transcriptindex,
    wordsindex,
    spanindex
  ) {
    const currentPageIndex = pageFlip.current.pageFlip().getCurrentPageIndex();
    const currentPageState = {
      resultsindex,
      transcriptindex,
      spanindex,
      wordsindex,
    };
    const newPageStates = [...pageStates];
    newPageStates[currentPageIndex] = currentPageState;
    setPageStates(newPageStates);
  }

  function restorePreviousPageState() {
    const currentPageIndex = pageFlip.current.pageFlip().getCurrentPageIndex();
    const previousPageState = pageStates[currentPageIndex];

    if (previousPageState) {
      setResultsIndex(previousPageState.resultsindex);
      setTranscriptIndex(previousPageState.transcriptindex);
      setSpanindex(previousPageState.spanindex);
      setWordsIndex(previousPageState.wordsindex);
    }
  }

  function changeTimeOnPageChange(newState, oldState) {
    const updatedspans = getSpans();
    modifySpans();
    const newpageIndex = pageFlip.current.pageFlip().getCurrentPageIndex();
    if (transcript.results[newpageIndex]) {
      if (!pageStates[newpageIndex] && newpageIndex !== oldpageindex) {
        if (newState.data === "read") {
          const spans = getSpans();
          const index = Array.from(spans).findIndex((word) =>
            word.textContent.includes(
              transcript.results[newpageIndex].words[0].Word
            )
          );
          introRef.current.currentTime = parseFloat(
            transcript.results[newpageIndex].words[0].data_start - 0.5
          );
          setResultsIndex(newpageIndex);
          setStartingWord(transcript.results[newpageIndex].words[0].Word);

          setTranscriptIndex(0);
          setSpanindex(0);
          setWordsIndex(index);
        }
      } else {
        if (updatedspans.length > 0) {
          if (newState.data === "read") {
            if (oldstate === "flipping" || oldstate === "user_fold") {
              restorePreviousPageState();
              const spans = getSpans();
              const index = Array.from(spans).findIndex((word) =>
                word.textContent.includes(
                  transcript.results[newpageIndex].words[0].Word
                )
              );
              if (pageStates[newpageIndex]) {
                if (pageStates[newpageIndex].transcriptindex !== index) {
                  introRef.current.currentTime = parseFloat(
                    transcript.results[newpageIndex].words[
                      pageStates[newpageIndex].transcriptindex
                    ].data_start
                  );
                  const oldPageSpan = pageSpans[newpageIndex];
                  if (oldPageSpan) {
                    oldPageSpan.style.backgroundColor = "#ffd9c4";
                  }
                } else {
                  introRef.current.currentTime = parseFloat(
                    transcript.results[newpageIndex].words[0].data_start - 0.5
                  );
                  setResultsIndex(newpageIndex);
                  setStartingWord(
                    transcript.results[newpageIndex].words[0].Word
                  );

                  setTranscriptIndex(0);
                  setSpanindex(0);
                  setWordsIndex(index);
                }
                if (disable) {
                  setDisable(!disable);
                }
              } else {
                introRef.current.currentTime = parseFloat(
                  transcript.results[newpageIndex].words[0].data_start - 0.5
                );
                setResultsIndex(newpageIndex);
                setStartingWord(transcript.results[newpageIndex].words[0].Word);

                setTranscriptIndex(0);
                setSpanindex(0);
                setWordsIndex(index);
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
      }

      if (newState.data === "flipping") {
        console.log(transcriptindex);
        console.log(resultsindex);
        flippingRef.current.play();
        if (
          transcriptindex ===
          transcript.results[newpageIndex].words.length - 1
        ) {
          const spans = getSpans();
          const index = Array.from(spans).findIndex((word) =>
            word.textContent.includes(
              transcript.results[newpageIndex].words[0].Word
            )
          );
          saveCurrentPageState(resultsindex, 0, index, 0);
        } else {
          saveCurrentPageState(
            resultsindex,
            transcriptindex,
            wordsindex,
            spanindex
          );
          setOldState(newState.data);
          setOldpageindex(pageFlip.current.pageFlip().getCurrentPageIndex());
        }
      }
      if (newState.data === "fold_corner") {
        setOldState(newState.data);
        setOldpageindex(pageFlip.current.pageFlip().getCurrentPageIndex());
      }
      if (newState.data === "user_fold") {
        if (
          transcriptindex ===
          transcript.results[resultsindex].words.length - 1
        ) {
          const spans = getSpans();
          const index = Array.from(spans).findIndex((word) =>
            word.textContent.includes(
              transcript.results[newpageIndex].words[0].Word
            )
          );
          saveCurrentPageState(resultsindex, 0, index, 0);
        } else {
          saveCurrentPageState(
            resultsindex,
            transcriptindex,
            wordsindex,
            spanindex
          );
          setOldState(newState.data);
          setOldpageindex(pageFlip.current.pageFlip().getCurrentPageIndex());
        }
      }

      // if (oldstate === "user_fold" && newState.data === "read") {
      //   const newpageIndex = pageFlip.current.pageFlip().getCurrentPageIndex();
      //   if (updatedspans.length > 0) {
      //     introRef.current.currentTime = parseFloat(
      //       transcript.results[newpageIndex].words[0].data_start - 1
      //     );

      //     setResultsIndex(newpageIndex);
      //     setStartingWord(transcript.results[newpageIndex].words[0].Word);
      //     const spans = getSpans();
      //     const index = Array.from(spans).findIndex((word) =>
      //       word.textContent.includes(
      //         transcript.results[newpageIndex].words[0].Word
      //       )
      //     );
      //     setTranscriptIndex(0);
      //     setSpanindex(0);
      //     setWordsIndex(index);
      //   }
      // }
      if (
        oldstate === "user_fold" &&
        newState.data === "read" &&
        oldpageindex !== newpageIndex
      ) {
        flippingRef.current.play();
      }
    } else {
      console.log("in");
      introRef.current.currentTime = introRef.current.duration;
      if (playing) {
        setDisable(!disable);
        setPlaying(!playing);
      }
    }
  }

  function getOffset(el) {
    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
    };
  }

  const handleClick = (event) => {
    // Get div dimensions and position
    const divElement = event.target;
    if (
      divElement.className === "wrap-wrapper" ||
      divElement.className === "react-pdf__Document"
    ) {
      const rect = divElement.getBoundingClientRect();
      const offset = getOffset(divElement);

      // Get click coordinates relative to the div
      const clickX = event.clientX - offset.left;
      const clickY = event.clientY - offset.top;

      // Set the corner threshold (e.g., 20 pixels)
      const cornerThreshold = 100;

      // Check if the click is within a certain corner
      if (clickX <= cornerThreshold) {
        flipPrevPage();
      } else if (clickX >= rect.width - cornerThreshold) {
        flipNextPage();
      }
    }
  };

  // const handleClick = (e) => {
  //   const { clientX, clientY } = e;
  //   console.log(e)
  //   // if(clientX>744 && clientY<127){
  //   //   flipNextPage();
  //   // }else if(clientX>744 && clientY>851){
  //   //   flipNextPage();
  //   // }else if(clientX<287 && clientY<106){
  //   //   flipPrevPage();
  //   // }else if(clientX<287 && clientY>851){
  //   //   flipPrevPage();
  //   // }else{

  //   // }
  // };
  const pagesContainerRef = useRef(null);
  const toc = (e) => {
    const target = e.target;
    console.log(target);

    // Check if the clicked element is a specific span
    if (
      target.tagName.toLowerCase() === "span" &&
      target.textContent === "Your Specific Text"
    ) {
      console.log("Clicked on the specific span");
    }
  };
  const [loaded, setLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(false);
  const documentContainerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load the audio and document when the container is in the viewport
            if (introRef.current) {
              introRef.current.src = audio;
            }
            if (flippingRef.current) {
              flippingRef.current.src = flippingPageAudio;
            }
            setIsDocumentVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      }
    );
  
    if (documentContainerRef.current) {
      observer.observe(documentContainerRef.current);
    }
  
    return () => {
      if (documentContainerRef.current) {
        observer.unobserve(documentContainerRef.current);
      }
    };
  }, []);
  useEffect(() => {
  if (!pagesContainerRef.current || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNumber = parseInt(entry.target.getAttribute("data-page-number"), 10);
          if (pageNumber) {
            // Load the page when it's visible
            const pageIndex = pageNumber - 1;
            entry.target.innerHTML = "";
            entry.target.appendChild(pagesContainerRef.current[pageIndex]);
          }
        }
      });
    },
    { threshold: 0.1 }
  );

  pagesContainerRef.current.forEach((container) => {
    observer.observe(container);
  });

  return () => {
    if (pagesContainerRef.current) {
      pagesContainerRef.current.forEach((container) => {
        observer.unobserve(container);
      });
    }
  };
}, [pagesContainerRef]);
  return (
    <div className="App" ref={documentContainerRef}>
      {isDocumentVisible && (
      <Document file={file} onClick={handleClick} onLoadSuccess={handleSuccess} >
        <audio
          ref={introRef}
          onTimeUpdate={() => {
            handleAudioTimeUpdate(
              resultsindex,
              alternativeindex,
              transcriptindex
            );
          }}
          onError={(e) => console.error("Audio error:", e)}
          onProgress={() => setIsBuffering(true)}
          onCanPlayThrough={() => setIsBuffering(false)}
          preload="auto"
        >
          <source src={audio} type="audio/mpeg" />
        </audio>
        <audio
          ref={flippingRef}
          onError={(e) => console.error("Flipping audio error:", e)}
          onCanPlayThrough={() => console.log("Audio can be played through")}
        >
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
        <div className="wrap-wrapper">
          <div className="wrapper">
            <div className="progress-wrapper">
              <div className="bar-wrapper">
                <div className="purple-bar"></div>
                <div
                  className="green-bar"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="playorpause">
                {!playing && (
                  <svg
                    viewBox="0 0 1024 1024"
                    fill="currentColor"
                    height="2em"
                    width="2em"
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
                    height="2em"
                    width="2em"
                    onClick={() => {
                      setPlaying(!playing);
                    }}
                  >
                    <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm-88-532h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8zm224 0h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8z" />
                  </svg>
                )}
              </div>

              <div className="volume">
                {!mute && (
                  <svg
                    style={{ color: "white" }}
                    xmlns="http://www.w3.org/2000/svg"
                    width="1.5em"
                    height="1.5em"
                    fill="currentColor"
                    className="volume bi bi-volume-up"
                    viewBox="0 0 16 16"
                    onClick={() => {
                      setMute(!mute);
                      setoldVolume(volume);
                      introRef.current.volume = 0;
                      setVolume(0);
                    }}
                  >
                    {" "}
                    <path
                      d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"
                      fill="#ffffff"
                    ></path>{" "}
                    <path
                      d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"
                      fill="#ffffff"
                    ></path>{" "}
                    <path
                      d="M10.025 8a4.486 4.486 0 0 1-1.318 3.182L8 10.475A3.489 3.489 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.486 4.486 0 0 1 10.025 8zM7 4a.5.5 0 0 0-.812-.39L3.825 5.5H1.5A.5.5 0 0 0 1 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 7 12V4zM4.312 6.39 6 5.04v5.92L4.312 9.61A.5.5 0 0 0 4 9.5H2v-3h2a.5.5 0 0 0 .312-.11z"
                      fill="#ffffff"
                    ></path>{" "}
                  </svg>
                )}
                {mute && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1.5em"
                    height="1.5em"
                    fill="currentColor"
                    className="volume bi bi-volume-mute"
                    viewBox="0 0 16 16"
                    onClick={() => {
                      setMute(!mute);
                      setVolume(oldvolume);
                      introRef.current.volume = oldvolume;
                    }}
                  >
                    {" "}
                    <path
                      d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM6 5.04 4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96V5.04zm7.854.606a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z"
                      fill="#ffffff"
                    />{" "}
                  </svg>
                )}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volumeRange"
                />
              </div>
            </div>
          </div>
        </div>
        <HTMLFlipBook
          width={width}
          height={height}
          // minWidth={315}
          // maxWidth={1000}
          // minHeight={400}
          // maxHeight={1533}
          mobileScrollSupport={true}
          ref={pageFlip}
          onChangeState={changeTimeOnPageChange}
        >
          {Array.from({ length: numPages }, (_, index) => (
            <div key={`page_${index + 1}`} ref={(el) => (pagesContainerRef.current[index] = el)} className="pagespdf" >
              <ReactPdfPage
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={width}
                height={height}
                className="loading"
                onLoadSuccess={onDocumentLoadSuccess}
                ref={pagesContainerRef}
                onClick={toc}
              />
            </div>
          ))}
        </HTMLFlipBook>
        <div className="placeholder-wrapper">
          <div className={`placeholder ${isLoading ? "loading" : "loaded"}`}>
            {" "}
            <img className="loading" src={loading} alt="Loading..." />{" "}
            <img className="logo" src={logo} alt="DNDCRAFT" />{" "}
          </div>
        </div>
      </Document>
      )}
    </div>
  );
};

export default App;

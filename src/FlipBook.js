import React, { useRef, useState, useEffect, forwardRef } from "react";
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
import HTMLFlipBook from "react-pageflip";
import { Pageview } from "@mui/icons-material";
import loading from "./images/loading.gif";
import logo from "./images/logo.png";
import bookmark from "./images/BookMark.png";

const FlipBook = ({ pdfPath, audioPath, transcriptPath, pdfIndex }) => {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
  const [audio, setAudio] = useState(audioPath);
  const [transcript, setTranscript] = useState(null);

  const [numPages, setNumPages] = useState(3);
  useEffect(() => {
    setNumPages(parseInt(localStorage.getItem(`${pdfIndex}-numPages`)) || 3);
  }, []);

  useEffect(() => {
    const loadTranscript = async () => {
      try {
        const response = await fetch(transcriptPath);
        const data = await response.json();
        setTranscript(data);
      } catch (error) {
        console.error("Error loading transcript:", error);
      }
    };

    loadTranscript();
  }, [transcriptPath]);

  const [file, setFile] = useState(pdfPath);
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
  const [disable, setDisable] = useState(false);
  const pageFlip = useRef(null);
  const [height, setHeight] = useState(1081);

  const [width, setWidth] = useState(700);

  // const handleResize = () => {
  //   const newWidth = window.innerWidth;
  //   if (newWidth > 700) {
  //     setWidth(700);
  //   } else if (newWidth < 400) {
  //     setWidth(400);
  //   } else {
  //     setWidth(newWidth);
  //   }
  //   setHeight(window.innerHeight);
  // };

  // useEffect(() => {
  //   // Call handleResize on mount to set the initial width
  //   handleResize();
  // }, []);

  function flipNextPage() {
    pageFlip.current.pageFlip().flipNext();
    flippingRef.current.play();
    if (
      playing &&
      transcript.results[pageFlip.current.pageFlip().getCurrentPageIndex() + 1]
    ) {
      setPlaying(false);

      setTimeout(() => {
        setPlaying(true);
      }, 2000);
    }
    return true;
  }

  function flipPrevPage() {
    pageFlip.current.pageFlip().flipPrev();
    flippingRef.current.play();
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
        if (
          time >
          parseFloat(
            transcript.results[resultsindex].words[
              transcript.results[resultsindex].words.length - 1
            ].data_end
          )
        ) {
          setResultsIndex(resultsindex + 1);
          setTranscriptIndex(0);
          flipNextPage();
          const index = transcript.results[resultsindex].words.findIndex(
            (word) => word.Word === startingWord
          );
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
          }
        }
      }
    }
    // localStorage.setItem("time",time);
    // localStorage.setItem("transcriptIndex", transcriptindex);
    // localStorage.setItem("spanindex", spanindex);
    // localStorage.setItem("wordsIndex", wordsindex);
    // localStorage.setItem("resultsindex", resultsindex);
  }

  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess() {
    const documentPdf = document.getElementsByClassName("react-pdf__Page");
    const loadingPlaceholder = document.getElementsByClassName("placeholder");
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }
  const effectCalled = useRef(false);

  useEffect(() => {
    if (
      pageFlip.current &&
      introRef.current &&
      !isLoading &&
      !effectCalled.current
    ) {
      if (localStorage.getItem(`${pdfIndex}-pageindex`)) {
        pageFlip.current
          .pageFlip()
          .turnToPage(parseInt(localStorage.getItem(`${pdfIndex}-pageindex`)));
        setResultsIndex(
          parseInt(localStorage.getItem(`${pdfIndex}-resultsindex`))
        );
        setSpanindex(parseInt(localStorage.getItem(`${pdfIndex}-spanindex`)));
        setWordsIndex(parseInt(localStorage.getItem(`${pdfIndex}-wordsIndex`)));
        introRef.current.currentTime = parseFloat(
          localStorage.getItem(`${pdfIndex}-time`)
        );
        setTranscriptIndex(
          parseInt(localStorage.getItem(`${pdfIndex}-transcriptIndex`))
        );
        setDisable(localStorage.getItem(`${pdfIndex}-disabled`) === "true");
        setNumPages(parseInt(localStorage.getItem(`${pdfIndex}-numPages`)));
        // Update the ref to indicate that the effect has been called
        effectCalled.current = true;
      }
    }
  }, [pageFlip.current, introRef.current, isLoading, pdfIndex]);

  const [totalPages, setTotalPages] = useState(null);

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setTotalPages(numPages);
  };

  const goToPrevPage = () =>
    setPageNumber(pageNumber - 1 <= 1 ? 1 : pageNumber - 1);

  const goToNextPage = () =>
    setPageNumber(pageNumber + 1 >= totalPages ? totalPages : pageNumber + 1);

  function updateHighlights(newHighlights) {
    setHighlights(newHighlights);
  }

  const [Page, setPage] = useState([]);
  const handleLoadSuccess = async (pdfDocument) => {
    const newPages = [];
    for (let i = 1; i <= pdfDocument.totalPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      newPages.push({ page, textContent });
    }
    setPage(newPages);
  };

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
    if (
      newState.data === "read" &&
      newpageIndex + 2 > numPages &&
      numPages < totalPages
    ) {
      setNumPages((prevNumPages) => prevNumPages + 1);
    }
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
            transcript.results[newpageIndex].words[0].data_start
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
                    oldPageSpan.style.backgroundColor = "yellow";
                  }
                } else {
                  introRef.current.currentTime = parseFloat(
                    transcript.results[newpageIndex].words[0].data_start
                  );
                  setResultsIndex(newpageIndex);
                  setStartingWord(
                    transcript.results[newpageIndex].words[0].Word
                  );

                  setTranscriptIndex(0);
                  setSpanindex(0);
                  setWordsIndex(index);
                }
              } else {
                introRef.current.currentTime = parseFloat(
                  transcript.results[newpageIndex].words[0].data_start
                );
                setResultsIndex(newpageIndex);
                setStartingWord(transcript.results[newpageIndex].words[0].Word);

                setTranscriptIndex(0);
                setSpanindex(0);
                setWordsIndex(index);
              }
            }
          }
        }
      }

      if (newState.data === "flipping") {
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
    }
    if (
      transcript.results.length >
      pageFlip.current.pageFlip().getCurrentPageIndex()
    ) {
      if (disable) {
        setDisable(!disable);
      }
    } else {
      introRef.current.currentTime = introRef.current.duration;
      if (!disable) {
        setDisable(!disable);
      }
      if (playing) {
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
  let newDivCreated = false;

  // const handleHover = (event) => {
  //   // Get div dimensions and position

  //   const divElement = event.target;

  //   if (
  //     divElement.className === "wrap-wrapper" ||
  //     divElement.className === "react-pdf__Document"
  //   ) {
  //     const outerShadowDiv = document.getElementsByClassName("stf__outerShadow")[0];
  //     const innerShadowDiv = document.getElementsByClassName("stf__innerShadow")[0];
  //     const parentDiv = document.getElementsByClassName("stf__block")[0];
  //     const nextPageDiv = parentDiv.children[pageFlip.current.pageFlip().getCurrentPageIndex()+1];
  //     const rect = divElement.getBoundingClientRect();
  //     const offset = getOffset(divElement);
  //     // Get click coordinates relative to the div
  //     const clickX = event.clientX - offset.left;
  //     const clickY = event.clientY - offset.top;

  //     // Set the corner threshold (e.g., 20 pixels)
  //     const cornerThreshold = 50;

  //     if (clickX >= rect.width - cornerThreshold && event.clientY < 720 && event.clientY > 263) {
  //       console.log("Inside condition, nextPageDiv:", nextPageDiv);
  //       if (!newDivCreated) {

  //         const newDiv = document.createElement('div');

  //         console.log(nextPageDiv);

  //         newDiv.className = 'pagespdf stf__item --soft --right';
  //         newDiv.style.setProperty("display", "block", "important");
  //         newDiv.style.setProperty("z-index", "5", "important");
  //         newDiv.style.setProperty("left", "0px", "important");
  //         newDiv.style.setProperty("top", "0px", "important");
  //         newDiv.style.setProperty("width", "700px", "important");
  //         newDiv.style.setProperty("height", "1081px", "important");
  //         newDiv.style.setProperty("transform-origin", "0px 0px", "important");
  //         newDiv.style.setProperty("clip-path", "polygon(0px 0px, 38.5065px -3.33067e-15px, 24.4675px 1081px, -3.19744e-14px 1081px)", "important");

  //         // Add styles to outerShadowDiv
  //         outerShadowDiv.style.display = "block";
  //         outerShadowDiv.style.zIndex = "10";
  //         outerShadowDiv.style.width = "28.5px";
  //         outerShadowDiv.style.height = "2162px";
  //         outerShadowDiv.style.background = "linear-gradient(to right, rgba(0,0,0,0.945), rgba(0,0,0,0))";
  //         outerShadowDiv.style.transformOrigin = "0px 100px";

  //         outerShadowDiv.style.clipPath = "polygon(-662.438px 913969px, 37.5033px 100.487px, 23.4656px 1181.4px, -676.475px 1172.31px)";

  //         // Add styles to innerShadowDiv
  //         innerShadowDiv.style.display = "block";
  //         innerShadowDiv.style.zIndex = "10";
  //         innerShadowDiv.style.width = "21.375px";
  //         innerShadowDiv.style.height = "2162px";
  //         innerShadowDiv.style.background = "linear-gradient(to left, rgba(0,0,0,0.945) 5%, rgba(0,0,0,0.05) 15%, rgba(0,0,0,0.945) 35%, rgba(0,0,0,0) 100%)";
  //         innerShadowDiv.style.transformOrigin = "0px 100px";

  //         outerShadowDiv.style.clipPath = "polygon(-662.438px 913969px, 37.5033px 100.487px, 23.4656px 1181.4px, -676.475px 1172.31px)";

  //         parentDiv.appendChild(newDiv);
  //         newDivCreated = true;
  //       }
  //       const existingDiv = document.getElementsByClassName("pagespdf stf__item --soft --right")[document.getElementsByClassName("pagespdf stf__item --soft --right").length-1];

  //       if(existingDiv){
  //         existingDiv.style.setProperty("transform", `translate3d(${clickX-25}px, 1px, 0px) rotate(-0.0259726rad)`, "important");
  //         outerShadowDiv.style.transform = `translate3d(${clickX-25}px, -100px, 0px) rotate(6.275rad)`;
  //         innerShadowDiv.style.transform = `translate3d(${clickX-25}px, -100px, 0px) rotate(6.275rad)`;
  //                             //Add styles to nextPageDiv
  //         nextPageDiv.style.setProperty("display", "block", "important");
  //         nextPageDiv.style.setProperty("z-index", "3", "important");
  //         nextPageDiv.style.setProperty("left", "0px", "important");
  //         nextPageDiv.style.setProperty("top", "0px", "important");
  //         nextPageDiv.style.setProperty("width", "700px", "important");
  //         nextPageDiv.style.setProperty("height", "1081px", "important");
  //         nextPageDiv.style.setProperty("transform-origin", "0px 0px", "important");
  //         nextPageDiv.style.setProperty("clip-path", "polygon(670px 0px, 700px 0px, 700px 1081px, 688.213px 1081px, 670.492px 0px)", "important");
  //         nextPageDiv.style.setProperty("transform", "translate3d(0px,0px,0px) rotate(0rad)", "important");
  //       }
  //     } else {
  //       if (newDivCreated) {
  //         const existingDiv = document.getElementsByClassName("pagespdf stf__item --soft --right")[document.getElementsByClassName("pagespdf stf__item --soft --right").length-1];

  //         if (existingDiv) {
  //           outerShadowDiv.style.display = "";
  //           outerShadowDiv.style.zIndex = "";
  //           outerShadowDiv.style.width = "";
  //           outerShadowDiv.style.height = "";
  //           outerShadowDiv.style.background = "";
  //           outerShadowDiv.style.transformOrigin = "";
  //           outerShadowDiv.style.transform = "translate3d(0px, 0px, 0px) rotate(0rad)";
  //           outerShadowDiv.style.clipPath = "";

  //           innerShadowDiv.style.display = "";
  //           innerShadowDiv.style.zIndex = "";
  //           innerShadowDiv.style.width = "";
  //           innerShadowDiv.style.height = "";
  //           innerShadowDiv.style.background = "";
  //           innerShadowDiv.style.transformOrigin = "";
  //           innerShadowDiv.style.transform = "translate3d(0px, 0px, 0px) rotate(0rad)";
  //           innerShadowDiv.style.clipPath = "";

  //           //Add styles to nextPageDiv
  //           nextPageDiv.style.display="none";
  //           nextPageDiv.style.zIndex="";
  //           nextPageDiv.style.left="";
  //           nextPageDiv.style.top="";
  //           nextPageDiv.style.width="";
  //           nextPageDiv.style.height="";
  //           nextPageDiv.style.transformOrigin="";
  //           nextPageDiv.style.clipPath="";
  //           nextPageDiv.style.transform="";

  //         parentDiv.removeChild(existingDiv);
  //         }
  //         newDivCreated = false;
  //       }
  //     }
  //   }
  // };

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
    if (!pagesContainerRef.current || !("IntersectionObserver" in window))
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNumber = parseInt(
              entry.target.getAttribute("data-page-number"),
              10
            );
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

  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const updatePlaybackSpeed = () => {
    const speeds = [0.9, 1, 1.1, 1.2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  useEffect(() => {
    if (introRef.current) {
      introRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const [color, setColor] = useState("#e7be1b");
  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    if (showMessage && isLoading === false) {
      setTimeout(() => setShowMessage(false), 3000);
    }
  }, [showMessage, isLoading]);

  const handleBookmark = () => {
    setColor((prevColor) => {
      if (prevColor === "#e7be1b") {
        // When the user disables the bookmark
        setShowMessage(false);
        return "#ccb96c";
      } else {
        // When the user enables the bookmark
        setShowMessage(true);
        setTimeout(() => setShowMessage(true), 3000); // Hide the message after 3 seconds
        return "#e7be1b";
      }
    });
  };

  const [timeInterval, setTimeInterval] = useState(null);

  useEffect(() => {
    if (playing && color === "#e7be1b") {
      setTimeInterval(
        setInterval(() => {
          localStorage.setItem(
            `${pdfIndex}-time`,
            introRef.current.currentTime
          );
          localStorage.setItem(`${pdfIndex}-transcriptIndex`, transcriptindex);
          localStorage.setItem(`${pdfIndex}-spanindex`, spanindex);
          localStorage.setItem(`${pdfIndex}-wordsIndex`, wordsindex);
          localStorage.setItem(`${pdfIndex}-resultsindex`, resultsindex);
          localStorage.setItem(
            `${pdfIndex}-pageindex`,
            pageFlip.current.pageFlip().getCurrentPageIndex()
          );
          localStorage.setItem(`${pdfIndex}-disabled`, disable);
          localStorage.setItem(`${pdfIndex}-numPages`, numPages);
        }, 500)
      );
    } else {
      clearInterval(timeInterval);
      setTimeInterval(null);
    }
    return () => {
      clearInterval(timeInterval);
    };
  }, [
    playing,
    color,
    transcriptindex,
    spanindex,
    wordsindex,
    resultsindex,
    disable,
    numPages,
  ]);

  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [timerMenuClass, setTimerMenuClass] = useState("timer-dropdown");

  const toggleTimerMenu = () => {
    if (showTimerMenu) {
      setTimerMenuClass("timer-dropdown visible shrinking");
      setTimeout(() => {
        setShowTimerMenu(false);
        setTimerMenuClass("timer-dropdown");
      }, 300);
    } else {
      setShowTimerMenu(true);
      setTimerMenuClass("timer-dropdown visible");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        event.target.closest(".timer-dropdown") ||
        event.target.closest(".sleep-timer")
      )
        return;
      if (timerMenuClass === "timer-dropdown visible") {
        setTimerMenuClass("timer-dropdown visible shrinking");
        setTimeout(() => {
          setShowTimerMenu(false);
          setTimerMenuClass("timer-dropdown");
        }, 300);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [timerMenuClass]);

  const timerRef = useRef(null);

  const startSleepTimer = (timeInSeconds) => {
    if (playing) {
      timerRef.current = setTimeout(() => {
        setPlaying(false);
      }, timeInSeconds * 1000);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  };

  useEffect(() => {
    if (sleepTimer > 0) {
      startSleepTimer(sleepTimer);
    }
  }, [sleepTimer]);

  useEffect(() => {
    if (playing && sleepTimer) {
      startSleepTimer(sleepTimer);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  }, [playing, sleepTimer]);

  useEffect(() => {
    console.log(sleepTimer);
  }, [sleepTimer]);

  return (
    <div className="App" ref={documentContainerRef}>
      {isDocumentVisible && (
        <Document
          file={file}
          onClick={handleClick}
          // onMouseMove={handleHover}
          onLoadSuccess={handleDocumentLoadSuccess}
        >
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
                <div className="bookmark">
                  {/* <svg
                    version="1.1"
                    id="Layer_1"
                    x="0px"
                    y="0px"
                    width="1.5em"
                    height="1.5em"
                    viewBox="0 0 122.88 116.864"
                    enable-background="new 0 0 122.88 116.864"
                    onClick={handleBookmark}
                  >
                    <g>
                      <polygon
                        fillRule="evenodd"
                        clipRule="evenodd"
                        fill={color}
                        points="61.44,0 78.351,41.326 122.88,44.638 88.803,73.491 99.412,116.864 61.44,93.371 23.468,116.864 34.078,73.491 0,44.638 44.529,41.326 61.44,0"
                      />
                    </g>
                  </svg> */}
                  <svg
                    version="1.0"
                    width="1.5em"
                    height="1.5em"
                    viewBox="0 0 100.000000 100.000000"
                    preserveAspectRatio="xMidYMid meet"
                    onClick={handleBookmark}
                  >
                    <g
                      transform="translate(0.000000,100.000000) scale(0.100000,-0.100000)"
                      fill={color}
                      stroke="none"
                    >
                      <path d="M178 893 c-8 -10 -18 -26 -21 -35 -4 -10 -17 -18 -30 -18 -29 0 -47 -18 -47 -47 0 -17 -6 -23 -21 -23 -11 0 -29 -5 -40 -10 -18 -10 -19 -24 -19 -265 l0 -255 25 -16 c19 -12 25 -25 25 -53 0 -20 5 -42 12 -49 8 -8 64 -12 184 -12 140 0 174 -3 184 -15 17 -21 133 -21 150 0 10 12 44 15 189 15 124 0 181 4 189 12 7 7 12 29 12 49 0 20 7 42 15 49 13 10 15 53 15 266 0 274 -2 284 -55 284 -19 0 -24 6 -27 33 -3 32 -4 32 -53 31 -73 -2 -245 -74 -345 -145 -12 -9 -26 -4 -63 21 -42 28 -47 35 -47 70 0 51 -29 83 -103 109 -70 26 -109 27 -129 4z m133 -61 c55 -24 59 -37 59 -212 l0 -114 -28 34 -28 33 -34 -16 c-18 -10 -35 -17 -37 -17 -1 0 -3 66 -3 146 0 128 -2 149 -17 161 -16 13 -15 14 12 9 17 -2 51 -13 76 -24z m-142 -53 l31 -11 0 -144 c0 -163 4 -172 64 -135 l34 22 37 -46 c21 -25 46 -45 56 -45 18 0 19 9 19 126 l0 125 40 -22 40 -23 0 -219 0 -219 -32 20 c-63 39 -156 81 -224 103 -38 11 -76 24 -84 28 -13 7 -15 45 -18 230 -1 121 -1 221 1 221 2 0 18 -5 36 -11z m711 -203 c0 -118 -3 -221 -6 -230 -3 -9 -14 -16 -24 -16 -39 0 -198 -66 -277 -115 l-43 -26 0 218 0 219 63 41 c72 47 227 115 280 122 4 1 7 -95 7 -213z m-800 -61 c0 -234 -5 -221 98 -245 29 -7 52 -14 50 -16 -2 -2 -42 0 -88 4 l-85 7 -3 215 c-2 217 -1 240 18 240 6 0 10 -71 10 -205z m875 -25 l0 -225 -85 -7 c-46 -4 -86 -6 -88 -4 -2 2 21 9 50 16 91 21 88 14 88 247 0 189 1 204 18 201 16 -3 17 -22 17 -228z" />
                    </g>
                  </svg>
                  {/* <img className="loadinggif" style={{width:"1.5em",height:"1.5em",fill:"#cda728"}} src={bookmark} onClick={handleBookmark}alt="Loading..." />{" "} */}
                </div>
                {showMessage && (
                  <div className="bookmark-message">
                    Bookmark is enabled. Your progress will be saved.
                  </div>
                )}
                <div className="sleep-timer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.0"
                    width="1.5em"
                    height="1.5em"
                    viewBox="0 0 100.000000 100.000000"
                    preserveAspectRatio="xMidYMid meet"
                    onClick={toggleTimerMenu}
                  >
                    <g
                      transform="translate(0.000000,100.000000) scale(0.100000,-0.100000)"
                      fill="#ccb96c"
                      stroke="none"
                    >
                      <path d="M240 949 c-248 -166 -293 -529 -95 -756 159 -181 419 -227 635 -112 66 35 135 98 122 111 -5 5 -39 -1 -85 -17 -90 -30 -204 -34 -288 -9 -227 66 -378 303 -339 531 13 82 54 174 99 225 60 68 34 82 -49 27z" />
                      <path d="M514 955 c-8 -31 10 -55 27 -38 14 14 8 55 -8 60 -7 3 -15 -7 -19 -22z" />
                      <path d="M726 898 c-16 -23 -13 -38 8 -38 14 0 38 45 29 54 -11 11 -22 6 -37 -16z" />
                      <path d="M517 844 c-4 -4 -7 -63 -7 -131 0 -99 -3 -125 -15 -129 -8 -3 -48 13 -88 35 -82 45 -100 50 -95 24 2 -10 37 -36 78 -58 58 -33 76 -48 82 -71 15 -56 63 -70 103 -29 32 31 32 59 0 91 -23 23 -25 32 -27 146 -3 113 -10 142 -31 122z" />
                      <path d="M874 746 c-14 -11 -16 -18 -8 -26 15 -15 54 4 54 25 0 19 -21 19 -46 1z" />
                      <path d="M920 531 c0 -17 6 -21 31 -21 24 0 30 4 27 18 -2 10 -14 18 -31 20 -22 3 -27 -1 -27 -17z" />
                      <path d="M865 340 c-8 -13 1 -27 26 -40 27 -15 39 16 13 35 -23 17 -31 18 -39 5z" />
                    </g>
                  </svg>
                </div>
                <div className={timerMenuClass}>
                  <div
                    onClick={() => {
                      if (
                        introRef.current.currentTime !==
                        introRef.current.duration
                      ) {
                        setSleepTimer(300);
                        setTimeout(() => {
                          setPlaying(true);
                        }, 200);
                      }
                      toggleTimerMenu();
                    }}
                  >
                    5 minutes
                  </div>
                  <div
                    onClick={() => {
                      if (
                        introRef.current.currentTime !==
                        introRef.current.duration
                      ) {
                        setSleepTimer(600);
                        setTimeout(() => {
                          setPlaying(true);
                        }, 200);
                      }
                      toggleTimerMenu();
                    }}
                  >
                    10 minutes
                  </div>
                  <div
                    onClick={() => {
                      if (
                        introRef.current.currentTime !==
                        introRef.current.duration
                      ) {
                        setSleepTimer(900);
                        setTimeout(() => {
                          setPlaying(true);
                        }, 200);
                      }
                      toggleTimerMenu();
                    }}
                  >
                    15 minutes
                  </div>
                  <div
                    onClick={() => {
                      if (
                        introRef.current.currentTime !==
                        introRef.current.duration
                      ) {
                        setSleepTimer(1800);
                        setTimeout(() => {
                          setPlaying(true);
                        }, 200);
                      }
                      toggleTimerMenu();
                    }}
                  >
                    30 minutes
                  </div>
                  <div
                    onClick={() => {
                      if (
                        introRef.current.currentTime !==
                        introRef.current.duration
                      ) {
                        setSleepTimer(3600);
                        setTimeout(() => {
                          setPlaying(true);
                        }, 200);
                      }
                      toggleTimerMenu();
                    }}
                  >
                    60 minutes
                  </div>
                </div>

                <div className="speed-control">
                  <button
                    onClick={updatePlaybackSpeed}
                    className="playback"
                  >{`${playbackSpeed.toFixed(1)}x`}</button>
                </div>

                <div className="playorpause">
                  {!playing && (
                    <span className="icon-container">
                      <svg
                        viewBox="0 0 1024 1024"
                        fill="#3c3b94"
                        style={{ fill: "#3c3b94 !important" }}
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
                    </span>
                  )}
                  {playing && (
                    <span className="icon-container">
                      <svg
                        viewBox="0 0 1024 1024"
                        fill="#3c3b94"
                        style={{ fill: "#3c3b94 !important" }}
                        height="2em"
                        width="2em"
                        onClick={() => {
                          setPlaying(!playing);
                        }}
                      >
                        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm-88-532h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8zm224 0h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8z" />
                      </svg>
                    </span>
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
                        fill="#ccb96c"
                      ></path>{" "}
                      <path
                        d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"
                        fill="#ccb96c"
                      ></path>{" "}
                      <path
                        d="M10.025 8a4.486 4.486 0 0 1-1.318 3.182L8 10.475A3.489 3.489 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.486 4.486 0 0 1 10.025 8zM7 4a.5.5 0 0 0-.812-.39L3.825 5.5H1.5A.5.5 0 0 0 1 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 7 12V4zM4.312 6.39 6 5.04v5.92L4.312 9.61A.5.5 0 0 0 4 9.5H2v-3h2a.5.5 0 0 0 .312-.11z"
                        fill="#ccb96c"
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
                        fill="#ccb96c"
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
              <div
                key={`page_${index + 1}`}
                ref={(el) => (pagesContainerRef.current[index] = el)}
                className="pagespdf"
              >
                <ReactPdfPage
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={width}
                  height={height}
                  className="loading"
                  onLoadSuccess={
                    index + 1 === numPages ? onDocumentLoadSuccess : null
                  }
                  ref={pagesContainerRef}
                  onClick={toc}
                />
              </div>
            ))}
          </HTMLFlipBook>
        </Document>
      )}
      <div className="placeholder-wrapper">
        <div
          className={`placeholder ${isLoading ? "loading" : "loaded"}`}
          style={{ width: isLoading ? `${width}px` : `${width}px` }}
        >
          {" "}
          <img className="loadinggif" src={loading} alt="Loading..." />{" "}
          <img className="logo" src={logo} alt="DNDCRAFT" />{" "}
        </div>
      </div>
    </div>
  );
};

export default FlipBook;

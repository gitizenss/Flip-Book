import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import FlipBook from "./FlipBook";
import reportWebVitals from "./reportWebVitals";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import pdfRoutes from "./pdfRoutes";

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <div>
        {/* Your navigation or other components */}
        <Switch>
          {pdfRoutes.map((route, index) => (
            <Route key={index} path={route.path} render={() => <FlipBook pdfPath={route.pdfPath} audioPath={route.audioPath} transcriptPath={route.transcriptPath} pdfIndex={index} />} />
          ))}
        </Switch>
      </div>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

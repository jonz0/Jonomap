import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";

/* Area for mounting/rendering the main TodoList component in the root element. */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

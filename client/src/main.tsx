import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/focusStyles.css";
import { registerServiceWorker } from "./lib/serviceWorker";
import { initRUM } from "./utils/performance";

createRoot(document.getElementById("root")!).render(<App />);

registerServiceWorker();
initRUM();

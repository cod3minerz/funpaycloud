import { createRoot } from "react-dom/client";
import RouterApp from "./router.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<RouterApp />);

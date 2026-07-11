import "@/App.css";
import { ReactLenis } from "lenis/react";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";

function App() {
  return (
    <ReactLenis root options={{ lerp: 0.09, duration: 1.2, smoothWheel: true }}>
      <div className="App noise-overlay antialiased">
        <Landing />
        <Toaster position="bottom-right" />
      </div>
    </ReactLenis>
  );
}

export default App;

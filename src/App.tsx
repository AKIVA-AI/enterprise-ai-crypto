import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Agents from "./pages/Agents";
import Strategies from "./pages/Strategies";
import Execution from "./pages/Execution";
import Risk from "./pages/Risk";
import Launch from "./pages/Launch";
import Treasury from "./pages/Treasury";
import Observability from "./pages/Observability";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/strategies" element={<Strategies />} />
          <Route path="/execution" element={<Execution />} />
          <Route path="/risk" element={<Risk />} />
          <Route path="/launch" element={<Launch />} />
          <Route path="/treasury" element={<Treasury />} />
          <Route path="/observability" element={<Observability />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

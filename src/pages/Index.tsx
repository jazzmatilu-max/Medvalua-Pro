import { AppProvider } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";

const Index = () => (
  <AppProvider>
    <AppLayout />
  </AppProvider>
);

export default Index;

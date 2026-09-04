import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import FortunePage from "@/pages/FortunePage/FortunePage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<FortunePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

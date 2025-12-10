import { useState } from "react";
import Stage0Input from "./components/Stage0Input";
import Stage1Results from "./components/Stage1Results";
import Stage2Results from "./components/Stage2Results";
import Stage3Comparison from "./components/Stage3Comparison";
import { generateStage1WithGemini, extractISQWithGemini } from "./utils/api";
import { generateExcelFile } from "./utils/excel";
import type { InputData, Stage1Output, ISQ } from "./types";

type Stage = "stage0" | "stage1" | "stage2" | "stage3";

function App() {
  const [stage, setStage] = useState<Stage>("stage0");
  const [inputData, setInputData] = useState<InputData | null>(null);
  const [stage1Data, setStage1Data] = useState<Stage1Output | null>(null);
  const [isqs, setIsqs] = useState<{ config: ISQ; keys: ISQ[]; buyers: ISQ[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStage0Submit = async (data: InputData) => {
    setInputData(data);
    setLoading(true);
    setError("");

    try {
      const result = await generateStage1WithGemini(data);
      setStage1Data(result);
      setStage(stage1Data ? "stage1" : "stage0");
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStage1Next = async () => {
    if (!inputData || !stage1Data) return;

    setLoading(true);
    setError("");

    try {
      const result = await extractISQWithGemini(inputData, inputData.urls);
      setIsqs(result);
      setStage("stage2");
    } catch (err) {
      setError(`Error extracting ISQs: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (stage1Data && isqs) {
      generateExcelFile(stage1Data, isqs);
    }
  };

  const handleComparison = () => {
    setStage("stage3");
  };

  const handleBackFromComparison = () => {
    setStage("stage2");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md z-50">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="min-h-screen">
        {stage === "stage0" && <Stage0Input onSubmit={handleStage0Submit} loading={loading} />}

        {stage === "stage1" && stage1Data && (
          <Stage1Results data={stage1Data} onNext={handleStage1Next} loading={loading} />
        )}

        {stage === "stage2" && isqs && (
          <Stage2Results
            isqs={isqs}
            onDownloadExcel={handleDownloadExcel}
            onComparison={handleComparison}
            loading={loading}
          />
        )}

        {stage === "stage3" && stage1Data && (
          <Stage3Comparison chatgptData={stage1Data} onBack={handleBackFromComparison} />
        )}
      </div>
    </div>
  );
}

export default App;

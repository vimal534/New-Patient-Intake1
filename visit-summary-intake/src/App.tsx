import { Routes, Route } from "react-router-dom";

import Welcome from "./screens/01Welcome";
import Reason from "./screens/02Reason";
import Symptom from "./screens/03Symptom";
import SymptomFollowUp from "./screens/04SymptomFollowUp";
import SymptomSummary from "./screens/05SymptomSummary";
import Health from "./screens/06Health";
import HealthChanged from "./screens/07HealthChanged";
import HealthAdd from "./screens/08HealthAdd";
import HealthConfirm from "./screens/09HealthConfirm";
import HealthCheckin from "./screens/10HealthCheckin";
import HealthSummary from "./screens/11HealthSummary";
import Details from "./screens/12Details";
import Coverage from "./screens/13Coverage";
import CoverageScan from "./screens/14CoverageScan";
import CoverageCapture from "./screens/15CoverageCapture";
import CoverageProcessing from "./screens/16CoverageProcessing";
import CoverageVerify from "./screens/17CoverageVerify";
import CoverageResult from "./screens/18CoverageResult";
import Payment from "./screens/19Payment";
import PaymentProcessing from "./screens/20PaymentProcessing";
import PaymentSuccess from "./screens/21PaymentSuccess";
import Consents from "./screens/22Consents";
import Summary from "./screens/23Summary";
import Done from "./screens/24Done";

export default function App() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-xl">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/reason" element={<Reason />} />
        <Route path="/symptom" element={<Symptom />} />
        <Route path="/symptom/follow-up" element={<SymptomFollowUp />} />
        <Route path="/symptom/summary" element={<SymptomSummary />} />
        <Route path="/health" element={<Health />} />
        <Route path="/health/changed" element={<HealthChanged />} />
        <Route path="/health/add" element={<HealthAdd />} />
        <Route path="/health/confirm" element={<HealthConfirm />} />
        <Route path="/health/checkin" element={<HealthCheckin />} />
        <Route path="/health/summary" element={<HealthSummary />} />
        <Route path="/details" element={<Details />} />
        <Route path="/coverage" element={<Coverage />} />
        <Route path="/coverage/scan" element={<CoverageScan />} />
        <Route path="/coverage/capture" element={<CoverageCapture />} />
        <Route path="/coverage/processing" element={<CoverageProcessing />} />
        <Route path="/coverage/verify" element={<CoverageVerify />} />
        <Route path="/coverage/result" element={<CoverageResult />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment/processing" element={<PaymentProcessing />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/consents" element={<Consents />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/done" element={<Done />} />
      </Routes>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function JudgeGuidePage() {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-mono text-canara-primary mb-2">Canara Bank SuRaksha Hackathon 2.0</h1>
        <h2 className="text-2xl text-gray-600">Judge Testing Guide / Demo Script</h2>
        <p className="mt-4 text-gray-500">Welcome, Judge! Here is your step-by-step guide to evaluating the SuRaksha MAPS v4.0 system.</p>
      </div>

      <Card className="border-l-4 border-canara-primary border-t-0 border-r-0 border-b-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">1. Pre-filled Demo Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
            <p><strong className="text-blue-600">Admin/Compliance:</strong> EMP-COMP-001 / Suresh Iyer / password: Demo@123</p>
            <p><strong className="text-blue-600">Department User (IT):</strong> EMP-INFOSEC-002 / Rahul Mehta / password: Demo@123</p>
            <p><strong className="text-blue-600">CISO:</strong> EMP-INFOSEC-001 / Priya Nair / password: Demo@123</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-canara-secondary opacity-10 rounded-bl-full"></div>
        <CardHeader>
          <CardTitle className="text-xl">2. Step-by-Step Testing Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-4 text-gray-800 ml-4">
            <li className="pl-2">
              <strong className="text-canara-primary">Enrollment & Auth:</strong> Go to <a href="/auth/register" className="text-blue-500 hover:underline">/auth/register</a> → Complete behavioral enrollment. Notice the keystroke/timing extraction happening underneath.
            </li>
            <li className="pl-2">
              <strong className="text-canara-primary">Session Health:</strong> Login and navigate around. Watch the session health badge monitor your behavioral biometrics dynamically.
            </li>
            <li className="pl-2">
              <strong className="text-canara-primary">Ingestion:</strong> Upload a circular at <a href="/watcher/upload" className="text-blue-500 hover:underline">/watcher/upload</a>. Watch the mock parser break it into clauses.
            </li>
            <li className="pl-2">
              <strong className="text-canara-primary">Gap Detection:</strong> Review gaps at <a href="/gaps" className="text-blue-500 hover:underline">/gaps</a>. Open a suspected gap to see the AI's NLP explanation and Atlas vector match confidence.
            </li>
            <li className="pl-2">
              <strong className="text-canara-primary">Triage & Routing:</strong> Approve a gap MAP at <a href="/admin/validation" className="text-blue-500 hover:underline">Triage Dashboard</a>. See it assigned automatically to IT/InfoSec.
            </li>
            <li className="pl-2">
              <strong className="text-canara-primary">Department Action:</strong> Switch to <a href="/dept/team" className="text-blue-500 hover:underline">Department Board</a>. View the MAP kanban and upload mock evidence (e.g., config.json).
            </li>
            <li className="pl-2">
              <strong className="text-canara-primary">Re-Authentication:</strong> Mark the MAP complete. Notice the system forces a behavioral context re-auth (Continuous Authentication).
            </li>
            <li className="pl-2">
              <strong className="text-canara-primary">Golden Thread:</strong> View the full provenance at <a href="/audit/golden-thread/MAP-2026-013" className="text-blue-500 hover:underline">/audit/golden-thread</a>. Verify the tamper-evident hash chain linking Circular → Clause → Gap → MAP → Dept → Evidence → Validation.
            </li>
            <li className="pl-2">
              <strong className="text-canara-primary">Governance:</strong> Visit the <a href="/admin" className="text-blue-500 hover:underline">Admin Control Tower</a> for executive metrics, Graph Health, and UX Friction controls.
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-canara-primary text-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">3. What Judges Should Look For (Differentiators)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 list-disc list-inside">
            <li><strong>Continuous Behavioral Auth:</strong> Not just a login check. It actively monitors typing speed, error rates, and flight paths during critical actions (like marking a MAP complete).</li>
            <li><strong>The "Golden Thread":</strong> Unbreakable provenance. We don't just log actions; we blockchain-hash them (`tamper_evident_hash` = Hash(Prev Block + Current Payload)). Perfect for RBI audits.</li>
            <li><strong>Explainable AI in Triage:</strong> The UI explicitly reveals *why* a gap was detected (Atlas search scores, NLP keyword matching) so humans retain ultimate agency.</li>
            <li><strong>UX Friction Tuning:</strong> Admins can adjust the behavioral strictness slider per-department to balance security vs operational friction based on risk exposure.</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="flex justify-center mt-8">
         <button className="bg-canara-secondary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-green-600 transition-all hover:scale-105" onClick={() => navigate('/')}>
           Let's Begin the Demo
         </button>
      </div>
    </div>
  );
}

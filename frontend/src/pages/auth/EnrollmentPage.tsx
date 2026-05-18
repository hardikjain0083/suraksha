import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Target } from 'lucide-react';
import { useBehavioralCapture } from '../../hooks/useBehavioralCapture';
import { ConsentModal } from '../../components/auth/ConsentModal';
import { HardwareTokenFallback } from '../../components/auth/HardwareTokenFallback';
import { QualityScoreGauge } from '../../components/auth/QualityScoreGauge';

export const EnrollmentPage = () => {
  const [stage, setStage] = useState<'consent' | 'round1' | 'round2' | 'round3' | 'success' | 'optout'>('consent');
  const [typedText, setTypedText] = useState('');
  const [qualityScore, setQualityScore] = useState(0);
  
  const { keystrokeData, mouseData, captureKeystrokeDown, captureKeystrokeUp, captureMouse, captureClick, reset } = useBehavioralCapture();

  const standardText = "The RBI mandates that all financial institutions shall implement AES-256 encryption for data at rest by Q2 2026. SEBI Circular 2026/012 requires quarterly vulnerability assessments.";

  // Round 2 Interactive Targets logic
  const [targets, setTargets] = useState<{id: number, x: number, y: number}[]>([]);
  const [clickedTargets, setClickedTargets] = useState<number[]>([]);

  useEffect(() => {
    if (stage === 'round2' && targets.length === 0) {
      // Generate 5 random targets
      const newTargets = Array.from({length: 5}).map((_, i) => ({
        id: i,
        x: Math.floor(Math.random() * 80) + 10, // 10% to 90%
        y: Math.floor(Math.random() * 80) + 10,
      }));
      setTargets(newTargets);
    }
  }, [stage]);

  const handleTargetClick = (e: React.MouseEvent, id: number) => {
    captureClick(e);
    if (!clickedTargets.includes(id)) {
      setClickedTargets(prev => [...prev, id]);
      if (clickedTargets.length + 1 === targets.length) {
        setTimeout(() => setStage('round3'), 1000);
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTypedText(e.target.value);
    
    // Simulate real-time score calculation
    const progress = e.target.value.length / standardText.length;
    setQualityScore(Math.min(progress * 1.2, 0.95)); // Max 0.95 in round 1

    if (e.target.value.length >= standardText.length || e.target.value === standardText) {
      console.log("Round 1 Keystroke Payload:", keystrokeData);
      setQualityScore(1.0);
      setTimeout(() => {
        setStage('round2');
        setTypedText('');
        reset();
      }, 1000);
    }
  };

  const handleRound3Change = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTypedText(e.target.value);
    
    if (e.target.value.length >= standardText.length || e.target.value === standardText) {
      console.log("Round 3 Keystroke Payload:", keystrokeData);
      setQualityScore(0.98); // Perfect consistency mock
      setTimeout(() => setStage('success'), 1500);
    }
  };

  return (
    <div className="min-h-full bg-background flex flex-col items-center py-8 px-4">
      
      <ConsentModal 
        isOpen={stage === 'consent'} 
        onConsent={() => setStage('round1')}
        onOptOut={() => setStage('optout')}
      />

      {stage === 'optout' && (
        <div className="w-full flex justify-center"><HardwareTokenFallback /></div>
      )}

      <AnimatePresence mode="wait">
        {(stage === 'round1' || stage === 'round3') && (
          <motion.div 
            key="typing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl bg-card border rounded-xl p-8 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {stage === 'round1' ? 'Round 1: Baseline Keystroke' : 'Round 3: Consistency Check'}
              </h2>
              <QualityScoreGauge score={qualityScore} />
            </div>

            <div className="p-4 bg-secondary rounded-lg mb-6 text-secondary-foreground font-mono text-sm leading-relaxed select-none">
              {standardText}
            </div>

            <textarea
              className="w-full h-32 p-4 bg-background border rounded-lg focus:ring-2 focus:ring-canara-blue outline-none resize-none font-mono text-sm"
              placeholder="Start typing the text above..."
              value={typedText}
              onChange={stage === 'round1' ? handleTextChange : handleRound3Change}
              onKeyDown={captureKeystrokeDown}
              onKeyUp={captureKeystrokeUp}
            />

            <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
              <span>Progress: {Math.round((typedText.length / standardText.length) * 100)}%</span>
              <span>{keystrokeData.totalKeys} keys captured</span>
            </div>
          </motion.div>
        )}

        {stage === 'round2' && (
          <motion.div 
            key="mouse"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-2xl bg-card border rounded-xl p-8 shadow-sm"
            onMouseMove={captureMouse}
          >
            <h2 className="text-2xl font-bold mb-2">Round 2: Mouse Dynamics</h2>
            <p className="text-muted-foreground mb-6">Move your mouse naturally across this area. Click all target circles as they appear.</p>
            
            <div className="relative w-full h-[400px] bg-secondary/50 rounded-lg border-2 border-dashed border-muted overflow-hidden">
              {targets.map((target) => (
                <motion.button
                  key={target.id}
                  onClick={(e) => handleTargetClick(e, target.id)}
                  className={`absolute w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    clickedTargets.includes(target.id) ? 'bg-canara-green scale-0' : 'bg-canara-blue hover:bg-canara-blue/80'
                  }`}
                  style={{ left: `${target.x}%`, top: `${target.y}%` }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {!clickedTargets.includes(target.id) && <Target className="w-6 h-6 text-white" />}
                </motion.button>
              ))}
              
              {/* Subtle mouse trail visualization */}
              {mouseData.trajectory.slice(-20).map((point, i) => (
                <div 
                  key={point.timestamp}
                  className="absolute w-2 h-2 bg-canara-orange/30 rounded-full pointer-events-none"
                  style={{ 
                    left: point.x - (window.innerWidth/2 - 336), // Approximate offset for demo
                    top: point.y - (window.innerHeight/2 - 200),
                    opacity: i / 20
                  }}
                />
              ))}
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Targets clicked: {clickedTargets.length} / {targets.length}
            </div>
          </motion.div>
        )}

        {stage === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center p-8 bg-card border rounded-xl shadow-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <CheckCircle2 className="w-24 h-24 text-canara-green mb-6" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">Enrollment Complete!</h2>
            <p className="text-muted-foreground mb-8 max-w-md">Your behavioral signature has been successfully registered and encrypted.</p>
            <a 
              href="/auth/login" 
              className="px-8 py-3 bg-canara-blue text-white rounded-lg font-medium hover:bg-canara-blue/90 transition-colors"
            >
              Return to Login
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, Activity, Mic, MicOff, Calendar, List, AlertCircle, Info } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import StressLevelChart from './charts/StressLevelChart';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

const StressMonitor = () => {
  const { 
    dailyData, 
    currentDay, 
    detectStressFromInteraction, 
    getSuggestedExercise,
    updateStressLevel
  } = useAppStore();
  
  const { transcript, isListening, startListening, stopListening, error: speechError } = useSpeechRecognition();
  
  const [demoMode, setDemoMode] = useState(false);
  const [showVoiceAnalysis, setShowVoiceAnalysis] = useState(false);
  const [voiceAnalysisResult, setVoiceAnalysisResult] = useState(null);
  const [stressFactors, setStressFactors] = useState([]);
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [typingPattern, setTypingPattern] = useState('normal');
  const typingAreaRef = useRef(null);
  
  // Today's data
  const todayData = dailyData[currentDay] || {
    screenTime: [],
    totalScreenTime: 0,
    workHours: 0,
    stressLevel: 30
  };
  
  // Initialize stress factors
  useEffect(() => {
    setStressFactors([
      { 
        id: 'typing', 
        name: 'Typing Pattern', 
        level: Math.floor(Math.random() * 40) + 10,
        contribution: 'low'
      },
      { 
        id: 'meetings', 
        name: 'Meeting Overload', 
        level: Math.floor(Math.random() * 60) + 20,
        contribution: 'medium'
      },
      { 
        id: 'screentime', 
        name: 'Extended Screen Time', 
        level: todayData.totalScreenTime > 360 ? 70 : 30,
        contribution: todayData.totalScreenTime > 360 ? 'high' : 'low'
      },
      { 
        id: 'multitasking', 
        name: 'Multitasking', 
        level: Math.floor(Math.random() * 50) + 30,
        contribution: 'medium'
      },
    ]);
  }, [todayData.totalScreenTime]);
  
  // Detect typing patterns for stress
  const handleTyping = (e) => {
    // Simple typing speed calculation
    const text = e.target.value;
    const words = text.split(' ').length;
    setTypingSpeed(words);
    
    // Random pattern detection (in a real app, this would use ML)
    const patterns = ['normal', 'erratic', 'slow', 'rushed'];
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    setTypingPattern(randomPattern);
    
    // Detect stress from typing (simulation)
    if (demoMode && text.length % 15 === 0 && text.length > 0) {
      const stressIncrease = detectStressFromInteraction({ type: 'typing', pattern: randomPattern });
      console.log(`Detected stress increase: ${stressIncrease}%`);
    }
  };
  
  // Analyze voice stress (simulated)
  const analyzeVoice = () => {
    if (isListening) {
      stopListening();
      
      // Simulate voice analysis (in a real app, this would use ML)
      setTimeout(() => {
        const stressScores = {
          pace: Math.floor(Math.random() * 100),
          tone: Math.floor(Math.random() * 100),
          pitch: Math.floor(Math.random() * 100),
          volume: Math.floor(Math.random() * 100)
        };
        
        const averageStress = Math.floor(
          Object.values(stressScores).reduce((sum, score) => sum + score, 0) / Object.values(stressScores).length
        );
        
        setVoiceAnalysisResult({
          scores: stressScores,
          overallScore: averageStress,
          interpretation: averageStress > 70 
            ? 'High stress detected' 
            : averageStress > 40 
              ? 'Moderate stress detected' 
              : 'Low stress detected'
        });
        
        if (demoMode) {
          // Update overall stress level
          updateStressLevel(Math.min(100, todayData.stressLevel + Math.floor(averageStress / 10)));
        }
        
        setShowVoiceAnalysis(true);
      }, 1500);
    } else {
      setShowVoiceAnalysis(false);
      startListening();
    }
  };
  
  // Get stress level description
  const getStressLevelDescription = (level) => {
    if (level > 70) return 'High';
    if (level > 40) return 'Moderate';
    return 'Low';
  };
  
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Stress Monitor</h2>
        <p className="text-muted-foreground">
          Track and manage your stress levels based on behavioral patterns, voice analysis, and screen time.
        </p>
        
        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
          <div className="flex items-center gap-2">
            <Info size={18} />
            <span className="text-sm">Demo Mode: {demoMode ? 'On' : 'Off'}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDemoMode(!demoMode)}
          >
            {demoMode ? 'Turn Off' : 'Turn On'} Demo
          </Button>
        </div>
      </section>
      
      {/* Current Stress Level Card */}
      <Card className={
        todayData.stressLevel > 70 
          ? 'border-2 border-work-300' 
          : todayData.stressLevel > 40 
            ? 'border-2 border-amber-400' 
            : 'border-2 border-life-300'
      }>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={18} />
            Current Stress Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  className="text-secondary stroke-current" 
                  cx="50" cy="50" r="40" 
                  strokeWidth="10" 
                  fill="none"
                />
                <circle 
                  className={`
                    ${todayData.stressLevel > 70 
                      ? 'text-work-300' 
                      : todayData.stressLevel > 40 
                        ? 'text-amber-400' 
                        : 'text-life-300'} 
                    stroke-current
                  `}
                  cx="50" cy="50" r="40" 
                  strokeWidth="10" 
                  strokeDasharray={`${todayData.stressLevel * 2.51} 251`}
                  strokeDashoffset="0" 
                  strokeLinecap="round" 
                  fill="none" 
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold">{todayData.stressLevel}%</span>
                <span className="text-sm text-muted-foreground">
                  {getStressLevelDescription(todayData.stressLevel)}
                </span>
              </div>
            </div>
            
            <div>
              <Badge
                variant={
                  todayData.stressLevel > 70 
                    ? 'work' 
                    : todayData.stressLevel > 40 
                      ? 'balance' 
                      : 'life'
                }
                className="mb-2"
              >
                {getStressLevelDescription(todayData.stressLevel)} Stress
              </Badge>
              <p className="text-sm text-muted-foreground mb-3">
                {todayData.stressLevel > 70 
                  ? 'You might benefit from taking a break and practicing mindfulness.' 
                  : todayData.stressLevel > 40 
                    ? 'Your stress is manageable but keep an eye on it.' 
                    : 'Your stress level is healthy.'
                }
              </p>
              
              {todayData.stressLevel > 60 && (
                <Button variant="life" size="sm">
                  Get Mindfulness Exercise
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StressLevelChart data={dailyData} />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 size={18} />
              Stress Factors
            </CardTitle>
            <CardDescription>
              Sources of stress detected from your activity patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {stressFactors.map(factor => (
                <li key={factor.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{factor.name}</span>
                    <Badge
                      variant={
                        factor.contribution === 'high' 
                          ? 'work' 
                          : factor.contribution === 'medium' 
                            ? 'balance' 
                            : 'secondary'
                      }
                      size="sm"
                    >
                      {factor.contribution.charAt(0).toUpperCase() + factor.contribution.slice(1)}
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        factor.contribution === 'high' 
                          ? 'bg-work-300' 
                          : factor.contribution === 'medium' 
                            ? 'bg-balance-300' 
                            : 'bg-life-300'
                      }`}
                      style={{ width: `${factor.level}%` }}
                    ></div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Stress Detection Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voice Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isListening ? <Mic size={18} className="text-balance-300 animate-pulse" /> : <Mic size={18} />}
              Voice Stress Analysis
            </CardTitle>
            <CardDescription>
              Detect stress levels from your voice patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={analyzeVoice} 
                variant={isListening ? "secondary" : "primary"}
                className="w-full justify-center"
              >
                {isListening ? (
                  <>
                    <MicOff size={18} className="mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic size={18} className="mr-2" />
                    Start Voice Analysis
                  </>
                )}
              </Button>
              
              {isListening && (
                <div className="p-3 border rounded-md bg-secondary/50">
                  <p className="text-sm mb-2">Speak naturally for at least 10 seconds...</p>
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-8 bg-balance-100 dark:bg-balance-300/20 rounded-sm overflow-hidden"
                      >
                        <div 
                          className="h-full bg-balance-300 rounded-sm animate-pulse-gentle"
                          style={{ 
                            height: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 truncate">
                    {transcript || "Listening..."}
                  </p>
                </div>
              )}
              
              {showVoiceAnalysis && voiceAnalysisResult && (
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-3">Voice Analysis Results</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Speaking Pace</span>
                        <span className="text-sm">{voiceAnalysisResult.scores.pace}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="h-2 bg-balance-300 rounded-full"
                          style={{ width: `${voiceAnalysisResult.scores.pace}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Voice Tone</span>
                        <span className="text-sm">{voiceAnalysisResult.scores.tone}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="h-2 bg-balance-300 rounded-full"
                          style={{ width: `${voiceAnalysisResult.scores.tone}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Pitch Variation</span>
                        <span className="text-sm">{voiceAnalysisResult.scores.pitch}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="h-2 bg-balance-300 rounded-full"
                          style={{ width: `${voiceAnalysisResult.scores.pitch}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 rounded-md bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className={
                        voiceAnalysisResult.overallScore > 70 
                          ? 'text-work-300' 
                          : voiceAnalysisResult.overallScore > 40 
                            ? 'text-amber-400' 
                            : 'text-life-300'
                      } />
                      <span className="font-medium">{voiceAnalysisResult.interpretation}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {voiceAnalysisResult.overallScore > 70 
                        ? 'Consider taking a break and practicing some stress-relief exercises.' 
                        : voiceAnalysisResult.overallScore > 40 
                          ? 'Your voice shows signs of moderate stress. Monitor your stress levels.' 
                          : 'Your voice patterns indicate low stress. Keep up the good work!'
                      }
                    </p>
                  </div>
                </div>
              )}
              
              {speechError && (
                <p className="text-sm text-destructive mt-2">
                  Error: {speechError}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Typing Pattern Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List size={18} />
              Typing Pattern Analysis
            </CardTitle>
            <CardDescription>
              Analyze typing patterns to detect stress indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <textarea
                ref={typingAreaRef}
                className="w-full h-32 p-3 border rounded-md bg-background"
                placeholder="Start typing here to analyze your typing patterns..."
                onChange={handleTyping}
              ></textarea>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium mb-1">Typing Speed</div>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold">{typingSpeed}</span>
                    <span className="text-sm text-muted-foreground mb-1">words</span>
                  </div>
                </div>
                
                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium mb-1">Pattern</div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        typingPattern === 'erratic' || typingPattern === 'rushed'
                          ? 'work'
                          : typingPattern === 'slow'
                            ? 'balance'
                            : 'life'
                      }
                    >
                      {typingPattern.charAt(0).toUpperCase() + typingPattern.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Normal:</strong> Consistent rhythm, moderate speed</p>
                <p><strong>Erratic:</strong> Inconsistent pauses, indicates distraction or stress</p>
                <p><strong>Slow:</strong> Extended pauses, may indicate fatigue</p>
                <p><strong>Rushed:</strong> High speed with errors, indicates urgency or anxiety</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Note: In demo mode, typing will simulate stress detection and increase your stress level.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default StressMonitor;

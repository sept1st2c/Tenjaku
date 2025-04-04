
import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Brain, Activity, Timer, BarChart2, AlertCircle } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import ScreenTimeChart from './charts/ScreenTimeChart';
import StressLevelChart from './charts/StressLevelChart';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

const Dashboard = () => {
  const { 
    dailyData, 
    currentDay, 
    isTracking, 
    startTracking, 
    stopTracking,
    switchToBreak,
    switchToWork,
    currentSession,
    sessionStartTime,
    getSuggestedExercise
  } = useAppStore();

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [suggestedExercise, setSuggestedExercise] = useState(null);

  // Today's data
  const todayData = dailyData[currentDay] || {
    screenTime: [],
    totalScreenTime: 0,
    workHours: 0,
    stressLevel: 0,
    focusTime: 0,
    breakTime: 0
  };

  // Update current time and calculate session duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      if (isTracking && sessionStartTime) {
        const elapsed = Math.floor((new Date().getTime() - sessionStartTime) / 1000);
        setTimeElapsed(elapsed);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isTracking, sessionStartTime]);

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  };

  // Stress warning threshold
  const isStressHigh = todayData.stressLevel > 65;

  // Suggest exercise when stress is high
  useEffect(() => {
    if (isStressHigh && !suggestedExercise) {
      setSuggestedExercise(getSuggestedExercise());
    }
  }, [isStressHigh, getSuggestedExercise, suggestedExercise]);

  // Handle dismissing the exercise suggestion
  const handleDismissExercise = () => {
    setSuggestedExercise(null);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Welcome to Balance</h2>
        <p className="text-muted-foreground">
          Your AI-powered Work-Life Balance Assistant. Track your work time, manage stress,
          and optimize your daily schedule for better productivity and wellbeing.
        </p>
      </section>

      {/* Stress Warning Alert */}
      {isStressHigh && suggestedExercise && (
        <div className="bg-work-100 border border-work-300 rounded-lg p-4 animate-fade-in dark:bg-work-400/20">
          <div className="flex gap-3">
            <div className="shrink-0 text-work-500 dark:text-work-200">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-work-500 dark:text-work-200">High stress detected</h3>
              <p className="text-sm text-work-400 dark:text-work-300 mt-1">
                Your stress level is high. Try this mindfulness exercise:
              </p>
              <div className="mt-2 p-3 bg-white/50 dark:bg-black/20 rounded-md">
                <h4 className="font-medium">{suggestedExercise.title} ({suggestedExercise.duration})</h4>
                <p className="text-sm mt-1">{suggestedExercise.description}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button 
                  variant="work" 
                  size="sm" 
                  onClick={() => {
                    if (isTracking) stopTracking();
                    switchToBreak();
                  }}
                >
                  Take a break
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleDismissExercise}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work Tracker Card */}
      <Card className={`border-2 ${currentSession === 'work' ? 'border-work-300' : currentSession === 'break' ? 'border-life-300' : 'border-border'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer size={20} />
            Work Session Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center my-3">
            <div className="text-4xl font-bold font-mono">
              {isTracking ? formatTime(timeElapsed) : '00:00:00'}
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-4">
            {!isTracking ? (
              <Button onClick={startTracking} variant="work">
                Start Working
              </Button>
            ) : (
              <>
                <Button onClick={stopTracking} variant="secondary">
                  Stop
                </Button>
                {currentSession === 'work' ? (
                  <Button onClick={switchToBreak} variant="life">
                    Take a Break
                  </Button>
                ) : (
                  <Button onClick={switchToWork} variant="work">
                    Resume Work
                  </Button>
                )}
              </>
            )}
          </div>
          {currentSession && (
            <div className="mt-4 flex justify-center">
              <Badge 
                variant={currentSession === 'work' ? 'work' : 'life'}
                className="capitalize"
              >
                {currentSession} Session
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} />
              Screen Time Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.floor(todayData.totalScreenTime / 60)}h {todayData.totalScreenTime % 60}m
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {todayData.totalScreenTime > 480 
                ? 'Above recommended limit' 
                : 'Within healthy range'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={18} />
              Stress Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayData.stressLevel}%</div>
            <div className="w-full bg-secondary rounded-full h-2.5 mt-2">
              <div 
                className="h-2.5 rounded-full transition-all duration-500"
                style={{ 
                  width: `${todayData.stressLevel}%`,
                  backgroundColor: todayData.stressLevel > 65 
                    ? '#f87171' 
                    : todayData.stressLevel > 30 
                      ? '#fb923c' 
                      : '#4ade80'
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain size={18} />
              Focus Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.floor(todayData.focusTime / 60)}h {todayData.focusTime % 60}m
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {Math.floor((todayData.focusTime / (todayData.focusTime + todayData.breakTime)) * 100)}% of tracked time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScreenTimeChart data={todayData.screenTime} />
        <StressLevelChart data={dailyData} />
      </div>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="#tasks" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <Calendar size={18} className="mr-2" />
                Manage Tasks
              </Button>
            </a>
            <a href="#focus-tools" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <Brain size={18} className="mr-2" />
                Focus Tools
              </Button>
            </a>
            <a href="#stress-monitor" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <BarChart2 size={18} className="mr-2" />
                View Analytics
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

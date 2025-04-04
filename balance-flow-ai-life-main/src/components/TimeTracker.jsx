
import React, { useState, useEffect } from 'react';
import { Clock, Calendar, BarChart3, PieChart, ArrowUp, ArrowDown, Info, Laptop } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import ScreenTimeChart from './charts/ScreenTimeChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Button from './ui/Button';
import Badge from './ui/Badge';

const TimeTracker = () => {
  const { 
    dailyData, 
    addScreenTime, 
    userData, 
    currentDay 
  } = useAppStore();
  
  const [activeView, setActiveView] = useState('daily');
  const [timeSincePageLoad, setTimeSincePageLoad] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Get today's data
  const todayData = dailyData[currentDay] || {
    screenTime: [],
    totalScreenTime: 0,
    workHours: 0
  };
  
  // Timer to update time spent on this page
  useEffect(() => {
    let timer;
    if (isMonitoring) {
      timer = setInterval(() => {
        setTimeSincePageLoad(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [isMonitoring]);
  
  // Format seconds as HH:MM:SS
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
  
  // Format minutes as Xh Ym
  const formatMinutes = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };
  
  // Start monitoring screen time
  const startMonitoring = () => {
    setIsMonitoring(true);
    setTimeSincePageLoad(0);
  };
  
  // Stop monitoring and record screen time
  const stopMonitoring = () => {
    setIsMonitoring(false);
    const minutesSpent = Math.floor(timeSincePageLoad / 60);
    if (minutesSpent > 0) {
      addScreenTime('Work Apps', minutesSpent);
    }
  };
  
  // Get weekly data for chart
  const getWeeklyData = () => {
    const days = Object.entries(dailyData)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        workTime: data.workHours * 60 || 0,
        screenTime: data.totalScreenTime || 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);
    
    return days;
  };
  
  // Generate app usage data
  const generateAppUsageData = () => {
    // This would be actual app tracking data in a real application
    return [
      { name: 'Productivity Apps', time: 186, category: 'work' },
      { name: 'Communication Tools', time: 120, category: 'work' },
      { name: 'Browser (Work)', time: 95, category: 'work' },
      { name: 'Social Media', time: 62, category: 'personal' },
      { name: 'Entertainment', time: 45, category: 'personal' },
      { name: 'Browser (Personal)', time: 38, category: 'personal' }
    ];
  };
  
  const calculateMaxWorkTime = () => {
    // In minutes
    return userData.maxWorkHours * 60;
  };
  
  const maxWorkTime = calculateMaxWorkTime();
  const appUsageData = generateAppUsageData();
  
  // Check if screen time is excessive
  const isScreenTimeExcessive = todayData.totalScreenTime > 480; // More than 8 hours
  
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Time Tracker</h2>
        <p className="text-muted-foreground">
          Monitor your screen time, track work hours, and maintain a healthy balance between work and rest.
        </p>
      </section>
      
      {/* Daily Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} />
              Total Screen Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.floor(todayData.totalScreenTime / 60)}h {todayData.totalScreenTime % 60}m
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>0h</span>
                <span>{Math.ceil(maxWorkTime / 60)}h (recommended)</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    todayData.totalScreenTime > maxWorkTime 
                      ? 'bg-work-300' 
                      : todayData.totalScreenTime > (maxWorkTime * 0.8) 
                        ? 'bg-amber-400' 
                        : 'bg-life-300'
                  }`}
                  style={{ width: `${Math.min(100, (todayData.totalScreenTime / maxWorkTime) * 100)}%` }}
                ></div>
              </div>
              
              {isScreenTimeExcessive && (
                <p className="text-sm text-work-300 mt-2 flex items-center gap-1">
                  <Info size={14} />
                  Consider taking more breaks from your screen
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={18} />
              Work Hours Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {todayData.workHours.toFixed(1)}h
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>0h</span>
                <span>{userData.maxWorkHours}h (target)</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    todayData.workHours > userData.maxWorkHours 
                      ? 'bg-work-300' 
                      : todayData.workHours > (userData.maxWorkHours * 0.9) 
                        ? 'bg-amber-400' 
                        : 'bg-balance-300'
                  }`}
                  style={{ width: `${Math.min(100, (todayData.workHours / userData.maxWorkHours) * 100)}%` }}
                ></div>
              </div>
              
              {todayData.workHours > userData.maxWorkHours && (
                <p className="text-sm text-work-300 mt-2 flex items-center gap-1">
                  <Info size={14} />
                  You've exceeded your daily work hour target
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop size={18} />
              Current Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-24">
              <p className="text-xl font-bold font-mono">
                {isMonitoring ? formatTime(timeSincePageLoad) : '--:--:--'}
              </p>
              
              <div className="mt-4">
                {!isMonitoring ? (
                  <Button onClick={startMonitoring} variant="balance" size="sm">
                    Start Monitoring
                  </Button>
                ) : (
                  <Button onClick={stopMonitoring} variant="secondary" size="sm">
                    Stop & Record
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Monitors time spent on this page for tracking purposes
          </CardFooter>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScreenTimeChart data={todayData.screenTime} />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={18} />
                Weekly Overview
              </CardTitle>
              <CardDescription>
                Weekly screen time and work hours
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant={activeView === 'daily' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('daily')}
              >
                Daily
              </Button>
              <Button
                variant={activeView === 'weekly' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('weekly')}
              >
                Weekly
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getWeeklyData()}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    tickFormatter={(value) => `${Math.floor(value / 60)}h`} 
                    label={{ 
                      value: 'Hours', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }} 
                  />
                  <Tooltip 
                    formatter={(value) => [
                      `${Math.floor(value / 60)}h ${value % 60}m`, 
                      'Duration'
                    ]}
                  />
                  <Legend />
                  <Bar 
                    dataKey="workTime" 
                    name="Work Time" 
                    fill="#8B5CF6" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="screenTime" 
                    name="Screen Time" 
                    fill="#F97316" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* App Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart size={18} />
            Detailed App Usage
          </CardTitle>
          <CardDescription>
            Breakdown of time spent on different applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">Application</th>
                  <th className="py-3 text-left font-medium">Time Spent</th>
                  <th className="py-3 text-left font-medium">Category</th>
                  <th className="py-3 text-left font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {appUsageData.map((app, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">{app.name}</td>
                    <td className="py-3">{formatMinutes(app.time)}</td>
                    <td className="py-3">
                      <Badge 
                        variant={app.category === 'work' ? 'balance' : 'life'}
                        size="sm"
                        className="capitalize"
                      >
                        {app.category}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {Math.random() > 0.5 ? (
                        <span className="flex items-center text-life-300">
                          <ArrowDown size={16} className="mr-1" />
                          {Math.floor(Math.random() * 20) + 1}%
                        </span>
                      ) : (
                        <span className="flex items-center text-work-300">
                          <ArrowUp size={16} className="mr-1" />
                          {Math.floor(Math.random() * 20) + 1}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-secondary/50">
            <h3 className="font-medium mb-2">AI Insights</h3>
            <p className="text-sm text-muted-foreground">
              You spend most of your screen time on productivity applications, which is good.
              However, consider taking more regular breaks to reduce overall screen time.
              Your productivity appears highest between 9am and 11am.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Healthy Screen Time Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-balance-300">•</span>
              <span>Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-balance-300">•</span>
              <span>Take a 5-10 minute break every hour to stand up, stretch, and move around.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-balance-300">•</span>
              <span>Consider using "Night Light" or blue light filters in the evening to reduce eye strain.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-balance-300">•</span>
              <span>Aim to finish screen-based work at least 1 hour before bedtime for better sleep quality.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTracker;

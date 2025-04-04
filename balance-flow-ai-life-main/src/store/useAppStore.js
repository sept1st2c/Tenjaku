
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper function to get the current day
const getCurrentDay = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

// Initial dummy data for screen time
const initialScreenTimeData = [
  { name: 'Work Apps', value: 240, color: '#8B5CF6' },
  { name: 'Social Media', value: 120, color: '#F97316' },
  { name: 'Entertainment', value: 90, color: '#10B981' },
  { name: 'Other', value: 50, color: '#9CA3AF' },
];

// Helper to create daily dummy data (slight variations per day)
const generateDailyData = () => {
  const today = getCurrentDay();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split('T')[0];
  
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoKey = twoDaysAgo.toISOString().split('T')[0];

  return {
    [today]: {
      screenTime: initialScreenTimeData,
      totalScreenTime: 500,
      workHours: 6.5,
      stressLevel: 42,
      focusTime: 180,
      breakTime: 45,
      tasks: [
        { id: 1, title: 'Prepare project presentation', completed: false, priority: 'high', estimatedTime: 90 },
        { id: 2, title: 'Team sync meeting', completed: true, priority: 'medium', estimatedTime: 60 },
        { id: 3, title: 'Code review', completed: false, priority: 'medium', estimatedTime: 45 },
      ]
    },
    [yesterdayKey]: {
      screenTime: [
        { name: 'Work Apps', value: 260, color: '#8B5CF6' },
        { name: 'Social Media', value: 100, color: '#F97316' },
        { name: 'Entertainment', value: 70, color: '#10B981' },
        { name: 'Other', value: 40, color: '#9CA3AF' },
      ],
      totalScreenTime: 470,
      workHours: 7.2,
      stressLevel: 58,
      focusTime: 210,
      breakTime: 50,
      tasks: [
        { id: 101, title: 'Client call', completed: true, priority: 'high', estimatedTime: 45 },
        { id: 102, title: 'Project planning', completed: true, priority: 'high', estimatedTime: 120 },
        { id: 103, title: 'Email responses', completed: true, priority: 'low', estimatedTime: 30 },
      ]
    },
    [twoDaysAgoKey]: {
      screenTime: [
        { name: 'Work Apps', value: 220, color: '#8B5CF6' },
        { name: 'Social Media', value: 140, color: '#F97316' },
        { name: 'Entertainment', value: 110, color: '#10B981' },
        { name: 'Other', value: 60, color: '#9CA3AF' },
      ],
      totalScreenTime: 530,
      workHours: 6.1,
      stressLevel: 35,
      focusTime: 165,
      breakTime: 55,
      tasks: [
        { id: 201, title: 'Software documentation', completed: true, priority: 'medium', estimatedTime: 180 },
        { id: 202, title: 'Bug fixing', completed: true, priority: 'high', estimatedTime: 90 },
        { id: 203, title: 'Stand-up meeting', completed: true, priority: 'low', estimatedTime: 15 },
      ]
    }
  };
};

// Dummy AI responses
const mindfulnessExercises = [
  { id: 1, title: 'Deep Breathing', description: 'Take 5 deep breaths, inhaling for 4 seconds and exhaling for 6 seconds.', duration: '2 minutes' },
  { id: 2, title: 'Mindful Pause', description: 'Take a moment to pause, close your eyes, and focus on your sensations.', duration: '1 minute' },
  { id: 3, title: 'Desk Stretch', description: 'Stretch your arms, neck, and shoulders to release tension.', duration: '3 minutes' },
  { id: 4, title: 'Gratitude Moment', description: 'Think of three things you are grateful for right now.', duration: '2 minutes' },
  { id: 5, title: 'Eye Rest', description: 'Look away from your screen and focus on an object at least 20 feet away.', duration: '30 seconds' },
];

const focusSchedules = [
  { id: 1, title: 'Classic Pomodoro', work: 25, break: 5, longBreak: 15, rounds: 4 },
  { id: 2, title: 'Extended Focus', work: 50, break: 10, longBreak: 30, rounds: 2 },
  { id: 3, title: 'Short Sprints', work: 15, break: 3, longBreak: 15, rounds: 6 },
];

// Create the store
const useAppStore = create(
  persist(
    (set, get) => ({
      // App theme state
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      
      // User data
      userData: {
        name: 'Alex',
        workStartTime: '09:00',
        workEndTime: '17:00',
        workDaysPerWeek: 5,
        maxWorkHours: 8,
        breakReminders: true,
        focusPreferences: {
          preferredSchedule: 1,
          notificationsWhileWorking: false,
        }
      },
      updateUserData: (data) => set((state) => ({
        userData: { ...state.userData, ...data }
      })),
      
      // Daily data (screen time, tasks, etc.)
      dailyData: generateDailyData(),
      
      // Current day tracking
      currentDay: getCurrentDay(),
      isTracking: false,
      sessionStartTime: null,
      currentSession: null, // 'work', 'break', or null
      
      // Start/stop tracking
      startTracking: () => set({
        isTracking: true,
        sessionStartTime: new Date().getTime(),
        currentSession: 'work'
      }),
      stopTracking: () => set({
        isTracking: false,
        sessionStartTime: null,
        currentSession: null
      }),
      
      // Switch between work and break sessions
      switchToBreak: () => set({
        currentSession: 'break',
        sessionStartTime: new Date().getTime()
      }),
      switchToWork: () => set({
        currentSession: 'work',
        sessionStartTime: new Date().getTime()
      }),
      
      // Add screen time (in real app, this would be tracked automatically)
      addScreenTime: (category, minutes) => {
        const today = getCurrentDay();
        set((state) => {
          const todayData = state.dailyData[today] || {
            screenTime: [],
            totalScreenTime: 0,
            workHours: 0,
            stressLevel: 0
          };
          
          const updatedScreenTime = [...todayData.screenTime];
          const categoryIndex = updatedScreenTime.findIndex(item => item.name === category);
          
          if (categoryIndex >= 0) {
            updatedScreenTime[categoryIndex] = {
              ...updatedScreenTime[categoryIndex],
              value: updatedScreenTime[categoryIndex].value + minutes
            };
          } else {
            updatedScreenTime.push({
              name: category,
              value: minutes,
              color: '#9CA3AF'
            });
          }
          
          return {
            dailyData: {
              ...state.dailyData,
              [today]: {
                ...todayData,
                screenTime: updatedScreenTime,
                totalScreenTime: todayData.totalScreenTime + minutes
              }
            }
          };
        });
      },
      
      // Update stress level
      updateStressLevel: (level) => {
        const today = getCurrentDay();
        set((state) => {
          const todayData = state.dailyData[today] || {
            screenTime: initialScreenTimeData,
            totalScreenTime: 0,
            workHours: 0,
            stressLevel: 0
          };
          
          return {
            dailyData: {
              ...state.dailyData,
              [today]: {
                ...todayData,
                stressLevel: level
              }
            }
          };
        });
      },
      
      // Task management
      addTask: (task) => {
        const today = getCurrentDay();
        set((state) => {
          const todayData = state.dailyData[today] || {
            screenTime: initialScreenTimeData,
            totalScreenTime: 0,
            workHours: 0,
            stressLevel: 0,
            tasks: []
          };
          
          // Create a new task with an ID
          const newTask = {
            id: Date.now(), // Simple ID generation
            ...task,
            completed: false
          };
          
          return {
            dailyData: {
              ...state.dailyData,
              [today]: {
                ...todayData,
                tasks: [...(todayData.tasks || []), newTask]
              }
            }
          };
        });
      },
      toggleTaskCompletion: (taskId) => {
        const today = getCurrentDay();
        set((state) => {
          const todayData = state.dailyData[today];
          if (!todayData || !todayData.tasks) return state;
          
          const updatedTasks = todayData.tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
          );
          
          return {
            dailyData: {
              ...state.dailyData,
              [today]: {
                ...todayData,
                tasks: updatedTasks
              }
            }
          };
        });
      },
      removeTask: (taskId) => {
        const today = getCurrentDay();
        set((state) => {
          const todayData = state.dailyData[today];
          if (!todayData || !todayData.tasks) return state;
          
          return {
            dailyData: {
              ...state.dailyData,
              [today]: {
                ...todayData,
                tasks: todayData.tasks.filter(task => task.id !== taskId)
              }
            }
          };
        });
      },
      
      // AI features - pre-populated dummy data
      mindfulnessExercises,
      getFocusSchedules: () => focusSchedules,
      
      // Get a random mindfulness exercise (simulating AI suggestion)
      getSuggestedExercise: () => {
        const randomIndex = Math.floor(Math.random() * mindfulnessExercises.length);
        return mindfulnessExercises[randomIndex];
      },
      
      // Screen time detection simulation
      detectStressFromInteraction: (interactionData) => {
        // In a real app, this would analyze typing speed, cursor movement, etc.
        // For now, we'll just return a random stress increase
        const stressIncrease = Math.floor(Math.random() * 5) + 1;
        const today = getCurrentDay();
        
        set((state) => {
          const todayData = state.dailyData[today] || {
            screenTime: initialScreenTimeData,
            totalScreenTime: 0,
            workHours: 0,
            stressLevel: 30
          };
          
          const newStressLevel = Math.min(100, todayData.stressLevel + stressIncrease);
          
          return {
            dailyData: {
              ...state.dailyData,
              [today]: {
                ...todayData,
                stressLevel: newStressLevel
              }
            }
          };
        });
        
        return stressIncrease;
      },
      
      // Get AI-generated optimized schedule (dummy implementation)
      getOptimizedSchedule: (tasks) => {
        // In a real app, this would call an AI API
        // For now, return a pre-structured optimized schedule
        const sortedTasks = [...tasks].sort((a, b) => {
          const priorityValue = { high: 3, medium: 2, low: 1 };
          return priorityValue[b.priority] - priorityValue[a.priority];
        });
        
        // Simple alternating pattern of work and breaks
        let scheduledStart = new Date();
        scheduledStart.setHours(9, 0, 0, 0); // Start at 9 AM
        
        return sortedTasks.map(task => {
          const startTime = new Date(scheduledStart);
          const endTime = new Date(startTime.getTime() + task.estimatedTime * 60000);
          const breakTime = new Date(endTime.getTime() + 15 * 60000);
          
          scheduledStart = breakTime;
          
          return {
            ...task,
            scheduledStart: startTime,
            scheduledEnd: endTime,
            breakUntil: breakTime
          };
        });
      }
    }),
    {
      name: 'work-life-balance-storage',
    }
  )
);

export default useAppStore;

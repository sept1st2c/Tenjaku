
import React, { useState } from 'react';
import { PlusCircle, CheckCircle, Circle, Clock, Trash2, Calendar, ListPlus } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';

const TaskManager = () => {
  const { dailyData, currentDay, addTask, toggleTaskCompletion, removeTask, getOptimizedSchedule } = useAppStore();
  
  // State for new task form
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium',
    estimatedTime: 30
  });
  
  // State for showing optimized schedule
  const [showOptimizedSchedule, setShowOptimizedSchedule] = useState(false);
  
  // Get today's tasks
  const todayData = dailyData[currentDay] || { tasks: [] };
  const tasks = todayData.tasks || [];
  
  // Handle input changes for new task
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: name === 'estimatedTime' ? parseInt(value, 10) : value
    });
  };
  
  // Handle add task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.title.trim()) {
      addTask(newTask);
      setNewTask({
        title: '',
        priority: 'medium',
        estimatedTime: 30
      });
    }
  };
  
  // Format time from minutes
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
  };
  
  // Get optimized schedule
  const optimizedSchedule = showOptimizedSchedule ? getOptimizedSchedule(tasks) : [];
  
  // Format schedule time
  const formatScheduleTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Task Manager</h2>
        <p className="text-muted-foreground">
          Track your daily tasks, set priorities, and let the AI optimize your schedule for maximum productivity.
        </p>
      </section>
      
      {/* Add Task Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle size={18} />
            Add New Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Task name
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Enter task name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={newTask.priority}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="estimatedTime" className="block text-sm font-medium mb-1">
                    Time (min)
                  </label>
                  <input
                    type="number"
                    id="estimatedTime"
                    name="estimatedTime"
                    value={newTask.estimatedTime}
                    onChange={handleInputChange}
                    min="5"
                    step="5"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button type="submit">
                Add Task
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={18} />
            Today's Tasks
          </CardTitle>
          <CardDescription>
            {tasks.length > 0 
              ? `You have ${tasks.length} tasks (${tasks.filter(t => t.completed).length} completed)` 
              : 'No tasks for today yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ListPlus size={24} className="mx-auto mb-2" />
              <p>You haven't added any tasks yet</p>
              <p className="text-sm">Add tasks above to get started</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li 
                  key={task.id} 
                  className={`border rounded-lg p-3 flex items-start justify-between gap-2 ${
                    task.completed ? 'bg-secondary/50' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTaskCompletion(task.id)}
                      className="mt-0.5 text-muted-foreground hover:text-foreground"
                    >
                      {task.completed ? (
                        <CheckCircle size={18} className="text-life-300" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                    
                    <div>
                      <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatTime(task.estimatedTime)}
                        </span>
                        <Badge 
                          variant={
                            task.priority === 'high' 
                              ? 'work' 
                              : task.priority === 'medium' 
                                ? 'balance' 
                                : 'secondary'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeTask(task.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {tasks.length > 0 && (
            <div className="mt-6">
              <Button 
                variant="secondary" 
                onClick={() => setShowOptimizedSchedule(!showOptimizedSchedule)}
              >
                {showOptimizedSchedule ? 'Hide' : 'Show'} AI Optimized Schedule
              </Button>
            </div>
          )}
          
          {/* Optimized Schedule */}
          {showOptimizedSchedule && tasks.length > 0 && (
            <div className="mt-6 border rounded-lg p-4 bg-secondary/30">
              <h3 className="font-medium mb-3">AI Optimized Schedule</h3>
              <ul className="space-y-3">
                {optimizedSchedule.map((task) => (
                  <li key={task.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-sm text-muted-foreground font-mono">
                      {formatScheduleTime(task.scheduledStart)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.title}</span>
                        <Badge 
                          variant={
                            task.priority === 'high' 
                              ? 'work' 
                              : task.priority === 'medium' 
                                ? 'balance' 
                                : 'secondary'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Work until {formatScheduleTime(task.scheduledEnd)}, then take a break until {formatScheduleTime(task.breakUntil)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>This schedule is optimized based on your task priorities and estimated durations. 
                It includes appropriate breaks to maximize productivity and minimize stress.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManager;

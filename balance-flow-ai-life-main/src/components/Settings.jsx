
import React, { useState } from 'react';
import { Save, Settings as SettingsIcon, BellRing, Clock, Calendar, Info, Brain } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import Button from './ui/Button';

const Settings = () => {
  const { userData, updateUserData, getFocusSchedules } = useAppStore();
  
  const [formData, setFormData] = useState({ ...userData });
  const [saved, setSaved] = useState(false);
  
  const focusSchedules = getFocusSchedules();
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    });
  };
  
  // Handle nested object changes
  const handleNestedChange = (parentKey, childKey, value) => {
    setFormData({
      ...formData,
      [parentKey]: {
        ...formData[parentKey],
        [childKey]: value
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserData(formData);
    setSaved(true);
    
    // Reset saved status after 3 seconds
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };
  
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Customize your work-life balance assistant to fit your preferences and schedule.
        </p>
      </section>
      
      <form onSubmit={handleSubmit}>
        {/* User Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon size={18} />
              User Profile
            </CardTitle>
            <CardDescription>
              Basic information for personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              
              <div>
                <label htmlFor="maxWorkHours" className="block text-sm font-medium mb-1">
                  Target Work Hours Per Day
                </label>
                <input
                  type="number"
                  id="maxWorkHours"
                  name="maxWorkHours"
                  value={formData.maxWorkHours}
                  onChange={handleInputChange}
                  min="1"
                  max="12"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              
              <div>
                <label htmlFor="workDaysPerWeek" className="block text-sm font-medium mb-1">
                  Work Days Per Week
                </label>
                <input
                  type="number"
                  id="workDaysPerWeek"
                  name="workDaysPerWeek"
                  value={formData.workDaysPerWeek}
                  onChange={handleInputChange}
                  min="1"
                  max="7"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              
              <div>
                <label htmlFor="breakReminders" className="block text-sm font-medium mb-1">
                  Break Reminders
                </label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="breakReminders"
                    name="breakReminders"
                    checked={formData.breakReminders}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="breakReminders" className="ml-2 text-sm">
                    Enable break reminders
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Work Schedule */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={18} />
              Work Schedule
            </CardTitle>
            <CardDescription>
              Define your regular working hours for accurate tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="workStartTime" className="block text-sm font-medium mb-1">
                  Work Start Time
                </label>
                <input
                  type="time"
                  id="workStartTime"
                  name="workStartTime"
                  value={formData.workStartTime}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              
              <div>
                <label htmlFor="workEndTime" className="block text-sm font-medium mb-1">
                  Work End Time
                </label>
                <input
                  type="time"
                  id="workEndTime"
                  name="workEndTime"
                  value={formData.workEndTime}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Focus Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain size={18} />
              Focus Preferences
            </CardTitle>
            <CardDescription>
              Customize your deep work and focus session settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">
                  Preferred Focus Schedule
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {focusSchedules.map(schedule => (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={() => handleNestedChange('focusPreferences', 'preferredSchedule', schedule.id)}
                      className={`border rounded-lg p-3 text-left transition-all ${
                        formData.focusPreferences.preferredSchedule === schedule.id 
                          ? 'border-balance-300 bg-balance-100/50 dark:bg-balance-300/10' 
                          : 'border-border hover:border-balance-200'
                      }`}
                    >
                      <div className="font-medium">{schedule.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {schedule.work}m work / {schedule.break}m break
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.focusPreferences.notificationsWhileWorking}
                    onChange={(e) => handleNestedChange('focusPreferences', 'notificationsWhileWorking', e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="ml-2">Allow notifications during focus time</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing size={18} />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure when and how you receive alerts and reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-medium">Work Hour Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Notify when exceeding daily work hours
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="workHourAlerts"
                    defaultChecked={true}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-medium">Break Reminders</h3>
                  <p className="text-sm text-muted-foreground">
                    Reminder to take breaks during extended work sessions
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="breakReminders"
                    defaultChecked={true}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-medium">Stress Level Warnings</h3>
                  <p className="text-sm text-muted-foreground">
                    Alert when stress levels are detected as high
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="stressWarnings"
                    defaultChecked={true}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Screen Time Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    Daily summary of your screen time usage
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="screenTimeReports"
                    defaultChecked={false}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Data Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info size={18} />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p>
                All your data is stored locally on your device using browser storage. 
                No data is sent to external servers, ensuring your information remains private.
              </p>
              <p>
                You can clear your stored data at any time by clicking the button below.
              </p>
              <div className="pt-2">
                <Button type="button" variant="destructive">
                  Clear All Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" variant="balance" className="min-w-[120px]">
            <Save size={16} className="mr-2" />
            {saved ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

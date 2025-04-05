import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  BrainCircuit,
  Music,
  Volume2,
  Moon,
} from "lucide-react";
import useAppStore from "../store/useAppStore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "./ui/Card";
import Button from "./ui/Button";

const FocusTools = () => {
  const {
    getFocusSchedules,
    isTracking,
    startTracking,
    stopTracking,
    switchToBreak,
    switchToWork,
    currentSession,
  } = useAppStore();

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [noiseSetting, setNoiseSetting] = useState("none");

  const focusSchedules = getFocusSchedules();

  const audioSources = {
    white: "/sounds/white-noise.mp3",
    ambient: "/sounds/ambient-music.mp3",
  };

  const [audio, setAudio] = useState(null);

  useEffect(() => {
    if (activeTimer && noiseSetting !== "none") {
      if (audio) {
        audio.play().catch(console.error);
      }
    } else {
      if (audio) {
        audio.pause();
      }
    }
  }, [activeTimer, noiseSetting, audio]);

  useEffect(() => {
    if (noiseSetting === "none") {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
      return;
    }

    const newAudio = new Audio(audioSources[noiseSetting]);
    newAudio.loop = true;
    newAudio.volume = 0.5;
    setAudio(newAudio);

    return () => {
      newAudio.pause();
    };
  }, [noiseSetting]);

  const [volume, setVolume] = useState(0.5);

  // Initialize with the first focus schedule
  useEffect(() => {
    if (focusSchedules.length > 0 && !selectedSchedule) {
      setSelectedSchedule(focusSchedules[0]);
    }
  }, [focusSchedules, selectedSchedule]);

  // Timer logic
  useEffect(() => {
    let timer;

    if (activeTimer && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (activeTimer && timeRemaining === 0) {
      // Switch between work and break
      if (currentSession === "work") {
        // Check if it's time for a long break
        if (currentRound % selectedSchedule.rounds === 0) {
          setTimeRemaining(selectedSchedule.longBreak * 60);
          switchToBreak();
        } else {
          setTimeRemaining(selectedSchedule.break * 60);
          switchToBreak();
        }
        setCompletedRounds((prev) => prev + 1);
      } else {
        // Back to work session
        setTimeRemaining(selectedSchedule.work * 60);
        switchToWork();
        setCurrentRound((prev) => prev + 1);
      }
    }

    return () => clearInterval(timer);
  }, [
    activeTimer,
    timeRemaining,
    currentSession,
    selectedSchedule,
    currentRound,
    switchToBreak,
    switchToWork,
  ]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Start focus timer
  const startFocusTimer = () => {
    if (!selectedSchedule) return;

    setTimeRemaining(selectedSchedule.work * 60);
    setActiveTimer(true);
    setCurrentRound(1);
    setCompletedRounds(0);
    startTracking();
    switchToWork();
  };

  // Pause timer
  const pauseTimer = () => {
    setActiveTimer(false);
  };

  // Resume timer
  const resumeTimer = () => {
    setActiveTimer(true);
  };

  // Reset timer
  const resetTimer = () => {
    setActiveTimer(false);
    setTimeRemaining(0);
    setCurrentRound(1);
    setCompletedRounds(0);
    stopTracking();
  };

  // Handle schedule selection
  const handleScheduleSelection = (schedule) => {
    if (activeTimer) return; // Don't change while timer is running
    setSelectedSchedule(schedule);
  };

  // Background noise options
  const noiseOptions = [
    { id: "none", label: "None", icon: Moon },
    { id: "white", label: "White Noise", icon: Volume2 },
    { id: "nature", label: "Nature Sounds", icon: Volume2 },
    { id: "ambient", label: "Ambient Music", icon: Music },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Focus Tools</h2>
        <p className="text-muted-foreground">
          Use these AI-powered tools to enhance your focus, productivity, and
          mental clarity.
        </p>
      </section>

      {/* Pomodoro Timer */}
      <Card className="border-2 border-balance-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit size={18} />
            Deep Work Timer
          </CardTitle>
          <CardDescription>
            Based on the Pomodoro Technique to maximize focus and productivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="text-6xl font-bold font-mono my-6">
              {activeTimer ? formatTime(timeRemaining) : "--:--"}
            </div>

            <div className="flex justify-center gap-3 mb-6">
              {!activeTimer && timeRemaining === 0 ? (
                <Button onClick={startFocusTimer} variant="balance" size="lg">
                  <Play size={18} className="mr-2" />
                  Start Focus Session
                </Button>
              ) : activeTimer ? (
                <Button onClick={pauseTimer} variant="secondary" size="lg">
                  <Pause size={18} className="mr-2" />
                  Pause
                </Button>
              ) : (
                <>
                  <Button onClick={resumeTimer} variant="balance" size="lg">
                    <Play size={18} className="mr-2" />
                    Resume
                  </Button>
                  <Button onClick={resetTimer} variant="outline" size="lg">
                    <RotateCcw size={18} className="mr-2" />
                    Reset
                  </Button>
                </>
              )}
            </div>

            {activeTimer && (
              <div className="w-full max-w-md bg-secondary rounded-full h-2.5 mb-4">
                <div
                  className="h-2.5 rounded-full bg-balance-300"
                  style={{
                    width:
                      currentSession === "work"
                        ? `${
                            (1 -
                              timeRemaining / (selectedSchedule?.work * 60)) *
                            100
                          }%`
                        : `${
                            (1 -
                              timeRemaining / (selectedSchedule?.break * 60)) *
                            100
                          }%`,
                  }}
                ></div>
              </div>
            )}

            {activeTimer && (
              <div className="text-sm text-muted-foreground mb-6 flex items-center gap-1">
                <span className="capitalize">{currentSession}</span> session •
                Round {currentRound} • {completedRounds} completed
              </div>
            )}
          </div>

          {/* Focus Schedule Options */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-3">Choose Focus Schedule:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {focusSchedules.map((schedule) => (
                <button
                  key={schedule.id}
                  onClick={() => handleScheduleSelection(schedule)}
                  disabled={activeTimer}
                  className={`border rounded-lg p-3 text-left transition-all ${
                    selectedSchedule?.id === schedule.id
                      ? "border-balance-300 bg-balance-100/50 dark:bg-balance-300/10"
                      : "border-border hover:border-balance-200"
                  } ${activeTimer ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="font-medium">{schedule.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {schedule.work}m work / {schedule.break}m break
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ambient Sounds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 size={18} />
            Focus Sounds
          </CardTitle>
          <CardDescription>
            Background sounds to enhance concentration and mask distractions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {noiseOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setNoiseSetting(option.id)}
                className={`border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${
                  noiseSetting === option.id
                    ? "border-balance-300 bg-balance-100/50 dark:bg-balance-300/10"
                    : "border-border hover:border-balance-200"
                }`}
              >
                <option.icon
                  size={24}
                  className={
                    noiseSetting === option.id ? "text-balance-300" : ""
                  }
                />
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>

          {noiseSetting !== "none" && (
            <div className="mt-6">
              <label
                htmlFor="volume"
                className="block text-sm font-medium mb-2"
              >
                Volume
              </label>
              <input
                type="range"
                id="volume"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => {
                  const newVolume = e.target.value / 100;
                  setVolume(newVolume);
                  if (audio) audio.volume = newVolume;
                }}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Note: These are simulated controls. In a real app, actual audio would
          play.
        </CardFooter>
      </Card>

      {/* Digital Wellbeing Tips */}
      <Card>
        <CardHeader>
          <CardTitle>AI Focus Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle size={18} className="text-balance-300 mt-0.5" />
              <div>
                <p className="font-medium">
                  Block distracting websites during focus sessions
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Consider using browser extensions to limit access to social
                  media during work sessions.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={18} className="text-balance-300 mt-0.5" />
              <div>
                <p className="font-medium">
                  Organize your workspace before starting
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  A clean, organized workspace can reduce cognitive load and
                  improve focus.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={18} className="text-balance-300 mt-0.5" />
              <div>
                <p className="font-medium">
                  Set clear intentions for each focus session
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Before starting, write down exactly what you aim to accomplish
                  in the session.
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default FocusTools;

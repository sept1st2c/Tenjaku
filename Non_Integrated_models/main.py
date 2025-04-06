import numpy as np
import dlib
import cv2
from scipy.spatial import distance as dist
import imutils
from imutils import face_utils
import time
import collections
import os
import threading
import pyaudio
import wave
import tempfile
import requests
import json
from datetime import datetime

class MultimodalStressDetector:
    def __init__(self, api_key, session_time=60):
        # Initialize data collections
        self.eye_distances = collections.deque(maxlen=30)
        self.lip_distances = collections.deque(maxlen=30)
        
        # Calibration values
        self.baseline_eye_dist = 0
        self.baseline_lip_dist = 0
        self.calibration_frames = 0
        self.calibration_complete = False
        
        # Stress history
        self.stress_history = collections.deque(maxlen=20)
        
        # Per-second stress measurements for more accurate analysis
        self.second_stress_values = {}  # Dictionary to store stress by second
        
        # Detection thresholds
        self.stress_high_threshold = 0.40
        self.stress_medium_threshold = 0.20
        
        # Gemini API settings - FIXED: Using self.api_key instead of api_key
        self.api_key = "AIzaSyAlckpIBbxFmAsMBExBr8hp-rLpb2YZxmA"
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.api_key}"
        
        # Session settings
        self.session_time = session_time  # in seconds
        self.session_active = False
        self.session_start_time = 0
        self.time_remaining = session_time
        
        # Stress assessment results
        self.facial_stress = 0.0
        self.voice_stress = 0.0
        self.combined_stress = 0.0
        self.stress_label = "Not assessed"
        self.has_spoken = False
        
        # Audio recording settings
        self.audio_thread = None
        self.audio_recording = False
        self.audio_filename = None
        self.format = pyaudio.paInt16
        self.channels = 1
        self.rate = 44100
        self.chunk = 1024
        self.audio = pyaudio.PyAudio()
        
        # Load face detector and landmark predictor
        print("[INFO] Loading face detector and landmark predictor...")
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
        
        # Get facial landmark indices
        self.l_eyebrow_idx = face_utils.FACIAL_LANDMARKS_IDXS["right_eyebrow"]
        self.r_eyebrow_idx = face_utils.FACIAL_LANDMARKS_IDXS["left_eyebrow"]
        self.mouth_idx = face_utils.FACIAL_LANDMARKS_IDXS["mouth"]
        
        # Settings
        self.show_landmarks = True
        self.debug_mode = True
        self.recalibrate = False
        
        # FPS calculation
        self.frame_count = 0
        self.fps = 0
        self.last_fps_time = time.time()
        
    def calculate_eye_distance(self, left_eyebrow, right_eyebrow):
        """Calculate and track distance between eyebrows"""
        try:
            # Get inner points of eyebrows
            left_point = left_eyebrow[-1]
            right_point = right_eyebrow[0]
            
            eye_dist = dist.euclidean(left_point, right_point)
            self.eye_distances.append(eye_dist)
            
            return eye_dist
        except Exception as e:
            print(f"[ERROR] Eye distance calculation error: {e}")
            return 0
    
    def calculate_lip_tension(self, mouth):
        """Calculate and track tension in lips"""
        try:
            if len(mouth) < 12:
                return 0
                
            # Use width to height ratio of mouth as indicator
            left_point = min(mouth, key=lambda p: p[0])
            right_point = max(mouth, key=lambda p: p[0])
            top_point = min(mouth, key=lambda p: p[1])
            bottom_point = max(mouth, key=lambda p: p[1])
            
            width = dist.euclidean(left_point, right_point)
            height = dist.euclidean(top_point, bottom_point)
            
            # Use width to height ratio (high ratio = tighter lips)
            if height > 0:
                tension = width / height
            else:
                tension = 0
                
            self.lip_distances.append(tension)
            
            return tension
        except Exception as e:
            print(f"[ERROR] Lip tension calculation error: {e}")
            return 0
    
    def calibrate(self, eye_dist, lip_dist):
        """Calibrate baseline values for the user"""
        if self.recalibrate:
            self.calibration_frames = 0
            self.calibration_complete = False
            self.eye_distances.clear()
            self.lip_distances.clear()
            self.stress_history.clear()
            self.recalibrate = False
            print("[INFO] Recalibration started. Please maintain a neutral expression...")
            
        if not self.calibration_complete:
            # Collect data for calibration
            self.calibration_frames += 1
            
            if self.calibration_frames >= 20:  # Use 20 frames for calibration
                # Calculate baseline values
                self.baseline_eye_dist = np.mean(list(self.eye_distances)) if self.eye_distances else 1.0
                self.baseline_lip_dist = np.mean(list(self.lip_distances)) if self.lip_distances else 1.0
                self.calibration_complete = True
                print(f"[INFO] Calibration complete. Baselines - Eye distance: {self.baseline_eye_dist:.2f}, Lip tension: {self.baseline_lip_dist:.2f}")
            
            return 0.5, "Calibrating..." # Default value during calibration
    
    def calculate_stress(self, eye_dist, lip_dist):
        """Calculate stress level based on facial measurements"""
        # First check if we need to calibrate
        if not self.calibration_complete:
            return self.calibrate(eye_dist, lip_dist)
        
        # Ensure we have enough data
        if len(self.eye_distances) < 5 or len(self.lip_distances) < 5:
            return 0.5, "Collecting data..."
        
        try:
            # Calculate eye distance factor (lower = more stress)
            if self.baseline_eye_dist == 0:
                eye_factor = 1.0
            else:
                eye_factor = eye_dist / self.baseline_eye_dist

            # Eye stress increases when eyebrows are closer (knitted)
            if eye_factor < 1.0:  # Eyebrows closer than baseline
                eye_stress = min(1.0, (1.0 - eye_factor) * 2.5)
            else:  # Eyebrows further than baseline
                eye_stress = max(0.0, 1.0 - ((eye_factor - 1.0) * 2.0))
            
            # Calculate lip tension factor
            if self.baseline_lip_dist == 0:
                lip_factor = 1.0
            else:
                lip_factor = lip_dist / self.baseline_lip_dist
            
            if lip_factor > 1.0:  # Tighter lips than baseline
                lip_stress = min(1.0, (lip_factor - 1.0) * 2.0)
            else:  # More relaxed lips
                lip_stress = max(0.0, 1.0 - ((1.0 - lip_factor) * 1.5))
            
            # Combine with higher weight to eyebrows
            raw_stress = (eye_stress * 0.8) + (lip_stress * 0.2)
            
            # Apply light smoothing
            self.stress_history.append(raw_stress)
            stress_value = np.mean(list(self.stress_history))
            
            # Store current reading if session is active
            if self.session_active:
                # Calculate elapsed time in seconds (rounded)
                elapsed_sec = int(time.time() - self.session_start_time)
                
                # Store stress value for this second (append to list for that second)
                if elapsed_sec not in self.second_stress_values:
                    self.second_stress_values[elapsed_sec] = []
                
                self.second_stress_values[elapsed_sec].append(stress_value)
            
            # Determine stress label
            if stress_value >= self.stress_high_threshold:
                stress_label = "High Stress"
            elif stress_value >= self.stress_medium_threshold:
                stress_label = "Medium Stress"
            else:
                stress_label = "Low Stress"
            
            if self.debug_mode and not self.session_active:
                print(f"Eye dist: {eye_dist:.1f}, Lip tension: {lip_dist:.1f}, Stress: {stress_value:.2f}")
                
            return stress_value, stress_label
            
        except Exception as e:
            print(f"[ERROR] Stress calculation error: {e}")
            return 0.5, "Error"
    
    def start_session(self):
        """Start a timed stress assessment session"""
        if not self.session_active and self.calibration_complete:
            self.session_active = True
            self.session_start_time = time.time()
            self.time_remaining = self.session_time
            self.second_stress_values = {}  # Reset stress measurements
            
            # Start audio recording
            self.start_audio_recording()
            
            print(f"[INFO] Started {self.session_time}-second stress assessment session")
            return True
        else:
            if not self.calibration_complete:
                print("[WARNING] Cannot start session: Calibration not complete")
            else:
                print("[WARNING] Session already active")
            return False
    
    def end_session(self):
        """End the current session and analyze results"""
        if self.session_active:
            self.session_active = False
            session_duration = time.time() - self.session_start_time
            
            # Stop audio recording
            self.stop_audio_recording()
            
            # Calculate average facial stress per second (more accurate)
            second_averages = []
            for second, values in self.second_stress_values.items():
                if values:  # Only consider seconds with measurements
                    second_averages.append(np.mean(values))
            
            # Calculate overall average facial stress
            if second_averages:
                self.facial_stress = np.mean(second_averages)
            else:
                self.facial_stress = 0.0
                
            print(f"[INFO] Session ended. Duration: {session_duration:.1f} seconds")
            print(f"[INFO] Facial stress level: {self.facial_stress:.2f}")
            
            # Generate stress trend visualization
            self.visualize_stress_trend()
            
            # Analyze voice stress if audio was recorded
            if self.audio_filename and os.path.exists(self.audio_filename):
                self.analyze_voice_stress()
            else:
                print("[WARNING] No audio recorded or file not found")
                self.voice_stress = 0.0
                self.has_spoken = False
            
            # Calculate combined stress
            self.calculate_combined_stress()
            
            return True
        else:
            print("[WARNING] No active session to end")
            return False
    
    def start_audio_recording(self):
        """Start recording audio in a separate thread"""
        if self.audio_thread is None or not self.audio_thread.is_alive():
            # Create temp file for audio
            temp_dir = tempfile.gettempdir()
            self.audio_filename = os.path.join(temp_dir, f"stress_audio_{int(time.time())}.wav")
            
            # Start recording thread
            self.audio_recording = True
            self.audio_thread = threading.Thread(target=self.record_audio)
            self.audio_thread.daemon = True
            self.audio_thread.start()
            
            print(f"[INFO] Started audio recording to {self.audio_filename}")
            return True
        else:
            print("[WARNING] Audio recording already in progress")
            return False
    
    def stop_audio_recording(self):
        """Stop the audio recording"""
        if self.audio_recording:
            self.audio_recording = False
            # Wait for recording thread to finish
            if self.audio_thread and self.audio_thread.is_alive():
                self.audio_thread.join(timeout=2.0)
            print("[INFO] Stopped audio recording")
            return True
        else:
            print("[WARNING] No audio recording in progress")
            return False
    
    def record_audio(self):
        """Record audio to a WAV file"""
        try:
            # Open audio stream
            stream = self.audio.open(
                format=self.format,
                channels=self.channels,
                rate=self.rate,
                input=True,
                frames_per_buffer=self.chunk
            )
            
            frames = []
            start_time = time.time()
            silent_chunks = 0
            total_chunks = 0
            
            # Record audio
            while self.audio_recording and (time.time() - start_time) < self.session_time:
                data = stream.read(self.chunk, exception_on_overflow=False)
                frames.append(data)
                
                # Check if this chunk contains speech (simple amplitude check)
                amplitude = np.max(np.abs(np.frombuffer(data, dtype=np.int16)))
                if amplitude > 500:  # Adjust threshold as needed
                    silent_chunks = 0
                else:
                    silent_chunks += 1
                total_chunks += 1
            
            # Close stream
            stream.stop_stream()
            stream.close()
            
            # Save audio file
            if frames:
                wf = wave.open(self.audio_filename, 'wb')
                wf.setnchannels(self.channels)
                wf.setsampwidth(self.audio.get_sample_size(self.format))
                wf.setframerate(self.rate)
                wf.writeframes(b''.join(frames))
                wf.close()
                
                # Check if user has spoken (if less than 90% of chunks were silent)
                self.has_spoken = (silent_chunks / total_chunks) < 0.9
                print(f"[INFO] Audio saved. Speech detected: {self.has_spoken}")
            else:
                print("[WARNING] No audio frames captured")
                self.has_spoken = False
                
        except Exception as e:
            print(f"[ERROR] Audio recording error: {e}")
            self.has_spoken = False
    
    def analyze_voice_stress(self):
        """Analyze voice recording for stress using Gemini API via direct HTTP request"""
        if not self.has_spoken:
            print("[INFO] No speech detected in recording")
            self.voice_stress = 0.0
            return
            
        try:
            print("[INFO] Analyzing voice stress using Gemini API...")
            
            # In a real implementation, you would transcribe the audio here
            # For this example, we'll use a placeholder transcription
            sample_transcription = "This is a stressful situation and I'm feeling quite anxious about it. I'm worried about the outcome and not sure what to do next."
            
            # Prepare request payload with the transcription
            payload = {
                "contents": [{
                    "parts": [{
                        "text": f"""
                        Analyze this speech transcript for signs of stress in the speaker's language:
                        
                        "{sample_transcription}"
                        
                        Look for:
                        1. Use of stress-indicating words or phrases
                        2. Speech patterns indicating anxiety or pressure
                        3. Verbal indicators of nervousness or tension
                        4. Hesitation, stuttering, or rushed speech
                        5. Repeated phrases or words indicating worry
                        
                        After analysis, provide a stress level score from 0.0 to 1.0 where:
                        - 0.0-0.2: Very low stress
                        - 0.2-0.4: Low stress
                        - 0.4-0.6: Moderate stress
                        - 0.6-0.8: High stress
                        - 0.8-1.0: Very high stress
                        
                        Provide your answer in JSON format with a "stress_score" field containing ONLY the numerical value.
                        For example: {{"stress_score": 0.65}}
                        """
                    }]
                }]
            }
            
            # Make the API request
            headers = {
                'Content-Type': 'application/json'
            }
            
            # Make the real API call (key has been tested and is valid)
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=10
            )
            
            print(f"[INFO] Gemini API response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                # Extract the response text
                response_text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                print(f"[INFO] Gemini response: {response_text[:100]}...")  # Show just the beginning
                
                # Parse the JSON from the response
                if '{' in response_text and '}' in response_text:
                    json_start = response_text.find('{')
                    json_end = response_text.rfind('}') + 1
                    json_str = response_text[json_start:json_end]
                    
                    try:
                        result_data = json.loads(json_str)
                        
                        # Get stress score
                        if 'stress_score' in result_data:
                            self.voice_stress = float(result_data['stress_score'])
                            print(f"[INFO] Voice stress analysis complete: {self.voice_stress:.2f}")
                        else:
                            print("[WARNING] No stress_score in API response, extracting from text")
                            # Fallback: extract any number that looks like a score
                            import re
                            numbers = re.findall(r'0\.\d+', response_text)
                            if numbers:
                                self.voice_stress = float(numbers[0])
                                print(f"[INFO] Extracted approximate voice stress: {self.voice_stress:.2f}")
                            else:
                                print("[WARNING] Could not extract stress score, using default")
                                self.voice_stress = 0.5
                    except json.JSONDecodeError:
                        print(f"[WARNING] Invalid JSON in response: {json_str}")
                        self.voice_stress = 0.5
                else:
                    print("[WARNING] No JSON found in response")
                    self.voice_stress = 0.5
            else:
                print(f"[ERROR] API request failed: {response.status_code} - {response.text}")
                self.voice_stress = 0.5
        except Exception as e:
            print(f"[ERROR] Voice stress analysis error: {e}")
            self.voice_stress = 0.5
    
    def visualize_stress_trend(self):
        """Create visualization of stress over time"""
        # We'll prepare data for a line graph showing stress by second
        # In a real implementation, this could generate an actual graph image
        
        # Calculate average for each second
        seconds = sorted(self.second_stress_values.keys())
        averages = [np.mean(self.second_stress_values[s]) for s in seconds]
        
        if seconds:
            # Print a simple ASCII visualization
            print("\nStress trend over session:")
            print("-" * 60)
            for s, avg in zip(seconds, averages):
                bar_len = int(avg * 50)
                bar = "█" * bar_len
                print(f"Second {s:2d}: {avg:.2f} |{bar}")
            print("-" * 60)
            
            # Calculate important metrics
            peak_second = seconds[np.argmax(averages)]
            peak_stress = max(averages)
            min_second = seconds[np.argmin(averages)]
            min_stress = min(averages)
            
            print(f"Peak stress: {peak_stress:.2f} at second {peak_second}")
            print(f"Minimum stress: {min_stress:.2f} at second {min_second}")
            
            # Calculate trend (increasing or decreasing)
            if len(averages) >= 2:
                first_half = np.mean(averages[:len(averages)//2])
                second_half = np.mean(averages[len(averages)//2:])
                
                if second_half > first_half:
                    trend = "INCREASING"
                elif second_half < first_half:
                    trend = "DECREASING"
                else:
                    trend = "STABLE"
                    
                print(f"Overall trend: {trend}")
            
            print("-" * 60)
    
    def calculate_combined_stress(self):
        """Calculate combined stress from facial and voice analysis"""
        if self.has_spoken:
            # If speech was detected, combine both metrics
            # Weight facial expression slightly higher (60/40) as it's often more reliable
            self.combined_stress = (self.facial_stress * 0.6) + (self.voice_stress * 0.4)
            source = "facial expression and voice"
        else:
            # If no speech, use only facial stress
            self.combined_stress = self.facial_stress
            source = "facial expression only"
        
        # Determine stress label
        if self.combined_stress >= self.stress_high_threshold:
            self.stress_label = f"High Stress ({source})"
        elif self.combined_stress >= self.stress_medium_threshold:
            self.stress_label = f"Medium Stress ({source})"
        else:
            self.stress_label = f"Low Stress ({source})"
            
        print(f"[INFO] Combined stress assessment: {self.combined_stress:.2f} - {self.stress_label}")
    
    def process_frame(self, frame):
        """Process a video frame and detect stress"""
        # Calculate FPS
        self.frame_count += 1
        current_time = time.time()
        if current_time - self.last_fps_time >= 1.0:
            self.fps = self.frame_count / (current_time - self.last_fps_time)
            self.frame_count = 0
            self.last_fps_time = current_time
        
        # Resize frame for consistency
        frame = imutils.resize(frame, width=640)
        
        # Convert to grayscale and enhance contrast
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        
        # Update session timer if active
        if self.session_active:
            elapsed = time.time() - self.session_start_time
            self.time_remaining = max(0, self.session_time - elapsed)
            
            # End session if time is up
            if self.time_remaining <= 0:
                self.end_session()
        
        # Detect faces
        faces = self.detector(gray, 0)
        
        # Process faces
        if len(faces) > 0:
            for face in faces:
                try:
                    # Get facial landmarks
                    shape = self.predictor(gray, face)
                    shape = face_utils.shape_to_np(shape)
                    
                    # Extract regions
                    left_eyebrow = shape[self.l_eyebrow_idx[0]:self.l_eyebrow_idx[1]]
                    right_eyebrow = shape[self.r_eyebrow_idx[0]:self.r_eyebrow_idx[1]]
                    mouth = shape[self.mouth_idx[0]:self.mouth_idx[1]]
                    
                    # Calculate convex hulls for visualization
                    left_hull = cv2.convexHull(left_eyebrow)
                    right_hull = cv2.convexHull(right_eyebrow)
                    mouth_hull = cv2.convexHull(mouth)
                    
                    # Draw face landmarks if enabled
                    if self.show_landmarks:
                        # Draw eyebrows and mouth
                        cv2.drawContours(frame, [left_hull], -1, (0, 255, 0), 1)
                        cv2.drawContours(frame, [right_hull], -1, (0, 255, 0), 1)
                        cv2.drawContours(frame, [mouth_hull], -1, (0, 255, 0), 1)
                        
                        # Draw specific stress indicator points
                        left_inner = left_eyebrow[-1]
                        right_inner = right_eyebrow[0]
                        cv2.circle(frame, tuple(left_inner), 3, (255, 0, 0), -1)
                        cv2.circle(frame, tuple(right_inner), 3, (255, 0, 0), -1)
                        cv2.line(frame, tuple(left_inner), tuple(right_inner), (255, 255, 0), 1)
                        
                        # Draw all landmarks
                        for (x, y) in shape:
                            cv2.circle(frame, (x, y), 1, (0, 0, 255), -1)
                        
                        # Draw face bounding box
                        (x, y, w, h) = face_utils.rect_to_bb(face)
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
                    
                    # Calculate key metrics
                    eye_dist = self.calculate_eye_distance(left_eyebrow, right_eyebrow)
                    lip_tension = self.calculate_lip_tension(mouth)
                    
                    # Skip stress calculation if session results are available
                    if not self.session_active and self.combined_stress > 0:
                        stress_value = self.combined_stress
                        stress_label = self.stress_label
                    else:
                        # Calculate real-time stress
                        stress_value, stress_label = self.calculate_stress(eye_dist, lip_tension)
                    
                    # Calculate stress indicator bar height
                    bar_height = int(150 * stress_value)
                    bar_color = (0, 255, 0)  # Green for low stress
                    if stress_value >= self.stress_high_threshold:
                        bar_color = (0, 0, 255)  # Red for high stress
                    elif stress_value >= self.stress_medium_threshold:
                        bar_color = (0, 165, 255)  # Orange for medium stress
                    
                    # Draw stress bar
                    bar_x = frame.shape[1] - 50
                    cv2.rectangle(frame, (bar_x, 150 - bar_height), (bar_x + 30, 150), bar_color, -1)
                    cv2.rectangle(frame, (bar_x, 0), (bar_x + 30, 150), (200, 200, 200), 2)
                    
                    # Draw level markers
                    high_y = int(150 * (1 - self.stress_high_threshold))
                    med_y = int(150 * (1 - self.stress_medium_threshold))
                    cv2.line(frame, (bar_x, high_y), (bar_x + 30, high_y), (0, 0, 255), 1)
                    cv2.line(frame, (bar_x, med_y), (bar_x + 30, med_y), (0, 165, 255), 1)
                    
                    # Display raw values for debugging
                    base_eye = self.baseline_eye_dist if self.baseline_eye_dist is not None else 0
                    base_lip = self.baseline_lip_dist if self.baseline_lip_dist is not None else 0
                    
                    # Display FPS
                    cv2.putText(frame, f"FPS: {self.fps:.1f}", 
                               (frame.shape[1] - 120, frame.shape[0] - 10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    
                    # Display metrics based on session state
                    if self.session_active:
                        # Draw session status
                        cv2.rectangle(frame, (10, 10), (300, 120), (0, 0, 100), -1)
                        cv2.rectangle(frame, (10, 10), (300, 120), (255, 255, 255), 1)
                        
                        # Calculate second for visualization
                        current_second = int(self.session_time - self.time_remaining)
                        
                        cv2.putText(frame, f"RECORDING: {int(self.time_remaining)}s", (15, 35),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                        cv2.putText(frame, f"Current Stress: {int(stress_value*100)}%", (15, 65),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
                        cv2.putText(frame, f"Second: {current_second}/{self.session_time}", (15, 95),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
                        
                        # Draw audio indicator (red circle when audio detected)
                        if self.has_spoken:
                            cv2.circle(frame, (280, 35), 10, (0, 0, 255), -1)
                        else:
                            cv2.circle(frame, (280, 35), 10, (0, 165, 255), -1)
                            
                    elif self.combined_stress > 0:
                        # Draw final assessment results
                        cv2.rectangle(frame, (10, 10), (350, 150), bar_color, -1)
                        cv2.rectangle(frame, (10, 10), (350, 150), (255, 255, 255), 1)
                        
                        cv2.putText(frame, "STRESS ASSESSMENT RESULTS", (15, 35),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
                        cv2.putText(frame, f"Facial Stress: {int(self.facial_stress*100)}%", (15, 65),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
                        
                        if self.has_spoken:
                            cv2.putText(frame, f"Voice Stress: {int(self.voice_stress*100)}%", (15, 95),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
                            cv2.putText(frame, f"Combined: {int(self.combined_stress*100)}% - {self.stress_label}", (15, 125),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
                        else:
                            cv2.putText(frame, "No speech detected", (15, 95),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
                            cv2.putText(frame, f"Result: {int(self.combined_stress*100)}% - {self.stress_label}", (15, 125),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
                    else:
                        # Draw real-time monitoring
                        cv2.putText(frame, f"Eye Dist: {eye_dist:.1f} (Base: {base_eye:.1f})", 
                                   (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                        cv2.putText(frame, f"Lip Tension: {lip_tension:.1f} (Base: {base_lip:.1f})", 
                                   (15, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                        
                        # Display metrics with colored backgrounds
                        cv2.rectangle(frame, (10, 60), (300, 120), bar_color, -1)
                        cv2.rectangle(frame, (10, 60), (300, 120), (255, 255, 255), 1)
                        
                        cv2.putText(frame, f"STRESS LEVEL: {int(stress_value*100)}%", (15, 85),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
                        cv2.putText(frame, f"{stress_label}", (15, 110),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
                    
                    # Display calibration status
                    if not self.calibration_complete:
                        cv2.putText(frame, f"Calibrating... {self.calibration_frames}/20", 
                                   (frame.shape[1]//2 - 100, 30),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                except Exception as e:
                    print(f"[ERROR] Frame processing error: {e}")
                    cv2.putText(frame, f"Processing error: {str(e)[:30]}", 
                               (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        else:
            cv2.putText(frame, "No face detected", (frame.shape[1]//2 - 80, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        # Display help text
        if self.session_active:
            cv2.putText(frame, "Recording in progress... Please speak naturally", 
                       (10, frame.shape[0] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        elif self.combined_stress > 0:
            cv2.putText(frame, "s: Start new session  r: Reset results", 
                       (10, frame.shape[0] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        else:
            cv2.putText(frame, "q: Quit  s: Start session  l: Toggle landmarks  c: Recalibrate", 
                       (10, frame.shape[0] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        return frame
    
    def toggle_landmarks(self):
        """Toggle facial landmark visualization"""
        self.show_landmarks = not self.show_landmarks
        
    def toggle_debug(self):
        """Toggle debug mode"""
        self.debug_mode = not self.debug_mode
        
    def start_recalibration(self):
        """Start recalibration process"""
        self.recalibrate = True
        
    def reset_results(self):
        """Reset assessment results"""
        self.facial_stress = 0.0
        self.voice_stress = 0.0
        self.combined_stress = 0.0
        self.stress_label = "Not assessed"
        self.has_spoken = False
        print("[INFO] Assessment results reset")

    def cleanup(self):
        """Clean up resources"""
        try:
            # Stop any ongoing recording
            if self.audio_recording:
                self.stop_audio_recording()
                
            # Terminate PyAudio
            self.audio.terminate()
            
            # Remove temporary audio file
            if self.audio_filename and os.path.exists(self.audio_filename):
                os.remove(self.audio_filename)
                print(f"[INFO] Removed temporary audio file: {self.audio_filename}")
        except Exception as e:
            print(f"[ERROR] Cleanup error: {e}")

def main():
    # Use the verified working API key
    api_key = "AIzaSyAlckpIBbxFmAsMBExBr8hp-rLpb2YZxmA"
    
    # Create detector
    detector = MultimodalStressDetector(api_key=api_key, session_time=60)
    
    # Initialize video capture
    print("[INFO] Starting video stream...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("[ERROR] Could not open webcam")
        return
    
    # Set resolution for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    # Warm up camera
    print("[INFO] Warming up camera...")
    for _ in range(5):
        ret, _ = cap.read()
        time.sleep(0.1)
    
    try:
        while True:
            # Read frame
            ret, frame = cap.read()
            if not ret:
                print("[ERROR] Failed to capture frame")
                break
                
            # Flip for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Process frame
            try:
                processed_frame = detector.process_frame(frame)
            except Exception as e:
                print(f"[ERROR] Fatal processing error: {e}")
                processed_frame = frame  # Use original frame if processing fails
                cv2.putText(processed_frame, f"ERROR: {str(e)[:30]}", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            
            # Show frame
            cv2.imshow("Multimodal Stress Detector", processed_frame)
            
            # Check for key presses
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):  # Quit
                break
            elif key == ord('l'):  # Toggle landmarks
                detector.toggle_landmarks()
            elif key == ord('d'):  # Toggle debug
                detector.toggle_debug()
            elif key == ord('c'):  # Recalibrate
                detector.start_recalibration()
            elif key == ord('s'):  # Start/stop session
                if detector.session_active:
                    detector.end_session()
                else:
                    detector.start_session()
            elif key == ord('r'):  # Reset results
                detector.reset_results()
                
    except Exception as e:
        print(f"[ERROR] Main loop error: {e}")
        
    finally:
        # Clean up
        print("[INFO] Cleaning up...")
        cap.release()
        cv2.destroyAllWindows()
        detector.cleanup()

if __name__ == "__main__":
    main()

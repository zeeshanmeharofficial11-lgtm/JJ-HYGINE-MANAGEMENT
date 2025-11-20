import React, { useState, useEffect } from 'react';
import { Check, X, Camera, Save, AlertCircle, BarChart3, Users, Building, TrendingUp, Award, AlertTriangle, Edit2, ChevronDown, ChevronUp, LogOut, Lock, Star, Zap, Trophy, Target, Flame, Moon, Sun, Download, Mail, Bell, Filter, Calendar, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';

// Database configuration
const API_BASE_URL = 'http://localhost:3001/api'; // Change this to your backend URL

const Database = {
  // ... (keep all your existing Database methods)

  async saveChecklist(data, username) {
    try {
      const response = await fetch(`${API_BASE_URL}/checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch: data.basicInfo.branch,
          date: data.basicInfo.date,
          shift: data.basicInfo.shift,
          employee_name: data.basicInfo.employeeName,
          employee_id: data.basicInfo.employeeId,
          employee_type: data.basicInfo.employeeType,
          manager_type: data.basicInfo.managerType,
          employee_photo: data.employeePhoto,
          bike_photo: data.bikePhoto,
          checklist_data: {
            safetyChecks: data.safetyChecks,
            documents: data.documents,
            bikeInspection: data.bikeInspection,
            lights: data.lights,
            hygiene: data.hygiene
          },
          score: this.calculateChecklistScore(data),
          created_by: username
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save checklist');
      }

      const result = await response.json();
      
      // Also save to local storage for offline functionality
      const id = Date.now().toString();
      const checklist = { ...data, id, timestamp: new Date().toISOString() };
      this.checklists.push(checklist);
      
      const score = this.calculateChecklistScore(checklist);
      const points = score >= 90 ? 20 : score >= 70 ? 10 : 5;
      this.updateUserProgress(username, points);
      
      return { success: true, id, points, score, dbId: result.id };
      
    } catch (error) {
      console.error('Database save error:', error);
      // Fallback to local storage
      const id = Date.now().toString();
      const checklist = { ...data, id, timestamp: new Date().toISOString() };
      this.checklists.push(checklist);
      
      const score = this.calculateChecklistScore(checklist);
      const points = score >= 90 ? 20 : score >= 70 ? 10 : 5;
      this.updateUserProgress(username, points);
      
      return { success: true, id, points, score, offline: true };
    }
  },

  // Add method to sync local data with database
  async syncLocalData() {
    try {
      // Get unsynced checklists from localStorage
      const unsyncedChecklists = JSON.parse(localStorage.getItem('unsyncedChecklists') || '[]');
      
      for (const checklist of unsyncedChecklists) {
        await this.saveChecklist(checklist.data, checklist.username);
      }
      
      // Clear synced data
      localStorage.removeItem('unsyncedChecklists');
      
    } catch (error) {
      console.error('Sync error:', error);
    }
  },

  // ... (rest of your existing Database methods remain the same)
};

// Initialize database sync on app start
Database.syncLocalData();

// Add this function to handle checklist submission with retry logic
const submitChecklistWithRetry = async (checklistData, username, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Database.saveChecklist(checklistData, username);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // If all retries failed, save to localStorage for later sync
  const unsyncedChecklists = JSON.parse(localStorage.getItem('unsyncedChecklists') || '[]');
  unsyncedChecklists.push({
    data: checklistData,
    username: username,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('unsyncedChecklists', JSON.stringify(unsyncedChecklists));
  
  // Return offline result
  const id = Date.now().toString();
  const checklist = { ...checklistData, id, timestamp: new Date().toISOString() };
  Database.checklists.push(checklist);
  
  const score = Database.calculateChecklistScore(checklist);
  const points = score >= 90 ? 20 : score >= 70 ? 10 : 5;
  Database.updateUserProgress(username, points);
  
  return { 
    success: true, 
    id, 
    points, 
    score, 
    offline: true,
    message: 'Saved offline - will sync when connection is restored'
  };
};

// Update the ChecklistForm component's submit handler
const ChecklistForm = ({ onNavigate, onSubmit, user, darkMode }) => {
  // ... (existing state and methods)

  const handleSubmitForm = async () => {
    const stats = getCompletionStats();
    if (stats.completed !== stats.total) {
      alert('⚠️ Please complete all required fields before submitting! 📋');
      return;
    }
    
    try {
      const result = await submitChecklistWithRetry(
        { ...checklist, employeePhoto, bikePhoto }, 
        user.username
      );
      
      if (result.success) {
        setEarnedPoints(result.points);
        setShowSuccess(true);
        
        // Show offline warning if applicable
        if (result.offline) {
          setTimeout(() => {
            alert('📱 Data saved offline. It will sync automatically when connection is restored.');
          }, 100);
        }
        
        setTimeout(() => {
          setShowSuccess(false);
          onSubmit();
        }, 3000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('❌ Failed to save inspection. Please try again.');
    }
  };

  // ... (rest of the component remains the same)
};

// Add network status indicator component
const NetworkStatus = ({ darkMode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className={`fixed top-4 left-4 z-50 ${
      darkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-400 text-black'
    } px-4 py-2 rounded-lg shadow-lg font-semibold text-sm`}>
      ⚠️ Offline Mode - Data will sync when connection returns
    </div>
  );
};

// Update the main App component to include NetworkStatus
const App = () => {
  // ... (existing state and methods)

  return (
    <div className={darkMode ? 'dark' : ''}>
      <NetworkStatus darkMode={darkMode} />
      
      {currentView === 'dashboard' && stats && (
        <Dashboard 
          onNavigate={setCurrentView} 
          stats={stats} 
          user={currentUser} 
          onLogout={handleLogout}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      )}
      {/* ... rest of your views */}
    </div>
  );
};

// Backend API example (Node.js/Express)
/*
// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});

app.post('/api/checklists', async (req, res) => {
  try {
    const {
      branch,
      date,
      shift,
      employee_name,
      employee_id,
      employee_type,
      manager_type,
      employee_photo,
      bike_photo,
      checklist_data,
      score,
      created_by
    } = req.body;

    const query = `
      INSERT INTO checklists (
        branch, date, shift, employee_name, employee_id, employee_type, 
        manager_type, employee_photo, bike_photo, checklist_data, score, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      branch, date, shift, employee_name, employee_id, employee_type,
      manager_type, employee_photo, bike_photo, checklist_data, score, created_by
    ];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to save checklist' });
  }
});

app.get('/api/checklists', async (req, res) => {
  try {
    const { branch, date, employee_type } = req.query;
    let query = 'SELECT * FROM checklists WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (branch) {
      paramCount++;
      query += ` AND branch = $${paramCount}`;
      values.push(branch);
    }

    if (date) {
      paramCount++;
      query += ` AND date = $${paramCount}`;
      values.push(date);
    }

    if (employee_type) {
      paramCount++;
      query += ` AND employee_type = $${paramCount}`;
      values.push(employee_type);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
*/

export default App;
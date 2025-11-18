import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  async login(username, password) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('password', password)
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: true, user: data };
  },

  async getChecklists(filters = {}) {
    let query = supabase.from('checklists').select('*').order('created_at', { ascending: false });

    if (filters.branch) query = query.eq('branch', filters.branch);
    if (filters.date) query = query.eq('date', filters.date);
    if (filters.employeeType) query = query.eq('employee_type', filters.employeeType);

    const { data, error } = await query;
    return error ? [] : data;
  },

  async createChecklist(checklistData, username) {
    const score = calculateScore(checklistData);
    
    const { data, error } = await supabase.from('checklists').insert({
      branch: checklistData.basicInfo.branch,
      date: checklistData.basicInfo.date,
      shift: checklistData.basicInfo.shift,
      employee_name: checklistData.basicInfo.employeeName,
      employee_id: checklistData.basicInfo.employeeId,
      employee_type: checklistData.basicInfo.employeeType,
      manager_type: checklistData.basicInfo.managerType,
      employee_photo: checklistData.employeePhoto,
      bike_photo: checklistData.bikePhoto,
      checklist_data: checklistData,
      score,
      created_by: username
    }).select().single();

    if (error) throw error;

    const points = score >= 90 ? 20 : score >= 70 ? 10 : 5;
    await supabase.from('users').update({ 
      points: supabase.rpc('increment', { x: points })
    }).eq('username', username);

    return { success: true, id: data.id, points, score };
  },

  async getStaffConfig(branch, type) {
    const { data } = await supabase.from('staff_config')
      .select('*').eq('branch', branch).eq('employee_type', type).single();

    if (!data) {
      return {
        total: 0,
        shiftA: { count: 0, dayOff: 0, noShow: 0, medical: 0 },
        shiftB: { count: 0, dayOff: 0, noShow: 0, medical: 0 }
      };
    }

    return {
      total: data.total_staff,
      shiftA: {
        count: data.shift_a_count,
        dayOff: data.shift_a_day_off,
        noShow: data.shift_a_no_show,
        medical: data.shift_a_medical
      },
      shiftB: {
        count: data.shift_b_count,
        dayOff: data.shift_b_day_off,
        noShow: data.shift_b_no_show,
        medical: data.shift_b_medical
      }
    };
  },

  async updateStaffConfig(branch, type, config) {
    await supabase.from('staff_config').upsert({
      branch,
      employee_type: type,
      total_staff: config.total,
      shift_a_count: config.shiftA.count,
      shift_a_day_off: config.shiftA.dayOff,
      shift_a_no_show: config.shiftA.noShow,
      shift_a_medical: config.shiftA.medical,
      shift_b_count: config.shiftB.count,
      shift_b_day_off: config.shiftB.dayOff,
      shift_b_no_show: config.shiftB.noShow,
      shift_b_medical: config.shiftB.medical
    });
    return { success: true };
  }
};

function calculateScore(checklistData) {
  let total = 0, passed = 0;
  ['safetyChecks', 'documents', 'bikeInspection', 'lights', 'hygiene'].forEach(section => {
    if (checklistData[section]) {
      checklistData[section].forEach(item => {
        if (item.name === 'Society Gate Passes' && !item.hasGatePass) return;
        if (item.name === 'JJ Jacket (As Per Season)' && !item.hasJacket) return;
        total++;
        if (item.status === true) passed++;
      });
    }
  });
  return total > 0 ? (passed / total) * 100 : 0;
}
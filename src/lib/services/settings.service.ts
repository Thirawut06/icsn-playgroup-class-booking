import { supabase } from '../supabase';

export interface SystemSettings {
  cutoff_hour: number;
  default_capacity: number;
  announcement_text: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  cutoff_hour: 7,
  default_capacity: 12,
  announcement_text: '',
};

export const SettingsService = {
  async getAllSettings(): Promise<SystemSettings> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');
    
    if (error) throw error;

    // Convert array of {key, value} to object
    const settingsObj: SystemSettings = { ...DEFAULT_SETTINGS };
    
    if (data) {
      for (const row of data) {
        if (row.key === 'cutoff_hour') {
          settingsObj.cutoff_hour = parseInt(row.value, 10);
        } else if (row.key === 'default_capacity') {
          settingsObj.default_capacity = parseInt(row.value, 10);
        } else if (row.key === 'announcement_text') {
          settingsObj.announcement_text = row.value;
        }
      }
    }

    return settingsObj as SystemSettings;
  },

  async updateSetting(key: string, value: string): Promise<void> {
    // Upsert equivalent since we might not have the row yet.
    // Supabase standard update might fail if row doesn't exist, so we use upsert
    // But upsert requires knowing the Primary Key. If `key` is PK, we can upsert.
    // Let's check table schema: it says `key character varying NOT NULL`. 
    // We will just do a delete then insert or an upsert. 
    // Actually, .upsert works well if `key` is unique.
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      
    if (error) {
      // If upsert fails due to no unique constraint on key, fallback to delete + insert
      if (error.code === '42P10' || error.message.includes('unique constraint')) {
        await supabase.from('system_settings').delete().eq('key', key);
        await supabase.from('system_settings').insert({ key, value, updated_at: new Date().toISOString() });
      } else {
        throw error;
      }
    }
  },

  async updateAllSettings(settings: Partial<SystemSettings>): Promise<void> {
    const updates: { key: string; value: string; updated_at: string }[] = [];
    const now = new Date().toISOString();

    if (settings.cutoff_hour !== undefined) {
      updates.push({ key: 'cutoff_hour', value: String(settings.cutoff_hour), updated_at: now });
    }
    if (settings.default_capacity !== undefined) {
      updates.push({ key: 'default_capacity', value: String(settings.default_capacity), updated_at: now });
    }
    if (settings.announcement_text !== undefined) {
      updates.push({ key: 'announcement_text', value: settings.announcement_text, updated_at: now });
    }

    if (updates.length > 0) {
      const { error } = await supabase
        .from('system_settings')
        .upsert(updates, { onConflict: 'key' });
        
      if (error) {
        if (error.code === '42P10' || error.message.includes('unique constraint')) {
          for (const item of updates) {
            await supabase.from('system_settings').delete().eq('key', item.key);
          }
          await supabase.from('system_settings').insert(updates);
        } else {
          throw error;
        }
      }
    }
  }
};

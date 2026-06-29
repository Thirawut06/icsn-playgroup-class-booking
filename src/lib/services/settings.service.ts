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
    if (settings.cutoff_hour !== undefined) {
      await this.updateSetting('cutoff_hour', String(settings.cutoff_hour));
    }
    if (settings.default_capacity !== undefined) {
      await this.updateSetting('default_capacity', String(settings.default_capacity));
    }
    if (settings.announcement_text !== undefined) {
      await this.updateSetting('announcement_text', settings.announcement_text);
    }
  }
};

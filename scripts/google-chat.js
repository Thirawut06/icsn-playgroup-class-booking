/**
 * google-chat.js
 * Secure helper wrapper for Google Chat Notifications.
 * 
 * Protects GOOGLE_CHAT_WEBHOOK_URL from leaks.
 * Fulfills recommendation: "Never expose the webhook URL in frontend code"
 * 
 * In this preview/dev environment, we route the notification through a secure server-side Express proxy: `/api/notify`
 * For Supabase Edge Functions deployment, we print instructions in README.md.
 */

window.GoogleChat = {
  async notify(text) {
    console.log(`📣 [Google Chat Webhook Request]: "${text}"`);
    
    try {
      if (!window.AppDB || !window.AppDB.client) {
        throw new Error("Supabase client not initialized yet.");
      }
      
      const { data, error } = await window.AppDB.client.functions.invoke('notify', {
        body: { text }
      });

      if (error) throw error;
      if (data && data.success) {
        console.log('✅ Google Chat notification sent successfully.');
        return true;
      } else {
        console.warn('⚠️ Google Chat proxy message:', data ? data.error : 'Unknown issue');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to route Google Chat notification via backend proxy:', error);
      return false;
    }
  }
};

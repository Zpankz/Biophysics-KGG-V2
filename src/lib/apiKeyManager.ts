import { supabase } from './supabase';


async function encrypt(text: string): Promise<string> {
  return btoa(text);
}

async function decrypt(encryptedText: string): Promise<string> {
  return atob(encryptedText);
}

export interface ApiKey {
  id: string;
  provider_name: string;
  key_name: string | null;
  is_active: boolean;
  last_validated: string | null;
  validation_status: 'valid' | 'invalid' | 'untested' | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyWithDecrypted extends ApiKey {
  decrypted_key: string;
}

export async function saveApiKey(
  provider: string,
  apiKey: string,
  keyName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      localStorage.setItem(`apikey_${provider}`, apiKey);
      return { success: true };
    }

    const encryptedKey = await encrypt(apiKey);

    const { error } = await supabase
      .from('user_api_keys')
      .upsert({
        user_id: user.id,
        provider_name: provider,
        encrypted_key: encryptedKey,
        key_name: keyName || null,
        is_active: true,
        validation_status: 'untested' as 'valid' | 'invalid' | 'untested',
      } as any, {
        onConflict: 'user_id,provider_name,key_name'
      });

    if (error) {
      return { success: false, error: error.message };
    }

    localStorage.setItem(`apikey_${provider}`, apiKey);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getApiKeys(): Promise<{ data: ApiKey[] | null; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const localKeys: ApiKey[] = [];
      const providers = ['openai', 'anthropic', 'cohere', 'google', 'mistral'];

      for (const provider of providers) {
        const key = localStorage.getItem(`apikey_${provider}`);
        if (key) {
          localKeys.push({
            id: `local_${provider}`,
            provider_name: provider,
            key_name: null,
            is_active: true,
            last_validated: null,
            validation_status: 'untested',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      return { data: localKeys };
    }

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id, provider_name, key_name, is_active, last_validated, validation_status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ApiKey[] };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getApiKey(
  provider: string,
  keyName?: string
): Promise<{ data: ApiKeyWithDecrypted | null; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const localKey = localStorage.getItem(`apikey_${provider}`);
      if (!localKey) {
        return { data: null, error: `No API key found for ${provider}. Please add one in Settings.` };
      }

      return {
        data: {
          id: 'local',
          provider_name: provider,
          key_name: keyName || null,
          is_active: true,
          last_validated: null,
          validation_status: 'untested',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          decrypted_key: localKey,
        }
      };
    }

    let query = supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider_name', provider)
      .eq('is_active', true);

    if (keyName) {
      query = query.eq('key_name', keyName);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      const localKey = localStorage.getItem(`apikey_${provider}`);
      if (!localKey) {
        return { data: null, error: `No API key found for ${provider}. Please add one in Settings.` };
      }

      return {
        data: {
          id: 'local',
          provider_name: provider,
          key_name: keyName || null,
          is_active: true,
          last_validated: null,
          validation_status: 'untested',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          decrypted_key: localKey,
        }
      };
    }

    const decryptedKey = await decrypt((data as any).encrypted_key);

    const record = data as any;
    return {
      data: {
        id: record.id,
        provider_name: record.provider_name,
        key_name: record.key_name,
        is_active: record.is_active,
        last_validated: record.last_validated,
        validation_status: record.validation_status,
        created_at: record.created_at,
        updated_at: record.updated_at,
        decrypted_key: decryptedKey,
      }
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteApiKey(keyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const provider = keyId.replace('local_', '');
      localStorage.removeItem(`apikey_${provider}`);
      return { success: true };
    }

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateApiKeyStatus(
  keyId: string,
  status: 'valid' | 'invalid'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('user_api_keys')
      .update({
        validation_status: status,
        last_validated: new Date().toISOString(),
      } as never)
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

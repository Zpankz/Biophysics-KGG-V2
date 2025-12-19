import { supabase } from './supabase';

export interface TaskConfig {
  provider: string;
  model: string;
  params: Record<string, any>;
}

export interface ModelConfiguration {
  id: string;
  user_id: string | null;
  config_name: string;
  is_active: boolean;
  is_system_default: boolean;
  description: string | null;
  chunking_config: TaskConfig;
  extraction_config: TaskConfig;
  embedding_config: TaskConfig;
  reranking_config: TaskConfig;
  chat_config: TaskConfig;
  voice_config: TaskConfig;
  created_at: string;
  updated_at: string;
}

export async function getSystemConfigurations(): Promise<{ data: ModelConfiguration[] | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('model_configurations')
      .select('*')
      .eq('is_system_default', true)
      .order('config_name');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ModelConfiguration[] };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getUserConfigurations(): Promise<{ data: ModelConfiguration[] | null; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: undefined };
    }

    const { data, error } = await supabase
      .from('model_configurations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ModelConfiguration[] };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getAllConfigurations(): Promise<{ data: ModelConfiguration[] | null; error?: string }> {
  try {
    const [systemResult, userResult] = await Promise.all([
      getSystemConfigurations(),
      getUserConfigurations()
    ]);

    if (systemResult.error) {
      return { data: null, error: systemResult.error };
    }

    if (userResult.error) {
      return { data: null, error: userResult.error };
    }

    const allConfigs = [
      ...(systemResult.data || []),
      ...(userResult.data || [])
    ];

    return { data: allConfigs };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getActiveConfiguration(): Promise<{ data: ModelConfiguration | null; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const { data: systemDefault } = await supabase
        .from('model_configurations')
        .select('*')
        .eq('is_system_default', true)
        .eq('config_name', 'Balanced')
        .maybeSingle();

      return { data: (systemDefault || null) as ModelConfiguration | null };
    }

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('active_config_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if ((prefs as any)?.active_config_id) {
      const { data: config } = await supabase
        .from('model_configurations')
        .select('*')
        .eq('id', (prefs as any).active_config_id)
        .maybeSingle();

      if (config) {
        return { data: config as ModelConfiguration };
      }
    }

    const { data: userActive } = await supabase
      .from('model_configurations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (userActive) {
      return { data: userActive as ModelConfiguration };
    }

    const { data: systemDefault } = await supabase
      .from('model_configurations')
      .select('*')
      .eq('is_system_default', true)
      .eq('config_name', 'Balanced')
      .maybeSingle();

    return { data: (systemDefault || null) as ModelConfiguration | null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function saveConfiguration(
  configName: string,
  description: string,
  configs: {
    chunking: TaskConfig;
    extraction: TaskConfig;
    embedding: TaskConfig;
    reranking: TaskConfig;
    chat: TaskConfig;
    voice: TaskConfig;
  }
): Promise<{ success: boolean; error?: string; data?: ModelConfiguration }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('model_configurations')
      .upsert({
        user_id: user.id,
        config_name: configName,
        description,
        is_active: false,
        is_system_default: false,
        chunking_config: configs.chunking as any,
        extraction_config: configs.extraction as any,
        embedding_config: configs.embedding as any,
        reranking_config: configs.reranking as any,
        chat_config: configs.chat as any,
        voice_config: configs.voice as any,
      } as any, {
        onConflict: 'user_id,config_name'
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ModelConfiguration };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function setActiveConfiguration(configId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const deactivateUpdate: any = { is_active: false };
    await supabase
      .from('model_configurations')
      .update(deactivateUpdate)
      .eq('user_id', user.id);

    const activateUpdate: any = { is_active: true };
    const { error: updateError } = await supabase
      .from('model_configurations')
      .update(activateUpdate)
      .eq('id', configId)
      .eq('user_id', user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        active_config_id: configId,
      } as any, {
        onConflict: 'user_id'
      });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteConfiguration(configId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('model_configurations')
      .delete()
      .eq('id', configId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

import { supabase } from './supabase';

interface UsageLog {
  provider_name: string;
  model_name: string;
  task_type: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  cost_usd?: number;
  success: boolean;
  error_message?: string;
}

export async function logUsage(log: UsageLog): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      provider_name: log.provider_name,
      model_name: log.model_name,
      task_type: log.task_type,
      input_tokens: log.input_tokens,
      output_tokens: log.output_tokens,
      latency_ms: log.latency_ms,
      cost_usd: log.cost_usd,
      success: log.success,
      error_message: log.error_message,
    } as any);
  } catch (error) {
    console.error('Failed to log usage:', error);
  }
}

export function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costPer1kInput = getCostPer1k(provider, model, 'input');
  const costPer1kOutput = getCostPer1k(provider, model, 'output');

  const inputCost = (inputTokens / 1000) * costPer1kInput;
  const outputCost = (outputTokens / 1000) * costPer1kOutput;

  return inputCost + outputCost;
}

function getCostPer1k(provider: string, model: string, type: 'input' | 'output'): number {
  const costs: Record<string, Record<string, { input: number; output: number }>> = {
    openai: {
      'gpt-5.2': { input: 0.015, output: 0.06 },
      'gpt-5.2-codex': { input: 0.015, output: 0.06 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'text-embedding-3-large': { input: 0.00013, output: 0 },
      'text-embedding-3-small': { input: 0.00002, output: 0 },
    },
    anthropic: {
      'claude-opus-4.5': { input: 0.015, output: 0.075 },
      'claude-sonnet-4.5': { input: 0.003, output: 0.015 },
      'claude-haiku-4.5': { input: 0.0008, output: 0.004 },
    },
    google: {
      'gemini-3-pro': { input: 0.00125, output: 0.005 },
      'gemini-3-flash': { input: 0.000075, output: 0.0003 },
      'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
      'gemini-2.5-flash': { input: 0.000075, output: 0.0003 },
    },
    xai: {
      'grok-4.1-reasoning': { input: 0.01, output: 0.03 },
      'grok-4.1-non-reasoning': { input: 0.005, output: 0.015 },
    },
    groq: {
      'llama-3.3-70b': { input: 0.00059, output: 0.00079 },
      'llama-3.1-8b': { input: 0.00005, output: 0.00008 },
    },
  };

  const providerCosts = costs[provider.toLowerCase()];
  if (!providerCosts) return 0;

  const modelCosts = providerCosts[model];
  if (!modelCosts) return 0;

  return modelCosts[type];
}

export async function getUsageStats(days: number = 30): Promise<{
  totalCost: number;
  totalCalls: number;
  byProvider: Record<string, { calls: number; cost: number }>;
  byTask: Record<string, { calls: number; cost: number }>;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        totalCost: 0,
        totalCalls: 0,
        byProvider: {},
        byTask: {},
      };
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: logs } = await supabase
      .from('api_usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString());

    if (!logs) {
      return {
        totalCost: 0,
        totalCalls: 0,
        byProvider: {},
        byTask: {},
      };
    }

    const totalCost = logs.reduce((sum, log: any) => sum + (Number(log.cost_usd) || 0), 0);
    const totalCalls = logs.length;

    const byProvider: Record<string, { calls: number; cost: number }> = {};
    const byTask: Record<string, { calls: number; cost: number }> = {};

    for (const log of logs) {
      const record = log as any;
      if (!byProvider[record.provider_name]) {
        byProvider[record.provider_name] = { calls: 0, cost: 0 };
      }
      byProvider[record.provider_name].calls++;
      byProvider[record.provider_name].cost += Number(record.cost_usd) || 0;

      if (!byTask[record.task_type]) {
        byTask[record.task_type] = { calls: 0, cost: 0 };
      }
      byTask[record.task_type].calls++;
      byTask[record.task_type].cost += Number(record.cost_usd) || 0;
    }

    return {
      totalCost,
      totalCalls,
      byProvider,
      byTask,
    };
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return {
      totalCost: 0,
      totalCalls: 0,
      byProvider: {},
      byTask: {},
    };
  }
}

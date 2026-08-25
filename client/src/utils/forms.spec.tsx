import { LocalStorageKeys } from 'librechat-data-provider';
import { getDefaultAgentFormValues } from './forms';

describe('getDefaultAgentFormValues', () => {
  afterEach(() => {
    localStorage.clear();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('uses the scalable user workspace by default', () => {
    expect(getDefaultAgentFormValues().stateful_code_environment).toBe('user');
  });

  it('seeds a new agent with the user workspace preference', () => {
    expect(getDefaultAgentFormValues('agent-user').stateful_code_environment).toBe('agent-user');
  });

  it('does not show stored model defaults before current models load', () => {
    localStorage.setItem(LocalStorageKeys.LAST_AGENT_PROVIDER, 'anthropic');
    localStorage.setItem(LocalStorageKeys.LAST_AGENT_MODEL, 'claude-removed');

    const defaults = getDefaultAgentFormValues();

    expect(defaults.provider).toEqual({});
    expect(defaults.model).toBe('');
  });
});

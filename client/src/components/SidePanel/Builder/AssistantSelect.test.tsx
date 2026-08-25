/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { EModelEndpoint } from 'librechat-data-provider';
import { act, render, waitFor } from '@testing-library/react';
import type { AssistantCreateParams } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Assistant } from 'librechat-data-provider';
import AssistantSelect from './AssistantSelect';

let selectValue: ((value: string) => void) | undefined;

jest.mock('@librechat/client', () => ({
  SelectDropDown: ({ setValue }: { setValue: (value: string) => void }) => {
    selectValue = setValue;
    return <div />;
  },
}));

jest.mock('~/data-provider', () => ({
  useListAssistantsQuery: () => ({ data: [] }),
}));

jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => key,
  useLocalStorage: () => [{ assistants: 'server-model' }],
}));

jest.mock('~/Providers', () => ({
  useFileMapContext: () => new Map(),
}));

describe('AssistantSelect', () => {
  it('waits for successfully fetched models before restoring the create default', async () => {
    const reset = jest.fn();
    const setValue = jest.fn();
    const createMutation = { reset: jest.fn() } as unknown as UseMutationResult<
      Assistant,
      Error,
      AssistantCreateParams
    >;
    const props: React.ComponentProps<typeof AssistantSelect> = {
      reset,
      value: '',
      endpoint: EModelEndpoint.assistants,
      documentsMap: null,
      selectedAssistant: null,
      setCurrentAssistantId: jest.fn(),
      createMutation,
      allTools: [],
      models: ['bundled-default'],
      modelsFetched: false,
      setValue,
      model: '',
      modelDirty: false,
    };

    const { rerender } = render(<AssistantSelect {...props} />);

    act(() => selectValue?.(''));
    expect(reset).toHaveBeenLastCalledWith(expect.objectContaining({ model: '' }));

    rerender(<AssistantSelect {...props} models={['bundled-default']} modelsFetched={false} />);
    expect(setValue).not.toHaveBeenCalled();

    rerender(<AssistantSelect {...props} models={['server-model']} modelsFetched={true} />);

    await waitFor(() => {
      expect(setValue).toHaveBeenCalledWith('model', 'server-model', { shouldDirty: false });
    });
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('does not replace a model selected while models are loading', async () => {
    const reset = jest.fn();
    const setValue = jest.fn();
    const createMutation = { reset: jest.fn() } as unknown as UseMutationResult<
      Assistant,
      Error,
      AssistantCreateParams
    >;
    const props: React.ComponentProps<typeof AssistantSelect> = {
      reset,
      value: '',
      endpoint: EModelEndpoint.assistants,
      documentsMap: null,
      selectedAssistant: null,
      setCurrentAssistantId: jest.fn(),
      createMutation,
      allTools: [],
      models: ['bundled-default'],
      modelsFetched: false,
      setValue,
      model: '',
      modelDirty: false,
    };

    const { rerender } = render(<AssistantSelect {...props} />);
    act(() => selectValue?.(''));

    rerender(
      <AssistantSelect
        {...props}
        models={['server-model', 'chosen-model']}
        modelsFetched={true}
        model="chosen-model"
        modelDirty={true}
      />,
    );

    await waitFor(() => expect(reset).toHaveBeenCalledTimes(1));
    expect(setValue).not.toHaveBeenCalled();
  });

  it('clears a selected model that is absent from the fetched list', async () => {
    const reset = jest.fn();
    const setValue = jest.fn();
    const createMutation = { reset: jest.fn() } as unknown as UseMutationResult<
      Assistant,
      Error,
      AssistantCreateParams
    >;
    const props: React.ComponentProps<typeof AssistantSelect> = {
      reset,
      value: '',
      endpoint: EModelEndpoint.assistants,
      documentsMap: null,
      selectedAssistant: null,
      setCurrentAssistantId: jest.fn(),
      createMutation,
      allTools: [],
      models: ['bundled-model'],
      modelsFetched: false,
      setValue,
      model: '',
      modelDirty: false,
    };

    const { rerender } = render(<AssistantSelect {...props} />);
    act(() => selectValue?.(''));

    rerender(
      <AssistantSelect
        {...props}
        models={['server-model']}
        modelsFetched={true}
        model="bundled-model"
        modelDirty={true}
      />,
    );

    await waitFor(() => {
      expect(setValue).toHaveBeenCalledWith('model', '', { shouldDirty: false });
    });
  });
});

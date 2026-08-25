/**
 * @jest-environment jsdom
 */
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { fireEvent, render, waitFor } from '@testing-library/react';
import type { AgentForm } from '~/common';
import ModelPanel from './ModelPanel';

jest.mock('@librechat/client', () => ({
  Button: ({ children, onClick, type }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type={type} onClick={onClick}>
      {children}
    </button>
  ),
  ControlCombobox: ({
    ariaLabel,
    items,
    selectedValue,
    setValue,
  }: {
    ariaLabel: string;
    items: Array<{ label: string; value: string }>;
    selectedValue: string;
    setValue: (value: string) => void;
  }) => (
    <div>
      <span data-testid={`${ariaLabel}-selected`}>{selectedValue}</span>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          data-testid={`${ariaLabel}-${item.value}`}
          onClick={() => setValue(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('~/components/SidePanel/Parameters/components', () => ({
  componentMapping: {},
}));

jest.mock('~/data-provider', () => ({
  useGetEndpointsQuery: () => ({ data: {} }),
}));

jest.mock('~/Providers', () => ({
  useLiveAnnouncer: () => ({ announcePolite: jest.fn() }),
}));

jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => key,
}));

jest.mock('~/utils', () => ({
  cn: (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' '),
}));

function TestForm({
  defaultProvider = '',
  models,
  modelsFetched,
  providers = [{ label: 'Custom', value: 'custom' }],
  showPanel = true,
}: {
  defaultProvider?: string;
  models: Record<string, string[]>;
  modelsFetched: boolean;
  providers?: Array<{ label: string; value: string }>;
  showPanel?: boolean;
}) {
  const pendingProviderModelRef = React.useRef<string | null>(null);
  const methods = useForm<AgentForm>({
    defaultValues: {
      provider: defaultProvider,
      model: '',
      model_parameters: {},
    },
  });

  return (
    <FormProvider {...methods}>
      {showPanel && (
        <ModelPanel
          providers={providers}
          models={models}
          modelsFetched={modelsFetched}
          pendingProviderModelRef={pendingProviderModelRef}
          setActivePanel={jest.fn()}
        />
      )}
    </FormProvider>
  );
}

describe('ModelPanel', () => {
  it('selects the first fetched model after the panel remounts', async () => {
    const { getByTestId, rerender } = render(<TestForm models={{}} modelsFetched={false} />);

    fireEvent.click(getByTestId('com_ui_provider-custom'));
    expect(getByTestId('com_ui_model-selected').textContent).toBe('');

    rerender(<TestForm models={{}} modelsFetched={false} showPanel={false} />);
    rerender(<TestForm models={{ custom: ['custom-model'] }} modelsFetched={true} />);

    await waitFor(() => {
      expect(getByTestId('com_ui_model-selected')).toHaveTextContent('custom-model');
    });
  });

  it('leaves a removed saved model empty', () => {
    const { getByTestId } = render(
      <TestForm
        defaultProvider="custom"
        models={{ custom: ['custom-model'] }}
        modelsFetched={true}
      />,
    );

    expect(getByTestId('com_ui_model-selected').textContent).toBe('');
  });

  it('selects a fetched model after returning to the original provider', async () => {
    const providers = [
      { label: 'Original', value: 'original' },
      { label: 'Alternate', value: 'alternate' },
    ];
    const { getByTestId, rerender } = render(
      <TestForm
        defaultProvider="original"
        models={{}}
        modelsFetched={false}
        providers={providers}
      />,
    );

    fireEvent.click(getByTestId('com_ui_provider-alternate'));
    fireEvent.click(getByTestId('com_ui_provider-original'));

    rerender(
      <TestForm
        defaultProvider="original"
        models={{ original: ['original-model'] }}
        modelsFetched={true}
        providers={providers}
      />,
    );

    await waitFor(() => {
      expect(getByTestId('com_ui_model-selected')).toHaveTextContent('original-model');
    });
  });
});

import {
  Combobox,
  Loader,
  TextInput,
  useCombobox,
  type ComboboxProps,
  type TextInputProps,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { type useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

interface AsyncAutocompleteProps<T> {
  fetchData: (
    query: string,
    signal?: AbortSignal
  ) => ReturnType<typeof useSuspenseQuery<T[], unknown>>;
  renderOption: (item: T) => React.ReactNode;
  getOptionValue: (item: T) => string;
  onOptionSelect?: (item: T) => void;
  label?: string;
  placeholder?: string;
  noOptionsMessage?: string;
  comboboxProps?: ComboboxProps;
  initialValue?: string;
}

export function AsyncAutocomplete<T>({
  fetchData,
  renderOption,
  getOptionValue,
  label = "Pick value or type anything",
  placeholder = "Search...",
  onOptionSelect,
  noOptionsMessage,
  comboboxProps,
  initialValue = "",
  ...textInputProps
}: AsyncAutocompleteProps<T> & TextInputProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [value, setValue] = useState(initialValue);
  const [data, setData] = useState<T[] | null>(null);
  const [debouncedValue] = useDebouncedValue(value, 300); // Debounce the input value

  const { data: fetchedData, isLoading } = fetchData(debouncedValue);

  useEffect(() => {
    if (fetchedData) {
      setData(fetchedData);
    }
  }, [fetchedData]);

  const options = useMemo(() => {
    return (data ?? []).map((item, i) => (
      <Combobox.Option value={getOptionValue(item)} key={i}>
        {renderOption(item)}
      </Combobox.Option>
    ));
  }, [data, getOptionValue, renderOption]);

  const handleOptionSubmit = useCallback(
    (optionValue: string) => {
      setValue(optionValue);
      combobox.closeDropdown();
      if (onOptionSelect) {
        const selectedItem = data?.find(
          (item) => getOptionValue(item) === optionValue
        );
        if (selectedItem) {
          onOptionSelect(selectedItem);
        }
      }
    },
    [data, getOptionValue, onOptionSelect, combobox]
  );

  return (
    <Combobox
      onOptionSubmit={handleOptionSubmit}
      withinPortal={false}
      store={combobox}
      {...comboboxProps}
    >
      <Combobox.Target>
        <TextInput
          {...textInputProps}
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            combobox.resetSelectedOption();
            combobox.openDropdown();

            textInputProps.onChange?.(event);
          }}
          onClick={(event) => {
            combobox.openDropdown();

            textInputProps.onClick?.(event);
          }}
          onFocus={(event) => {
            combobox.openDropdown();

            textInputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            combobox.closeDropdown();

            textInputProps.onBlur?.(event);
          }}
          rightSection={
            isLoading ? <Loader size={18} /> : textInputProps.rightSection
          }
        />
      </Combobox.Target>

      <Combobox.Dropdown
        hidden={!data || (options.length === 0 && !noOptionsMessage)}
      >
        <Combobox.Options>
          {options}
          {options.length === 0 && noOptionsMessage && (
            <Combobox.Empty>{noOptionsMessage}</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

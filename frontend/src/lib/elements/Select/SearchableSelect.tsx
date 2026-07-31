import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'

import { Input } from '@hanzo/elements'

import {
    Select,
    SelectOption,
    SelectOptions,
    SelectPropsBase,
    SelectPropsClearable,
    SelectPropsNonClearable,
    SelectSection,
    isSelectSection,
} from './Select'

export interface SearchableSelectPropsBase<T> extends SelectPropsBase<T> {
    searchPlaceholder?: string
    searchKeys?: string[]
}

export interface SearchableSelectPropsClearable<T>
    extends SearchableSelectPropsBase<T>,
        SelectPropsClearable<T> {}

export interface SearchableSelectPropsNonClearable<T>
    extends SearchableSelectPropsBase<T>,
        SelectPropsNonClearable<T> {}

export type SearchableSelectProps<T> =
    | SearchableSelectPropsClearable<T>
    | SearchableSelectPropsNonClearable<T>

function flattenOptions<T>(options: SelectOptions<T>): SelectOption<T>[] {
    const flatOptions: SelectOption<T>[] = []
    const addOption = (option: SelectOption<T> | SelectSection<T>): void => {
        if ('options' in option) {
            option.options.forEach(addOption)
        } else {
            flatOptions.push(option)
        }
    }

    options.forEach((item) => {
        if (isSelectSection(item)) {
            item.options.forEach(addOption)
        } else {
            addOption(item)
        }
    })

    return flatOptions
}

function filterStructure<T>(
    item: SelectOption<T> | SelectSection<T>,
    matchedOptions: Set<SelectOption<T>>
): typeof item | null {
    if (isSelectSection(item)) {
        const filteredOptions = item.options
            .map((option) => filterStructure(option, matchedOptions))
            .filter(Boolean) as SelectOption<T>[]
        return filteredOptions.length > 0 ? { ...item, options: filteredOptions } : null
    }
    if ('options' in item) {
        const filteredOptions = item.options
            .map((option) => filterStructure(option, matchedOptions))
            .filter(Boolean) as SelectOption<T>[]
        return filteredOptions.length > 0 ? { ...item, options: filteredOptions } : null
    }
    return matchedOptions.has(item) ? item : null
}

function filterOptions<T>(
    options: SelectOptions<T>,
    searchTerm: string,
    searchKeys: string[] = ['label']
): SelectOptions<T> {
    if (!searchTerm) {
        return options
    }

    const flatOptions = flattenOptions(options)
    const fuse = new Fuse(flatOptions, { keys: searchKeys, threshold: 0.3 })
    const matchedOptions = new Set(fuse.search(searchTerm).map((result) => result.item))

    return options.map((item) => filterStructure(item, matchedOptions)).filter(Boolean) as SelectOptions<T>
}

export function SearchableSelect<T extends string | number | boolean | null>({
    searchPlaceholder,
    searchKeys = ['label'],
    onChange,
    onSelect,
    ...selectProps
}: SearchableSelectProps<T>): JSX.Element {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredOptions = useMemo(() => {
        return filterOptions(selectProps.options, searchTerm, searchKeys)
    }, [selectProps.options, searchTerm, searchKeys])

    // Add search input as first menu item
    const optionsWithSearch = useMemo(() => {
        const searchMenuItem: SelectOption<T> = {
            label: () => (
                <Input
                    type="search"
                    placeholder={searchPlaceholder || 'Search'}
                    autoFocus
                    value={searchTerm}
                    onChange={setSearchTerm}
                    fullWidth
                    onClick={(e) => e.stopPropagation()}
                    className="mb-1"
                />
            ),
            custom: true,
        } as any

        return [searchMenuItem, ...filteredOptions] as SelectOptions<T>
    }, [searchPlaceholder, searchTerm, filteredOptions])

    const handleChange = (newValue: T | null): void => {
        // Cast to `any` because `onChange` is a union type (T vs T | null) and TS can't infer it here.
        onChange?.(newValue as any)
        setSearchTerm('')
    }

    const handleOnSelect = (newValue: T | null): void => {
        // Cast to `any` because `onSelect` is a union type (T vs T | null) and TS can't infer it here.
        onSelect?.(newValue as any)
    }

    return (
        <Select {...selectProps} options={optionsWithSearch} onChange={handleChange} onSelect={handleOnSelect} />
    )
}

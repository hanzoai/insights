import { useActions, useValues } from 'kea'

import { Button } from 'lib/elements/Button'
import { Checkbox } from 'lib/elements/Checkbox'
import { Modal } from 'lib/elements/Modal'
import { Select } from 'lib/elements/Select'
import { Tag } from 'lib/elements/Tag'
import { Spinner } from 'lib/elements/Spinner'

import { iconForType } from '~/layout/panel-layout/ProjectTree/defaultTree'
import { FileSystemIconType, FileSystemImport } from '~/queries/schema/schema-general'
import { UserShortcutPosition } from '~/types'

import { editCustomProductsModalLogic } from './editCustomProductsModalLogic'

export function EditCustomProductsModal(): JSX.Element {
    const {
        isOpen,
        customProductsLoading,
        customProducts,
        selectedPaths,
        allowSidebarSuggestions,
        sidebarSuggestionsLoading,
        shortcutPosition,
        shortcutPositionLoading,
        categories,
        productsByCategory,
        productLoading,
    } = useValues(editCustomProductsModalLogic)
    const { toggleProduct, toggleCategory, toggleSidebarSuggestions, setShortcutPosition, closeModal } =
        useActions(editCustomProductsModalLogic)

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title="Edit my sidebar apps"
            footer={
                <Button type="secondary" onClick={closeModal}>
                    Close
                </Button>
            }
            width={600}
        >
            <div className="flex flex-col gap-2">
                <div>
                    <p className="text-sm text-muted">
                        Select which products you want to see in your sidebar. You can change this anytime.
                        {customProductsLoading && <Spinner />}
                    </p>
                </div>

                <div className="flex flex-col gap-4 mb-4 px-2">
                    {categories.map((category: string) => {
                        const products = productsByCategory.get(category) || []
                        const productPaths = products.map((p) => p.path)
                        const selectedCount = productPaths.filter((path) => selectedPaths.has(path)).length
                        const categoryState: boolean | 'indeterminate' =
                            selectedCount === 0 ? false : selectedCount === productPaths.length ? true : 'indeterminate'
                        const categoryLoading = products.some((p) => productLoading[p.path])

                        return (
                            <div key={category} className="mb-6">
                                <div className="mb-2">
                                    <Checkbox
                                        checked={categoryState}
                                        onChange={() => toggleCategory(category)}
                                        disabledReason={
                                            category === 'Unreleased'
                                                ? 'These products are in Alpha, enable them one by one'
                                                : categoryLoading
                                                  ? 'Saving...'
                                                  : customProductsLoading && customProducts.length === 0
                                                    ? 'Loading...'
                                                    : undefined
                                        }
                                        label={<span className="font-semibold text-tertiary">{category}</span>}
                                    />
                                </div>
                                <div className="space-y-1">
                                    {products.map((product: FileSystemImport) => {
                                        const icon = iconForType(
                                            ('iconType' in product ? product.iconType : undefined) ||
                                                (product.type as FileSystemIconType),
                                            product.iconColor
                                        )
                                        const isLoading = productLoading[product.path] || false
                                        return (
                                            <Checkbox
                                                key={product.path}
                                                checked={selectedPaths.has(product.path)}
                                                onChange={() => toggleProduct(product.path)}
                                                disabledReason={
                                                    isLoading
                                                        ? 'Saving...'
                                                        : customProductsLoading && customProducts.length === 0
                                                          ? 'Loading...'
                                                          : undefined
                                                }
                                                label={
                                                    <span className="flex items-center gap-2">
                                                        {icon}
                                                        <span>{product.path}</span>
                                                        {product.tags?.length && (
                                                            <>
                                                                {product.tags.map((tag: string) => (
                                                                    <Tag
                                                                        key={tag}
                                                                        type={
                                                                            tag === 'alpha'
                                                                                ? 'completion'
                                                                                : tag === 'beta'
                                                                                  ? 'warning'
                                                                                  : 'success'
                                                                        }
                                                                        size="small"
                                                                        className="relative top-[1px]"
                                                                    >
                                                                        {tag.toUpperCase()}
                                                                    </Tag>
                                                                ))}
                                                            </>
                                                        )}
                                                        {isLoading && <Spinner size="small" />}
                                                    </span>
                                                }
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="flex flex-col items-start gap-2 border-t pt-4">
                    <Checkbox
                        checked={allowSidebarSuggestions}
                        onChange={toggleSidebarSuggestions}
                        disabledReason={sidebarSuggestionsLoading ? 'Saving...' : undefined}
                        label={
                            <span className="flex items-center gap-2">
                                <span>Automatically suggest new products</span>
                            </span>
                        }
                    />
                    <span className="text-sm text-muted">
                        When we detect you are using a new product, we'll automatically add it to your sidebar as a
                        suggestion. We might also suggest products that are related to the ones you are using when we
                        launch a new product.
                        <br />
                        You can always remove these suggestions later.
                    </span>
                </div>

                <div className="flex flex-col items-start gap-2 border-t pt-4">
                    <div className="flex flex-col gap-2 w-full">
                        <label className="text-sm font-semibold text-tertiary">Shortcut position</label>
                        <Select<UserShortcutPosition>
                            value={shortcutPosition}
                            onChange={(value) => setShortcutPosition(value)}
                            options={[
                                { label: 'Above products', value: 'above' },
                                { label: 'Below products', value: 'below' },
                                { label: 'Hidden', value: 'hidden' },
                            ]}
                            disabledReason={shortcutPositionLoading ? 'Saving...' : undefined}
                            fullWidth
                        />
                        <span className="text-sm text-muted">
                            Choose where shortcuts appear in your sidebar when using custom products.
                        </span>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

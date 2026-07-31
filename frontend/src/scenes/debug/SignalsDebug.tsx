import { useState } from 'react'

import api from 'lib/api'
import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input'
import { Label } from 'lib/elements/Label'
import { Slider } from 'lib/elements/Slider'
import { TextArea } from 'lib/elements/TextArea'
import { toast } from 'lib/elements/Toast'

import { SceneContent } from '~/layout/scenes/components/SceneContent'

export function SignalsDebug(): JSX.Element {
    const [sourceProduct, setSourceProduct] = useState('')
    const [sourceType, setSourceType] = useState('')
    const [description, setDescription] = useState('')
    const [weight, setWeight] = useState(0.5)
    const [extraJson, setExtraJson] = useState('{}')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (): Promise<void> => {
        setIsSubmitting(true)

        let extra = {}
        try {
            extra = JSON.parse(extraJson)
        } catch {
            toast.error('Invalid JSON in extra field')
            setIsSubmitting(false)
            return
        }

        try {
            await api.create(`api/environments/@current/signals/emit/`, {
                source_product: sourceProduct,
                source_type: sourceType,
                description,
                weight,
                extra,
            })
            toast.success('Signal emitted successfully')
        } catch (error) {
            toast.error(`Failed to emit signal: ${error}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const canSubmit = sourceProduct.trim() && sourceType.trim() && description.trim()

    return (
        <SceneContent>
            <h1 className="text-2xl font-bold mb-4">Signals debug</h1>

            <div className="max-w-xl space-y-4">
                <div className="bg-bg-3000 border rounded p-4 mb-4">
                    <p className="text-muted">
                        Test signal emission. Requires <code>sig-emit-signal-flow</code> feature flag.
                    </p>
                </div>

                <div>
                    <Label>Source product</Label>
                    <Input
                        fullWidth
                        value={sourceProduct}
                        onChange={setSourceProduct}
                        placeholder="e.g. experiments, web_analytics, error_tracking"
                    />
                </div>

                <div>
                    <Label>Source type</Label>
                    <Input
                        fullWidth
                        value={sourceType}
                        onChange={setSourceType}
                        placeholder="e.g. significance_reached, traffic_anomaly"
                    />
                </div>

                <div>
                    <Label>Description</Label>
                    <TextArea
                        value={description}
                        onChange={setDescription}
                        placeholder="Describe the signal..."
                        minRows={3}
                    />
                </div>

                <div>
                    <Label>Weight: {weight.toFixed(2)}</Label>
                    <Slider min={0} max={1} step={0.05} value={weight} onChange={setWeight} />
                    <p className="text-xs text-muted mt-1">1.0 = immediate research trigger</p>
                </div>

                <div>
                    <Label>Extra (JSON)</Label>
                    <TextArea
                        value={extraJson}
                        onChange={setExtraJson}
                        placeholder="{}"
                        minRows={2}
                        className="font-mono text-sm"
                    />
                </div>

                <Button
                    type="primary"
                    fullWidth
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={!canSubmit}
                >
                    Emit signal
                </Button>
            </div>
        </SceneContent>
    )
}

export default SignalsDebug

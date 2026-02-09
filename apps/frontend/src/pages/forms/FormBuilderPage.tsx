import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  GripVertical,
  Trash2,
  Type,
  Mail,
  Phone,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { FormField } from '@/types'

const fieldTypes = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'tel', label: 'Phone', icon: Phone },
  { type: 'textarea', label: 'Textarea', icon: AlignLeft },
  { type: 'select', label: 'Select', icon: List },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio', icon: Circle },
]

export function FormBuilderPage() {
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedField, setSelectedField] = useState<FormField | null>(null)

  const addField = (type: string) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: type as FormField['type'],
      label: `New ${type} field`,
      placeholder: '',
      required: false,
    }
    setFields([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Form Builder</h1>
        <p className="text-slate-600">Create custom forms for your website</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Field Types */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Field Types</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {fieldTypes.map((fieldType) => (
                <button
                  key={fieldType.type}
                  onClick={() => addField(fieldType.type)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-colors text-left"
                >
                  <fieldType.icon className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-700">{fieldType.label}</span>
                  <Plus className="w-4 h-4 text-slate-400 ml-auto" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Preview */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Form Preview</CardTitle>
          </CardHeader>
          
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Add fields to build your form</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      p-4 rounded-xl border-2 transition-colors
                      ${selectedField?.id === field.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-white/50 hover:bg-white/80'}
                    `}
                    onClick={() => setSelectedField(field)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 cursor-move">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        
                        {field.type === 'textarea' ? (
                          <textarea
                            disabled
                            placeholder={field.placeholder}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50"
                            rows={3}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            disabled
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50"
                          >
                            <option>Select an option</option>
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            disabled
                            placeholder={field.placeholder}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50"
                          />
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeField(field.id)
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                <Button className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Submit Button
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Field Settings */}
      {selectedField && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Field Settings</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Label</label>
                  <Input
                    value={selectedField.label}
                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Placeholder</label>
                  <Input
                    value={selectedField.placeholder}
                    onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedField.required}
                  onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Required field</span>
              </label>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

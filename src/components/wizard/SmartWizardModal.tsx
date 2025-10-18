import * as React from 'react'
import { X } from 'lucide-react'

type Props = {
  onClose: () => void
  // add other props here as needed
}

export default function SmartWizardModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Smart Project Wizard</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Project Overview</h3>
            <p className="text-sm text-gray-600">{/* summary */}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Financial Summary</h3>
            <p className="text-sm text-gray-600">{/* financial summary */}</p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

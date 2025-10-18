import * as React from 'react'

type UseCase = {
  id: string
  name: string
  description: string
  icon?: React.ReactNode
}

const useCases: UseCase[] = [
  { id: '1', name: 'Microgrid', description: 'Off-grid microgrid use case', icon: '🔋' },
  { id: '2', name: 'PV+Storage', description: 'Solar plus storage', icon: '☀️' },
]

export default function SmartWizardUseCases() {
  const [hoveredCase, setHoveredCase] = React.useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Select Your Use Case</h2>
        <p className="text-gray-600">Choose a preconfigured solution to get started quickly</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {useCases.map(u => (
          <div
            key={u.id}
            onMouseEnter={() => setHoveredCase(u.id)}
            onMouseLeave={() => setHoveredCase(null)}
            className="relative p-4 border rounded-lg hover:shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{u.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{u.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{u.description}</p>
            </div>
            {hoveredCase === u.id && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

#!/usr/bin/env python3
"""
Script para actualizar los formularios de items con los 3 niveles de ubicación
"""

import re

# Leer el archivo
with open('frontend/app/[code]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Patrón para encontrar la sección de ubicaciones (2 niveles)
old_pattern = r'''              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lugar
                  </label>
                  <select
                    value=\{formData\.locationId\}
                    onChange=\{\(e\) => handleLocationChange\(e\.target\.value\)\}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecciona un lugar</option>
                    \{locations\.map\(\(loc\) => \(
                      <option key=\{loc\.id\} value=\{loc\.id\}>
                        \{loc\.icon\} \{loc\.name\}
                      </option>
                    \)\)\}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación \(UB-XXXX\)
                  </label>
                  <select
                    value=\{formData\.attributes\.sublocation \|\| ''\}
                    onChange=\{\(e\) => handleAttributeChange\('sublocation', e\.target\.value\)\}
                    disabled=\{!formData\.locationId\}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona ubicación</option>
                    \{locationSublocations\.map\(\(subloc\) => \(
                      <option key=\{subloc\.id\} value=\{subloc\.code\}>
                        \{subloc\.code\} - \{subloc\.name\}
                      </option>
                    \)\)\}
                  </select>
                  \{!formData\.locationId && \(
                    <p className="text-xs text-gray-500 mt-1">
                      Primero selecciona un lugar
                    </p>
                  \)\}
                </div>
              </div>'''

# Nuevo contenido con 3 niveles
new_content = '''              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📍 Lugar
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecciona un lugar</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.icon} {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📚 Estantería (ES-XXXX)
                  </label>
                  <select
                    value={formData.shelfId}
                    onChange={(e) => handleShelfChange(e.target.value)}
                    disabled={!formData.locationId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona una estantería</option>
                    {shelves.map((shelf) => (
                      <option key={shelf.id} value={shelf.id}>
                        {shelf.code} - {shelf.name}
                      </option>
                    ))}
                  </select>
                  {!formData.locationId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Primero selecciona un lugar
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📦 Ubicación (UB-XXXX)
                  </label>
                  <select
                    value={formData.attributes.sublocation || ''}
                    onChange={(e) => handleAttributeChange('sublocation', e.target.value)}
                    disabled={!formData.shelfId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona ubicación</option>
                    {locationSublocations.map((subloc) => (
                      <option key={subloc.id} value={subloc.code}>
                        {subloc.code} - {subloc.name}
                      </option>
                    ))}
                  </select>
                  {!formData.shelfId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Primero selecciona una estantería
                    </p>
                  )}
                </div>
              </div>'''

# Reemplazar todas las ocurrencias
content_updated = re.sub(old_pattern, new_content, content, flags=re.DOTALL)

# Contar cuántos reemplazos se hicieron
matches = len(re.findall(old_pattern, content, flags=re.DOTALL))
print(f"✅ Se encontraron {matches} ocurrencias del patrón")

# Guardar el archivo actualizado
with open('frontend/app/[code]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content_updated)

print("✅ Archivo actualizado correctamente")

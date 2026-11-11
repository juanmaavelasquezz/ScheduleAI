# ScheduleAI

Agenda académica React/Vite + Express. Conserva la edición manual, repeticiones, recuperación y enlaces de WhatsApp.

## Render
- Node 20 o superior.
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment: `OPENAI_KEY` (se conserva el nombre existente).
- Render proporciona `PORT`; localmente usa 10000.

No incluir claves en GitHub. La rama de mejoras no cambia el servicio publicado hasta integrarla en la rama que despliega Render.

## Funciones
Consultas de mañana y próxima semana se resuelven localmente sin llamadas de IA. Fechas en Colombia. Festivos nacionales calculados; no sustituyen el calendario académico institucional ni eliminan clases. Guardado en localStorage del navegador (no sincroniza dispositivos).

PDF con texto y DOCX: preservación de filas/columnas, salida estructurada y revisión previa. No OCR: archivos escaneados requieren conversión previa. Máximo 10 MB y 24.000 caracteres; no se truncan documentos silenciosamente. Puede haber errores de interpretación: revisar siempre antes de guardar.

La extracción usa gpt-4o-mini. No se cambió ni descargó la clave de Render. Límite de solicitudes por IP en memoria; no sustituye autenticación ni un límite de gasto configurado en OpenAI. Los avisos y enlaces de WhatsApp son manuales.

## Verificación
`npm test` y `npm run build`. La integración real con OpenAI necesita la clave del entorno y un documento representativo; las pruebas locales no consumen créditos.

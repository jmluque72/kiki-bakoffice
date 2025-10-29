# Variables de Entorno para Cognito en Backoffice

## Archivo .env

Crear un archivo `.env` en el directorio `backoffice/` con el siguiente contenido:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# AWS Cognito Configuration
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_00y4cEgcF
VITE_COGNITO_CLIENT_ID=5grvl5dpfv8dgfgcunttu45ege

# Development
VITE_DEV_MODE=true
```

## Configuración Automática

Las variables se configuran automáticamente desde el archivo `.env.cognito` generado por el script de configuración.

## Verificación

Para verificar que las variables están configuradas correctamente:

1. Abrir las herramientas de desarrollador del navegador
2. Ir a la consola
3. Buscar mensajes que empiecen con `🔧 [COGNITO]`
4. Verificar que los valores coincidan con la configuración de Cognito

## Troubleshooting

Si las variables no se cargan:

1. Verificar que el archivo `.env` existe en `backoffice/`
2. Reiniciar el servidor de desarrollo
3. Verificar que las variables empiecen con `VITE_`
4. Verificar que no haya espacios alrededor del `=`

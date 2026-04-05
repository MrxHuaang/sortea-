# Guía de Configuración: Gestora de Rifa

Sigue estos pasos para poner en marcha tu aplicación de rifa.

## 1. Configuración de Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Haz clic en **"Agregar proyecto"** y nómbralo (ej: `gestora-rifa`).
3. Desactiva Google Analytics (opcional para este proyecto familiar).
4. Una vez creado, haz clic en el icono de **Web (`</>`)** para registrar tu app.
5. Copia las credenciales del objeto `firebaseConfig`.
6. Pega estos valores en tu archivo `.env.local` (usa el archivo `.env.local.example` como base).

## 2. Configurar Firestore Database

1. En el menú lateral de Firebase, ve a **Build > Firestore Database**.
2. Haz clic en **"Create database"**.
3. Selecciona una ubicación (ej: `us-east1` o la más cercana a Colombia).
4. Elige **"Start in test mode"** para habilitar la lectura/escritura inicial (ver reglas abajo para seguridad).
5. Crea una colección llamada `config` y agrega un documento con ID `actual` con estos campos iniciales:
   - `totalBoletas`: 100 (number)
   - `precioBoleta`: 10000 (number)
   - `meta`: 1000000 (number)
   - `premio`: "Tu gran premio" (string)

## 3. Reglas de Seguridad de Firestore

Pega estas reglas en la pestaña **"Rules"** de Firestore para permitir el acceso público (ideal para una rifa informal, pero puedes restringirlas luego):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 4. Despliegue en Vercel

1. Sube tu código a un repositorio de GitHub.
2. Ve a [Vercel](https://vercel.com/) y haz clic en **"Add New > Project"**.
3. Importa tu repositorio.
4. En la sección **"Environment Variables"**, agrega todas las variables de tu `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `ADMIN_PASSWORD` (ej: `admin123`)
5. Haz clic en **"Deploy"**.

## 5. Comandos Útiles

- **Instalación:** `npm install`
- **Desarrollo:** `npm run dev`
- **Producción:** `npm run build && npm start`

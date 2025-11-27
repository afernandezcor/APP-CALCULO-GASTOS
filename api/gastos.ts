// api/gastos.ts - La Función Serverless de Vercel

import * as admin from 'firebase-admin';
import { VercelRequest, VercelResponse } from '@vercel/node';

// 1. Configuración usando las variables de entorno de Vercel
const serviceAccount = {
  "type": process.env.FIREBASE_TYPE as string,
  "project_id": process.env.FIREBASE_PROJECT_ID as string,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID as string,
  "private_key": process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  "client_email": process.env.FIREBASE_CLIENT_EMAIL as string,
  "client_id": process.env.FIREBASE_CLIENT_ID as string,
  // ... si configuraste más, inclúyelas aquí
} as admin.ServiceAccount; 

// 2. Inicialización de Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

// 3. Función principal (Handler) para /api/gastos
export default async (req: VercelRequest, res: VercelResponse) => {
    // Permite que tu frontend de React se comunique con este backend
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Content-Type', 'application/json');

    // Manejo de la Petición GET (CARGAR GASTOS)
    if (req.method === 'GET') {
        try {
            const snapshot = await db.collection('gastos').orderBy('fecha', 'desc').get();
            const listaGastos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.status(200).json(listaGastos);
        } catch (error) {
            console.error("Error en GET /api/gastos:", error);
            return res.status(500).json({ error: "Fallo del servidor al obtener datos." });
        }
    } 
    
    // Manejo de la Petición POST (GUARDAR GASTOS)
    else if (req.method === 'POST') {
        try {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const docRef = await db.collection('gastos').add({...data, fecha: admin.firestore.Timestamp.now()});
            return res.status(201).json({ mensaje: "Gasto guardado con éxito.", id: docRef.id });
        } catch (error) {
            console.error("Error en POST /api/gastos:", error);
            return res.status(500).json({ error: "Fallo del servidor al guardar datos." });
        }
    } 
    
    else {
        return res.status(405).json({ error: "Método no permitido." });
    }
};

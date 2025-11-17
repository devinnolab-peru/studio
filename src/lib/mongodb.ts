import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // En desarrollo, usar una variable global para evitar múltiples conexiones
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // En producción, crear una nueva conexión
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('proplanner');
}

export async function getCollection<T>(collectionName: string): Promise<Collection<T>> {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}

// Helper functions para convertir entre ObjectId y string id
export function convertObjectIdToString<T extends { _id?: ObjectId; id?: string }>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc as any;
  return {
    ...rest,
    id: _id ? _id.toString() : (doc.id || ''),
  } as Omit<T, '_id'> & { id: string };
}

export function convertStringToObjectId(id: string): ObjectId {
  // Si el id ya es un ObjectId válido, intentar convertirlo
  if (ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  // Si no es válido, lanzar un error que será capturado por los try-catch
  throw new Error(`Invalid ObjectId: ${id}`);
}


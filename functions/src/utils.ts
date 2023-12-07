import { db } from './firestore';

export async function deleteDocumentWithNestedCols<T extends FirebaseFirestore.DocumentData>(
  docRef: FirebaseFirestore.DocumentReference<T>
): Promise<FirebaseFirestore.WriteResult[]>;
export async function deleteDocumentWithNestedCols<T extends FirebaseFirestore.DocumentData>(
  docRef: FirebaseFirestore.DocumentReference<T>,
  initialBatch: FirebaseFirestore.WriteBatch
): Promise<FirebaseFirestore.WriteBatch>;

export async function deleteDocumentWithNestedCols<T extends FirebaseFirestore.DocumentData>(
  docRef: FirebaseFirestore.DocumentReference<T>,
  initialBatch?: FirebaseFirestore.WriteBatch
) {
  const batch = initialBatch ?? db.batch();
  const promises: Promise<FirebaseFirestore.DocumentReference<T>[]>[] = [];
  const cols = await docRef.listCollections();
  for (const col of cols) {
    promises.push(col.listDocuments() as Promise<FirebaseFirestore.DocumentReference<T>[]>);
  }
  (await Promise.all(promises)).flat().forEach((doc) => {
    batch.delete(doc);
  });
  batch.delete(docRef);
  return initialBatch ? batch : batch.commit();
}

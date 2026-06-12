import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
getAuth,
signInWithEmailAndPassword,
createUserWithEmailAndPassword,
updateProfile,
sendPasswordResetEmail
} from 'firebase/auth';
import { User } from '../models/user.model';
import { getFirestore, setDoc, doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, collectionData, addDoc  } from '@angular/fire/firestore';
import { Utils } from './utils';
import { Observable } from 'rxjs';


@Injectable({
providedIn: 'root',
})
export class FirebaseService {
auth = inject(AngularFireAuth);
firestore = inject(AngularFirestore);
utilsSvc = inject(Utils);

// ==================== AUTH ====================

getAuth() {
    return getAuth();
}

signIn(user: User) {
return signInWithEmailAndPassword(getAuth(), user.email, user.password);
}


signUp(user: User) {
return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
}

updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, {displayName})
}
//======= Enviar email para resetear contraseña =======

sendRecoveryEmail(email: string){
    return sendPasswordResetEmail(getAuth(), email);
}

async signOut() {
  await getAuth().signOut();
  localStorage.removeItem('user');
}

// ==================== FIRESTORE ====================

setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
}

async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
}
async getCollectionWhere(path: string, field: string, value: any) {
  const ref = collection(getFirestore(), path);
  const q = query(ref, where(field, '==', value));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}
async getCollectionWhereWithId(path: string, field: string, value: any) {
  const ref = collection(getFirestore(), path);
  const q = query(ref, where(field, '==', value));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
}
updateDocument(path: string, data: any) {
  return updateDoc(doc(getFirestore(), path), data);
}

deleteDocument(path: string) {
  return deleteDoc(doc(getFirestore(), path));
}
addDocument(path: string, data: any) {
  return addDoc(collection(getFirestore(), path), data);
}

async getCollection(path: string) {
  const snapshot = await getDocs(collection(getFirestore(), path));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

getCollectionData(path: string, queryConstraints: any[] = []): Observable<any[]> {
  const ref = collection(getFirestore(), path);
  const q = query(ref, ...queryConstraints);
  return collectionData(q, { idField: 'id' });
}
}
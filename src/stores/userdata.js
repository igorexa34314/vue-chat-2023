import { defineStore } from 'pinia';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

export const useUserdataStore = defineStore('userdata', {
	state: () => ({
		userdata: {}
	}),
	actions: {
		clearData() {
			this.userdata = {};
		},
		setUser(user) {
			this.userdata = user;
		},
		async addInfoToDB({ name, email, gender, room }) {
			try {
				const db = getFirestore();
				const docRef = await addDoc(collection(db, 'users'), {
					name,
					email,
					gender,
					room
				});
				console.log('Document written with ID: ', docRef.id);
				this.setUser({ name, email, gender, room, id: docRef.id });
			} catch (e) {
				console.error('Error adding document: ', e);
			}
		}
	}
});

// Svc
export default function (socket, io) {
	return Object.freeze({
		// Methods = v.on + callback
		sendMessage(message) {
			console.log(message);
		},
		userJoined(data) {
			return new Promise((res, rej) => {
				if (!data.name || !data.room) {
					rej(new Error('Данные не корректны'));
				}
				socket.emit('newMessage', mesItem('admin', `Добро пожаловать ${data.name}`));
				res({ userId: socket.id });
			});
		}
		// test1(msg) {
		// 	return { status: 'ok' };
		// },
		// async test2(msg) {
		// 	const users = await getUsers(msg);
		// 	return users;
		// }
		// test3(msg) {
		// 	return new Promise((resolve, reject) => {
		// 		someTimeConsumingFunction(msg, (err, progress) => {
		// 			if (err) {
		// 				console.warn(err);
		// 				reject(err);
		// 			} else {
		// 				socket.emit('progress', progress);
		// 				if (progress === 1) {
		// 					console.log('Good');
		// 					resolve(progress);
		// 				}
		// 			}
		// 		});
		// 	});
		// }
	});
}

const mesItem = (user, textContent, id) => ({ user, textContent, id });

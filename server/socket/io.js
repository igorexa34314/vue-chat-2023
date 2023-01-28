// Svc
export default function (socket, io) {
	// 	socket.emit('newMessage', 'message');
	return Object.freeze({
		// Methods = v.on + callback
		sendMessage(message) {
			console.log(message);
		},
		test1(msg) {
			return { status: 'ok' };
		},
		async test2(msg) {
			const users = await getUsers(msg);
			return users;
		}
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

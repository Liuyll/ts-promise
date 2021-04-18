import MPromise from './src/Promise'

// new MPromise(r => {
// 	let f = MPromise.resolve().then(v => {console.log('test2')})
// 	r(f)
// }).then(() => {
// 	console.log('resolve')
// })

// MPromise.resolve().then(() => {
// 	throw Error('qwe')
// 	console.log('ss1')
// }).then(() => {
// 	console.log('ss2')
// }).then(() => {
// 	console.log('ss3')
// }).catch(e => {
// 	console.log('error:', e)
// })

new MPromise(r => r()).then(() => {
	throw Error('qwe')
	console.log('ss1')
}).then(() => {
	console.log('ss2')
}).catch(e => {
	console.log(e)
	return 5
}).then(r => {
	console.log('ss3,ret:', r)
})


import MPromise from './src/Promise'

new MPromise(r => {
	let f = MPromise.resolve()
	r(f)
}).then(() => {
	console.log('resolve')
})

MPromise.resolve().then(() => {
	console.log('ss1')
}).then(() => {
	console.log('ss2')
}).then(() => {
	console.log('ss3')
})


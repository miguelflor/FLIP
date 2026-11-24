// Tests read the app's text in European Portuguese, its main language; the test browser
// would otherwise report en-US and pick English.
Object.defineProperty(navigator, 'language', { value: 'pt-PT', configurable: true });

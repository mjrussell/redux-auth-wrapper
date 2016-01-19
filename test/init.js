import chai from 'chai'
import jsdom from 'jsdom'

// Use except
global.expect = chai.expect

// JsDom browser
global.document = jsdom.jsdom('<!doctype html><html><body></body></html>')
global.window = document.defaultView
global.navigator = global.window.navigator

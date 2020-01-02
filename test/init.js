import chai from 'chai'
import jsdom from 'jsdom'
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

Enzyme.configure({ adapter: new Adapter() })

// Use except
global.expect = chai.expect

// JsDom browser
const { JSDOM } = jsdom;

const { document } = (new JSDOM('')).window;
global.document = document;
global.window = document.defaultView
global.navigator = global.window.navigator
